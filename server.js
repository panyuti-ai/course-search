import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_DIR = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : path.join(__dirname, "public");

// AI provider 設定：優先用 anthropic，fallback 到 openai
const AI_PROVIDER = process.env.AI_PROVIDER || "anthropic";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

app.use(express.json({ limit: "1mb" }));

const analyzeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "請求過於頻繁，請稍後再試。" },
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

3. **判斷邏輯**：
   - 若課程內容直接對應學生背景 -> **推薦**。
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
    return res.json({ analysis: content });
  } catch (error) {
    console.error("呼叫 AI 時發生錯誤：", error);
    return res.status(500).json({ error: "伺服器處理 AI 分析時發生錯誤，請稍後再試。" });
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

app.use(express.static(STATIC_DIR));

app.get("/callback", (req, res) => {
  res.sendFile(path.join(__dirname, STATIC_DIR, "callback.html"));
});

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Course search backend running on http://localhost:${PORT} (AI provider: ${AI_PROVIDER})`);
});
