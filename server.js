import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import pg from "pg";
import { Resend } from "resend";
const { Pool } = pg;

dotenv.config();

// PostgreSQL 連線
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway.internal") ? false : { rejectUnauthorized: false },
});

// 建立資料表（若不存在）
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      nid TEXT PRIMARY KEY,
      name TEXT,
      unit_name TEXT,
      dept_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      nid TEXT REFERENCES users(nid),
      course_id TEXT,
      course_name TEXT,
      added_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ai_analyses (
      id SERIAL PRIMARY KEY,
      nid TEXT REFERENCES users(nid),
      course_id TEXT,
      course_name TEXT,
      user_context TEXT,
      result TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS planners (
      id SERIAL PRIMARY KEY,
      nid TEXT REFERENCES users(nid),
      name TEXT,
      courses JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS course_dcard_profile (
      id         SERIAL PRIMARY KEY,
      course     TEXT NOT NULL,
      teacher    TEXT NOT NULL,
      tags       JSONB,
      summary    TEXT,
      score      NUMERIC(4,1) CHECK (score >= 0 AND score <= 100),
      rating     NUMERIC(2,1) CHECK (rating >= 1 AND rating <= 5),
      post_count INT DEFAULT 0,
      crawled_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(course, teacher)
    );
    CREATE TABLE IF NOT EXISTS feedbacks (
      id         SERIAL PRIMARY KEY,
      type       TEXT NOT NULL,
      content    TEXT NOT NULL,
      contact    TEXT,
      nid        TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("DB tables ready");
}
initDB().catch(console.error);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;
const MAX_PLANNER_HISTORY = 5;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_DIR = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : path.join(__dirname, "public");

// AI provider 設定：優先用 anthropic，fallback 到 openai
const AI_PROVIDER = process.env.AI_PROVIDER || "anthropic";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENROUTER_PDF_MODEL = process.env.OPENROUTER_PDF_MODEL || process.env.OPENAI_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_PDF_ENGINE = process.env.OPENROUTER_PDF_ENGINE || "mistral-ocr";

function getActiveApiKey() {
  if (AI_PROVIDER === "anthropic") return ANTHROPIC_API_KEY;
  return OPENAI_API_KEY;
}

if (!getActiveApiKey()) {
  console.warn(`[WARN] 尚未設定 ${AI_PROVIDER === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY"}，AI 功能將回傳 503`);
}

// 統一 AI 呼叫介面，回傳純文字內容
async function callAI(prompt, { json = false, temperature = 0.5 } = {}) {
  if (AI_PROVIDER === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        temperature,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error: ${text}`);
    }
    const data = await response.json();
    return data.content?.[0]?.text?.trim() || "";
  } else {
    const body = {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature,
    };
    if (json) body.response_format = { type: "json_object" };
    const response = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error: ${text}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  }
}

async function callOpenAICompatible(messages, { model, json = false, temperature = 0.1, maxTokens = 2048 } = {}) {
  const body = {
    model: model || process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (json) body.response_format = { type: "json_object" };
  const plugins = getOpenRouterPdfPlugins();
  if (plugins) body.plugins = plugins;

  const response = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI-compatible API error: ${text}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function getOpenRouterPdfPlugins() {
  if (!OPENAI_BASE_URL.includes("openrouter.ai")) return undefined;
  return [
    {
      id: "file-parser",
      pdf: {
        engine: OPENROUTER_PDF_ENGINE,
      },
    },
  ];
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  })
);

app.use(express.json({ limit: "15mb" }));

const analyzeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "請求過於頻繁，請稍後再試。" },
});

// 聊天是一來一往的互動，頻率天生比「按一次分析」高，因此放寬到每分鐘 30 次
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "訊息傳送太快，請稍等一下再說。" },
});

// JWT 驗證 middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "請先登入逢甲 NID 帳號。" });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "登入已過期，請重新登入。" });
  }
}

app.post("/api/analyze", requireAuth, analyzeRateLimiter, async (req, res) => {
  if (!getActiveApiKey()) {
    return res.status(503).json({ error: "伺服器尚未設定 AI API key，請稍後再試。" });
  }

  const { courseName, tags, userContext, review } = req.body || {};

  if (!courseName || typeof courseName !== "string") {
    return res.status(400).json({ error: "課程名稱缺失或格式錯誤，請確認後再送出。" });
  }

  if (!userContext || typeof userContext !== "string" || !userContext.trim()) {
    return res.status(400).json({ error: "請提供使用者背景描述，以便 AI 評估適合度。" });
  }

  const sanitizedTags = Array.isArray(tags)
    ? tags.filter((tag) => typeof tag === "string").slice(0, 10)
    : [];

  const trimmedReview =
    typeof review === "string" && review.trim()
      ? review.trim().slice(0, 400)
      : "";

  const prompt = `
你是一位嚴格的大學選課顧問。請根據「學生背景」與「課程資訊」進行深度媒合分析。

請遵守以下**極度嚴格**的規則：

1. **絕對禁止通用效益**：
   - **嚴禁**使用「增強體能」、「放鬆身心」、「培養軟實力」、「團隊合作」、「未來職場加分」等通用理由來推薦課程。
   - 除非學生背景**明確提到**想運動、想放鬆或想學該特定技能，否則一律視為**無關**。

2. **嚴格背景對應**：
   - 課程必須與學生的**科系專業**或**明確興趣**有直接關聯。
   - 範例：
     - 學生是「歷史系」，課程是「大一體育」 -> **不推薦** (原因：體育與歷史專業無關)。
     - 學生是「資工系」，課程是「人力資源管理」 -> **不推薦** (原因：人資與資工專業無關)。
     - 學生是「歷史系」，課程是「中國通史」 -> **推薦**。
     - 學生是「資工系」且**明確表示想找輕鬆的通識**，課程是「《山海經》的神話世界」 -> **推薦** (原因：學生主動提出通識需求，此課符合該需求)。
     - 學生是「歷史系」且**明確表示想練英文口說**，課程是「英語會話」 -> **推薦** (原因：學生主動提出該需求，此課符合該需求)。

3. **判斷邏輯**：
   - 若課程內容直接對應學生背景 -> **推薦**。
   - 若學生**主動提出**專業以外的需求 (例如想找輕鬆的通識、想練英文口說、想運動)，且課程符合該需求 -> **推薦**。
   - 若課程僅提供通用效益 (健康、放鬆等) 且學生未主動要求 -> **不推薦**。
   - 若資訊不足無法判斷 -> **無法判斷**。

4. **輸出格式**：
   - 請用 2-3 句話完成分析。
   - 開頭直接給出結論：「推薦」、「不推薦」或「無法判斷」。
   - 接著簡述原因，**請勿客套**。

學生背景：${userContext.trim()}
課程名稱：${courseName}
課程標籤：${sanitizedTags.length ? sanitizedTags.join("、") : "未提供"}
課程評價摘要：${trimmedReview || "未提供"}
`;

  try {
    const content = await callAI(prompt, { temperature: 0.6 });
    if (!content) return res.status(502).json({ error: "AI 未回傳任何分析內容。" });
    // 存 AI 分析紀錄
    pool.query(
      "INSERT INTO ai_analyses (nid, course_id, course_name, user_context, result) VALUES ($1,$2,$3,$4,$5)",
      [req.user.nid, courseName, courseName, userContext, content]
    ).catch(console.error);

    return res.json({ analysis: content });
  } catch (error) {
    console.error("呼叫 AI 時發生錯誤：", error);
    return res.status(500).json({ error: "伺服器處理 AI 分析時發生錯誤，請稍後再試。" });
  }
});

app.post("/api/planner-pdf", requireAuth, analyzeRateLimiter, async (req, res) => {
  if (AI_PROVIDER === "anthropic" || !OPENAI_API_KEY) {
    return res.status(503).json({ error: "PDF 課表辨識需要 OpenAI-compatible API key，例如 OpenRouter。" });
  }

  const { filename, fileData } = req.body || {};
  if (!filename || typeof filename !== "string" || !filename.toLowerCase().endsWith(".pdf")) {
    return res.status(400).json({ error: "請上傳 PDF 檔案。" });
  }
  if (!fileData || typeof fileData !== "string" || !fileData.startsWith("data:application/pdf;base64,")) {
    return res.status(400).json({ error: "PDF 檔案格式錯誤。" });
  }

  const approxBytes = Math.floor((fileData.length - "data:application/pdf;base64,".length) * 0.75);
  if (approxBytes > 10 * 1024 * 1024) {
    return res.status(413).json({ error: "PDF 檔案過大，請上傳 10MB 以下的課表 PDF。" });
  }

  const prompt = `你是逢甲大學課表 PDF 辨識器。請讀取上傳的 PDF，抽取學生本學期已排課程。

請只回傳 JSON，不要 Markdown，不要說明文字。格式：
{
  "studentGrade": 1,
  "courses": [
    {
      "course": "課程名稱",
      "teacher": "教師姓名，無法辨識則空字串",
      "credits": 2,
      "times": ["MON1", "MON2"],
      "required": false
    }
  ],
  "warnings": ["無法辨識的問題"]
}

規則：
- course 必須是課名，不要包含教室、節次、選課代碼。
- credits 必須是數字；無法辨識用 null。
- times 使用英文星期 MON/TUE/WED/THU/FRI/SAT/SUN 加節次，例如 MON1、TUE10、FRI11。
- 若同一課程跨多個節次或多天，times 放全部節次。
- studentGrade 若從班級或年級資訊看得出來，回傳 1 到 5；無法辨識用 null。
- warnings 用繁體中文簡短列出不確定處，沒有則空陣列。`;

  try {
    const content = await callOpenAICompatible(
      [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "file",
              file: {
                filename,
                file_data: fileData,
              },
            },
          ],
        },
      ],
      { model: OPENROUTER_PDF_MODEL, json: true, temperature: 0.1, maxTokens: 2500 }
    );

    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      console.error("planner-pdf: no JSON found in content:", content.slice(0, 200));
      return res.status(502).json({ error: "AI 回傳格式錯誤。" });
    }

    const parsed = JSON.parse(content.slice(start, end + 1));
    const courses = Array.isArray(parsed.courses)
      ? parsed.courses
          .filter((course) => course && typeof course.course === "string" && course.course.trim())
          .slice(0, 80)
          .map((course) => ({
            course: course.course.trim(),
            teacher: typeof course.teacher === "string" ? course.teacher.trim() : "",
            credits: Number.isFinite(Number(course.credits)) ? Number(course.credits) : null,
            times: Array.isArray(course.times)
              ? course.times
                  .filter((slot) => typeof slot === "string")
                  .map((slot) => slot.trim().toUpperCase())
                  .filter((slot) => /^(MON|TUE|WED|THU|FRI|SAT|SUN)([1-9]|1[0-4])$/.test(slot))
              : [],
            required: Boolean(course.required),
            source: "uploaded_pdf_ai",
          }))
      : [];

    const studentGrade = Number.isInteger(parsed.studentGrade) && parsed.studentGrade >= 1 && parsed.studentGrade <= 5
      ? parsed.studentGrade
      : null;
    const warnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((warning) => typeof warning === "string" && warning.trim()).slice(0, 8)
      : [];

    return res.json({ courses, warnings, studentGrade });
  } catch (error) {
    console.error("planner-pdf error:", error);
    return res.status(500).json({ error: "伺服器處理 PDF 課表辨識時發生錯誤。" });
  }
});

// 從背景說明提取課程關鍵字，供前端排課評分使用
app.post("/api/planner-keywords", requireAuth, analyzeRateLimiter, async (req, res) => {
  if (!getActiveApiKey()) {
    return res.status(503).json({ error: "伺服器尚未設定 AI API key。" });
  }

  const { userContext } = req.body || {};
  if (!userContext || typeof userContext !== "string" || !userContext.trim()) {
    return res.status(400).json({ error: "請提供背景說明。" });
  }

  const prompt = `你是一位大學選課助理。請根據以下學生背景說明，列出最相關的課程關鍵字清單。

規則：
1. 直接提到的課程名稱給最高權重（weight: 10），例如學生說「想修資料結構」→ term: "資料結構"
2. 相關具體課程名稱（包含各種可能的課名寫法）給中高權重（weight: 5-8），例如「歷史相關」→ "中國通史", "台灣史", "世界史", "歷史學導論", "歷史研究法"
3. 相關領域的基礎課程給低權重（weight: 2-4）
4. 關鍵字必須是繁體中文課程名稱或技術詞彙，2-10字；盡量具體（課程名稱），不要只寫領域詞（如不要只寫「歷史」，而是寫「台灣史」）
5. 最多回傳 20 個關鍵字，優先列出具體課程名稱
6. 只回傳 JSON，格式：{"keywords": [{"term": "資料結構", "weight": 10}, ...]}

學生背景說明：${userContext.trim().slice(0, 500)}`;

  try {
    const content = await callAI(prompt, { json: true, temperature: 0.3 });
    if (!content) return res.status(502).json({ error: "AI 未回傳內容。" });

    // 取出第一個 { 到最後一個 } 之間的內容
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      console.error('planner-keywords: no JSON found in content:', content.slice(0, 200));
      return res.status(502).json({ error: "AI 回傳格式錯誤。" });
    }
    const parsed = JSON.parse(content.slice(start, end + 1));
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords
          .filter((k) => k && typeof k.term === "string" && typeof k.weight === "number")
          .slice(0, 20)
      : [];

    return res.json({ keywords });
  } catch (error) {
    console.error("planner-keywords error:", error);
    return res.status(500).json({ error: "伺服器處理時發生錯誤。" });
  }
});

// 課表聊天助理：針對已排出的課表提供說明與調整建議
// 回傳的建議一律交由前端呈現給使用者確認，後端不直接更動任何課表資料
const CHAT_MAX_HISTORY = 16;      // 最多帶入 8 輪對話
const CHAT_MAX_SELECTED = 40;     // 目前課表最多列入的課程數
const CHAT_MAX_CANDIDATES = 60;   // 候選清單最多列入的課程數
const CHAT_MAX_ACTIONS = 5;       // 單次最多建議的調整數

function formatChatCourseLines(courses, prefix) {
  return courses
    .map((course, index) => {
      const slots = Array.isArray(course.timeSlots) && course.timeSlots.length
        ? course.timeSlots.join(", ")
        : "節次未提供";
      const credits = Number.isFinite(course.credits) ? course.credits : "?";
      const teacher = course.teacher ? `｜${course.teacher}` : "";
      const pinned = course.pinned ? "｜已上傳課表（不可移除）" : "";
      const required = course.required ? "｜必修" : "";
      const difficulty = Number.isFinite(course.difficulty) ? `｜難度 ${course.difficulty}/5` : "";
      const score = Number.isFinite(course.score) ? `｜評分 ${course.score}` : "";
      const reason = course.reason ? `\n      推薦原因：${course.reason}` : "";
      return `[${prefix}${index + 1}] ${course.course}${teacher}｜${credits} 學分｜${slots}${required}${pinned}${difficulty}${score}${reason}`;
    })
    .join("\n");
}

// 只取 prompt 需要的欄位，避免把整包課程資料送進 AI
function normalizeChatCourses(list, limit) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === "object" && typeof item.course === "string" && item.course.trim())
    .slice(0, limit)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : String(item.id ?? ""),
      course: item.course.trim().slice(0, 80),
      teacher: typeof item.teacher === "string" ? item.teacher.trim().slice(0, 40) : "",
      credits: Number.isFinite(item.credits) ? item.credits : null,
      // 逐一截斷節次字串：僅限制陣列長度時，單一字串仍可大到把 prompt 撐爆
      timeSlots: Array.isArray(item.timeSlots)
        ? item.timeSlots
            .filter((slot) => typeof slot === "string")
            .slice(0, 12)
            .map((slot) => slot.trim().slice(0, 20))
        : [],
      required: Boolean(item.required),
      pinned: Boolean(item.pinned),
      difficulty: Number.isFinite(item.difficulty) ? item.difficulty : null,
      score: Number.isFinite(item.score) ? item.score : null,
      reason: typeof item.reason === "string" ? item.reason.trim().slice(0, 150) : "",
    }));
}

// 把 AI 回傳的課程代號還原成實際課程；找不到或不合法的一律丟棄，
// 確保前端拿到的建議一定對應到真實存在、且允許被調整的課程
function resolveChatActions(rawActions, selected, candidates) {
  return (Array.isArray(rawActions) ? rawActions : [])
    .map((action) => {
      if (!action || (action.type !== "remove" && action.type !== "add")) return null;
      const ref = typeof action.ref === "string" ? action.ref.trim().toUpperCase() : "";
      const match = ref.match(/^([SC])(\d+)$/);
      if (!match) return null;
      // remove 只能作用在目前課表（S）、add 只能作用在候選清單（C）
      if (action.type === "remove" && match[1] !== "S") return null;
      if (action.type === "add" && match[1] !== "C") return null;
      const pool = match[1] === "S" ? selected : candidates;
      const course = pool[Number(match[2]) - 1];
      if (!course || !course.id) return null;
      // 已上傳課表的固定課程不可移除
      if (action.type === "remove" && course.pinned) return null;
      return {
        type: action.type,
        courseId: course.id,
        courseName: course.course,
        credits: course.credits,
        timeSlots: course.timeSlots,
        reason: typeof action.reason === "string" ? action.reason.trim().slice(0, 100) : "",
      };
    })
    .filter(Boolean)
    .slice(0, CHAT_MAX_ACTIONS);
}

app.post("/api/planner-chat", requireAuth, chatRateLimiter, async (req, res) => {
  if (!getActiveApiKey()) {
    return res.status(503).json({ error: "伺服器尚未設定 AI API key。" });
  }

  const { message, history, planner } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "請輸入訊息。" });
  }

  const selected = normalizeChatCourses(planner?.selected, CHAT_MAX_SELECTED);
  const candidates = normalizeChatCourses(planner?.candidates, CHAT_MAX_CANDIDATES);
  if (!selected.length) {
    return res.status(400).json({ error: "目前沒有課表可以討論，請先產生建議課表。" });
  }

  const targetCredits = Number.isFinite(planner?.targetCredits) ? planner.targetCredits : null;
  const currentCredits = selected.reduce((sum, c) => sum + (Number.isFinite(c.credits) ? c.credits : 0), 0);
  const userContext = typeof planner?.userContext === "string" ? planner.userContext.trim().slice(0, 500) : "";

  // 對話歷史以文字形式帶入 prompt，維持 callAI 對兩種 provider 的相容性
  const historyText = Array.isArray(history)
    ? history
        .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
        .slice(-CHAT_MAX_HISTORY)
        .map((item) => `${item.role === "user" ? "學生" : "助理"}：${item.content.trim().slice(0, 500)}`)
        .join("\n")
    : "";

  const prompt = `你是一位大學選課助理，正在和學生討論他剛排出來的課表。

學生背景：${userContext || "未提供"}
目標學分：${targetCredits ?? "未指定"}
目前已選學分：${currentCredits}

目前課表（代號 S 開頭）：
${formatChatCourseLines(selected, "S") || "（無）"}

可加入的候選課程（代號 C 開頭）：
${formatChatCourseLines(candidates, "C") || "（無）"}

${historyText ? `先前的對話：\n${historyText}\n` : ""}
學生這次說：${message.trim().slice(0, 500)}

請遵守以下規則：
1. 只能使用上面清單裡出現過的課程，**嚴禁自行編造**課程名稱或代號。
2. 要調整課表時，請用課程代號（例如 S2、C7）指定，不要寫課程全名當代號。
3. 標示「已上傳課表（不可移除）」的課程**不可以**建議移除。
4. 單次最多建議 ${CHAT_MAX_ACTIONS} 項調整；若學生只是提問，actions 請留空陣列。
5. 若學生的要求無法達成（例如候選清單裡沒有符合的課），請在 reply 中說明原因，不要硬湊。
6. 清單中的「推薦原因」是排課演算法實際的計分依據，「難度」與「評分」來自課程資料；
   學生問「為什麼推薦這門」或「哪一門比較輕鬆」時，請依據這些資訊回答，不要自行臆測。
   課程沒有附上難度或評分時，請直接說明該課缺少這項資料。
7. reply 用繁體中文，2-4 句，直接說明你做了什麼判斷，不要客套。

只回傳 JSON，格式如下：
{"reply": "說明文字", "actions": [{"type": "remove", "ref": "S2", "reason": "星期五的課"}]}
type 只能是 "remove"（從目前課表移除）或 "add"（從候選清單加入）。`;

  try {
    const content = await callAI(prompt, { json: true, temperature: 0.4 });
    if (!content) return res.status(502).json({ error: "AI 未回傳內容。" });

    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      console.error("planner-chat: no JSON found in content:", content.slice(0, 200));
      return res.status(502).json({ error: "AI 回傳格式錯誤。" });
    }
    const parsed = JSON.parse(content.slice(start, end + 1));

    const actions = resolveChatActions(parsed.actions, selected, candidates);

    const reply = typeof parsed.reply === "string" && parsed.reply.trim()
      ? parsed.reply.trim().slice(0, 600)
      : "我看過你的課表了，但沒有想到合適的調整建議。";

    return res.json({ reply, actions });
  } catch (error) {
    console.error("planner-chat error:", error);
    return res.status(500).json({ error: "伺服器處理時發生錯誤。" });
  }
});

// NID OAuth 設定
const NID_CLIENT_ID = process.env.NID_CLIENT_ID || "639113396662.9a12201d531d490f870468b48ca9ce99.fcu-coursesearch.com";
const NID_AUTH_URL = "https://opendata.fcu.edu.tw/fcuOauth/Auth.aspx";
const NID_API_BASE = "https://opendata.fcu.edu.tw/fcuapi/api";
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";

// 取得 NID 登入跳轉 URL
app.get("/api/auth/nid-url", (req, res) => {
  const callbackUrl = process.env.NID_CALLBACK_URL || "https://fcu-coursesearch.com/callback";
  const authUrl = `${NID_AUTH_URL}?client_id=${encodeURIComponent(NID_CLIENT_ID)}&client_url=${encodeURIComponent(callbackUrl)}`;
  return res.json({ url: authUrl });
});

// NID callback：前端把 user_code 傳過來，後端在 5 秒內換取使用者資料
app.post("/api/auth/nid-callback", async (req, res) => {
  const { user_code, status } = req.body || {};

  if (String(status) !== "200") {
    return res.status(401).json({ error: "NID 登入失敗或使用者拒絕授權。" });
  }
  if (!user_code) {
    return res.status(400).json({ error: "缺少 user_code。" });
  }

  try {
    // 同時呼叫兩支 API（必須在 5 秒內完成）
    const [loginRes, infoRes] = await Promise.all([
      fetch(`${NID_API_BASE}/GetLoginUser?client_id=${encodeURIComponent(NID_CLIENT_ID)}&user_code=${encodeURIComponent(user_code)}`),
      fetch(`${NID_API_BASE}/GetUserInfo?client_id=${encodeURIComponent(NID_CLIENT_ID)}&user_code=${encodeURIComponent(user_code)}`),
    ]);

    const loginData = await loginRes.json();
    const infoData = await infoRes.json();

    const loginUser = loginData?.UserInfo?.[0];
    if (!loginUser || String(loginUser.status) !== "1") {
      return res.status(401).json({ error: "NID 驗證失敗，user_code 無效或已過期。" });
    }

    const userInfo = infoData?.UserInfo?.[0] || {};
    const user = {
      nid: loginUser.stu_id || userInfo.id,
      name: userInfo.name || loginUser.stu_id,
      type: userInfo.type || "學生",
      classname: userInfo.classname || "",
      unit_name: userInfo.unit_name || "",
      dept_name: userInfo.dept_name || "",
    };

    // 建立或更新 users 資料
    await pool.query(
      `INSERT INTO users (nid, name, unit_name, dept_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (nid) DO UPDATE SET name=$2, unit_name=$3, dept_name=$4`,
      [user.nid, user.name, user.unit_name, user.dept_name]
    );

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ success: true, token, user });
  } catch (err) {
    console.error("NID callback error:", err);
    return res.status(500).json({ error: "與 NID 伺服器通訊失敗，請稍後再試。" });
  }
});

// 驗證目前登入狀態
app.get("/api/auth/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "未登入。" });
  try {
    const user = jwt.verify(auth.slice(7), JWT_SECRET);
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: "Token 無效或已過期，請重新登入。" });
  }
});

// ── 收藏 API ──────────────────────────────────────────────
// 取得收藏列表
app.get("/api/favorites", requireAuth, async (req, res) => {
  const rows = await pool.query("SELECT * FROM favorites WHERE nid=$1 ORDER BY added_at DESC", [req.user.nid]);
  res.json({ favorites: rows.rows });
});

// 新增收藏
app.post("/api/favorites", requireAuth, async (req, res) => {
  const { course_id, course_name } = req.body || {};
  if (!course_id) return res.status(400).json({ error: "缺少 course_id。" });
  const exists = await pool.query("SELECT id FROM favorites WHERE nid=$1 AND course_id=$2", [req.user.nid, course_id]);
  if (exists.rows.length) return res.json({ message: "已在收藏中。" });
  const row = await pool.query(
    "INSERT INTO favorites (nid, course_id, course_name) VALUES ($1,$2,$3) RETURNING *",
    [req.user.nid, course_id, course_name]
  );
  res.json({ favorite: row.rows[0] });
});

// 刪除收藏
app.delete("/api/favorites/:course_id", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM favorites WHERE nid=$1 AND course_id=$2", [req.user.nid, req.params.course_id]);
  res.json({ success: true });
});

// ── AI 分析紀錄 API ───────────────────────────────────────
// 取得紀錄
app.get("/api/analyses", requireAuth, async (req, res) => {
  const rows = await pool.query("SELECT * FROM ai_analyses WHERE nid=$1 ORDER BY created_at DESC LIMIT 50", [req.user.nid]);
  res.json({ analyses: rows.rows });
});

// ── 排課計畫 API ──────────────────────────────────────────
// 取得所有計畫
app.get("/api/planners", requireAuth, async (req, res) => {
  const rows = await pool.query(
    "SELECT * FROM planners WHERE nid=$1 ORDER BY updated_at DESC LIMIT $2",
    [req.user.nid, MAX_PLANNER_HISTORY]
  );
  res.json({ planners: rows.rows });
});

// 新增計畫
app.post("/api/planners", requireAuth, async (req, res) => {
  const { name, courses } = req.body || {};
  if (!name) return res.status(400).json({ error: "請提供計畫名稱。" });
  const row = await pool.query(
    "INSERT INTO planners (nid, name, courses) VALUES ($1,$2,$3) RETURNING *",
    [req.user.nid, name, JSON.stringify(courses || [])]
  );
  await pool.query(
    `DELETE FROM planners
     WHERE id IN (
       SELECT id FROM planners
       WHERE nid=$1
       ORDER BY updated_at DESC
       OFFSET $2
     )`,
    [req.user.nid, MAX_PLANNER_HISTORY]
  );
  res.json({ planner: row.rows[0] });
});

// 更新計畫
app.put("/api/planners/:id", requireAuth, async (req, res) => {
  const { name, courses } = req.body || {};
  await pool.query(
    "UPDATE planners SET name=COALESCE($1,name), courses=COALESCE($2,courses), updated_at=NOW() WHERE id=$3 AND nid=$4",
    [name, courses ? JSON.stringify(courses) : null, req.params.id, req.user.nid]
  );
  res.json({ success: true });
});

// 刪除計畫
app.delete("/api/planners/:id", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM planners WHERE id=$1 AND nid=$2", [req.params.id, req.user.nid]);
  res.json({ success: true });
});

// ── 意見回饋 API ──────────────────────────────────────────
const feedbackRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "提交過於頻繁，請稍後再試。" },
});

const FEEDBACK_EMAIL = process.env.FEEDBACK_EMAIL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
if (resend) {
  console.log("[email] Resend 已初始化，回饋信件將寄至：", FEEDBACK_EMAIL);
} else {
  console.warn("[email] 未設定 RESEND_API_KEY，回饋信件功能已停用。");
}

// 測試寄信端點（僅供開發者使用）
app.get("/api/feedback/email-test", async (req, res) => {
  if (!resend) return res.json({ ok: false, reason: "未設定 RESEND_API_KEY" });
  if (!FEEDBACK_EMAIL) return res.json({ ok: false, reason: "未設定 FEEDBACK_EMAIL" });
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: FEEDBACK_EMAIL,
      subject: "[選課助手] 測試信件",
      text: "這是一封測試信件，確認 Resend 寄信功能正常。",
    });
    return res.json({ ok: true, message: `測試信件已寄至 ${FEEDBACK_EMAIL}` });
  } catch (err) {
    return res.json({ ok: false, reason: err.message });
  }
});

app.post("/api/feedback", feedbackRateLimiter, async (req, res) => {
  const { type, content, contact } = req.body || {};

  const validTypes = ["功能建議", "問題回報", "其他"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "回饋類型不正確。" });
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "請填寫回饋內容。" });
  }
  if (content.trim().length > 2000) {
    return res.status(400).json({ error: "回饋內容不得超過 2000 字。" });
  }

  // 取得登入者 nid（選填）
  let nid = null;
  try {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
      nid = decoded.nid || null;
    }
  } catch {}

  const sanitizedContact = typeof contact === "string" ? contact.trim().slice(0, 200) : null;

  try {
    await pool.query(
      "INSERT INTO feedbacks (type, content, contact, nid) VALUES ($1,$2,$3,$4)",
      [type, content.trim(), sanitizedContact || null, nid]
    );

    if (resend && FEEDBACK_EMAIL) {
      resend.emails.send({
        from: "onboarding@resend.dev",
        to: FEEDBACK_EMAIL,
        subject: `[選課助手回饋] ${type}`,
        text: [
          `類型：${type}`,
          `提交者 NID：${nid || "（未登入）"}`,
          `聯絡方式：${sanitizedContact || "（未填寫）"}`,
          "",
          "內容：",
          content.trim(),
        ].join("\n"),
      }).catch((mailErr) => console.error("[feedback] 寄信失敗：", mailErr.message));
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("feedback error:", error);
    return res.status(500).json({ error: "伺服器處理時發生錯誤，請稍後再試。" });
  }
});

app.use(express.static(STATIC_DIR));

app.get("/callback", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "callback.html"));
});

app.post("/callback", express.urlencoded({ extended: false }), (req, res) => {
  const { status, message, user_code } = req.body || {};
  const qs = new URLSearchParams({ status: status || '', message: message || '', user_code: user_code || '' }).toString();
  res.redirect(`/callback?${qs}`);
});

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Course search backend running on http://localhost:${PORT} (AI provider: ${AI_PROVIDER})`);
});
