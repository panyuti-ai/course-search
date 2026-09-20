# 逢甲選課助手（Course Search）

這個專案提供課程搜尋、學生心得、官方課程資訊、AI 修課分析與動態課表規劃。整個網站部署在同一個 Railway 服務：Node.js／Express 提供 `public/` 的前端檔案與 `/api/*` 後端 API，並負責 NID OAuth、資料儲存、逢甲官方資料代理與 AI 呼叫，避免把 API Key 暴露在瀏覽器。

## 重要提醒

> **NID API KEY 每年 7/31 到期，每年必須重新向逢甲大學申請。**
> 申請網址請洽逢甲資訊處或 NID OAuth 服務窗口。

## 架構

```text
使用者瀏覽器
  │
  │ 同一個網域
  ▼
Railway：Node.js／Express（server.js）
  ├─ 提供 public/ 靜態前端
  ├─ 提供 /api/* 後端 API
  ├─ 呼叫逢甲 NID／官方課程資料／第三方 AI
  └─ 連線 Railway PostgreSQL
```

前端呼叫 `/api/*` 時使用相對網址，不需要另外設定後端網址，也沒有第二套前端部署。

## 本地開發（前後端合一）

1. **安裝依賴**

   ```bash
   npm install
   ```

2. **設定環境變數**

   ```bash
   cp .env.example .env
   # 編輯 .env，填入 ANTHROPIC_API_KEY、OPENAI_API_KEY，或 OpenRouter 的 API key
   ```

   OpenRouter 使用 OpenAI-compatible API，可設定：

   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-or-v1-xxxxxx
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   OPENAI_MODEL=openai/gpt-4o-mini
   OPENROUTER_PDF_MODEL=openai/gpt-4o-mini
   OPENROUTER_PDF_ENGINE=mistral-ocr
   ```

   上傳課表 PDF 時，前端會將 PDF 傳到後端 `/api/planner-pdf`，再由後端呼叫 OpenRouter 解析課程、教師、學分與節次；不會把 API key 暴露在前端。`OPENROUTER_PDF_ENGINE=mistral-ocr` 較適合掃描或圖片型 PDF，若要降低成本可改成 `cloudflare-ai`。

3. **啟動伺服器**

   ```bash
   npm start
   ```

   伺服器預設跑在 `http://localhost:3000`。

4. **執行測試**

   ```bash
   npm test
   ```

   測試會檢查 JavaScript 語法、後端健康狀態、主要頁面、登入保護、NID 登入網址，以及三份課程資料的基本完整性。

## 部署：Railway 單一服務

1. 在 Railway 建立專案並連結此 GitHub repo。
2. 在同一個 Railway 專案加入 PostgreSQL；Railway 產生的 `DATABASE_URL` 需提供給網站服務。
3. Railway 會依 `package.json` 安裝依賴並執行 `npm start`。不需要額外的 `railway.json`，也不需要獨立部署前端。
4. 在網站服務設定環境變數：
   - `DATABASE_URL`：Railway PostgreSQL 連線字串。
   - `ANTHROPIC_API_KEY` 或 `OPENAI_API_KEY`：依使用的 AI 供應商擇一設定。
   - 使用 OpenRouter 時，再設定 `AI_PROVIDER=openai`、`OPENAI_BASE_URL=https://openrouter.ai/api/v1`、`OPENAI_MODEL` 與 `OPENROUTER_PDF_MODEL`。
   - `NID_CLIENT_ID`、`NID_CALLBACK_URL`：逢甲 NID OAuth 設定。Callback 必須是網站公開網域下的 `/callback`，例如 `https://fcu-coursesearch.com/callback`。
   - `JWT_SECRET`：請使用足夠長的隨機字串，不可沿用範例值。
   - `CORS_ORIGIN`：可設為 Railway 公開網址或自訂網域，例如 `https://fcu-coursesearch.com`。目前前後端同源，不需填入另一個前端服務網址。
   - `RESEND_API_KEY`、`FEEDBACK_EMAIL`：選填，供意見回饋寄信使用。
5. 在 Railway 為網站服務建立公開網域，或綁定自訂網域。
6. 可將健康檢查路徑設為 `/api/health`；部署後先確認此網址回傳 `{"ok":true,"service":"course-search"}`，再測試課程搜尋、NID 登入、收藏與課表 PDF。

`PORT` 由 Railway 自動注入，Express 會直接使用；前端和 API 位於相同網域，因此不需要 `public/config.js` 或 `API_BASE_URL`。

## 後端 API

### `GET /api/health`

供 Railway 健康檢查與自動化測試確認服務已啟動，不會呼叫資料庫或外部 AI。

```json
{ "ok": true, "service": "course-search" }
```

### `POST /api/analyze`

AI 分析課程是否適合修。

```json
{
  "courseName": "資料結構",
  "tags": ["程式設計", "資料結構"],
  "userContext": "修過 C 語言與演算法"
}
```

### `POST /api/planner-keywords`

從背景說明提取課程關鍵字，供排課評分使用。

```json
{ "userContext": "我是資工系大二，想加強演算法與資料庫" }
```

### `POST /api/planner-pdf`

接收已登入使用者的課表 PDF，交由設定的 OpenAI-compatible／OpenRouter 模型辨識課名、教師、學分與節次。原始 PDF 不會寫入本站資料庫。

### `GET /api/course-grade-rules`

依學期與選課代碼，從逢甲公開教學大綱取得評分項目與百分比。伺服器會快取結果，
課程卡片只在使用者展開「評分方式」時查詢。

```text
/api/course-grade-rules?semester=115-1&selCode=0870
```

```json
{
  "items": [
    { "name": "期中考", "percentage": 30 },
    { "name": "課堂討論參與", "percentage": 40 }
  ],
  "cached": false
}
```

### `GET /api/auth/nid-url`

取得逢甲 NID OAuth 登入網址，前端會將使用者導向逢甲登入頁。

### `POST /api/auth/nid-callback`

接收逢甲 OAuth 回傳的 `user_code`，在期限內向逢甲 API 取得使用者資料，建立或更新本站使用者並簽發 JWT。本站不會接收或儲存使用者的 NID 密碼。

### `GET /api/auth/me`

驗證現有 JWT 並回傳目前登入者資料。

## PDF 與個人資料說明

- 課表 PDF 會經過本站後端傳送至設定的第三方 AI 服務進行辨識。
- 本站不會把原始 PDF 寫入資料庫或永久保存，但第三方服務仍可能依其服務條款處理請求內容。
- 上傳前應遮蔽辨識課程不需要的個人資料。
- 本站資料庫會保存登入者基本 NID 資料、收藏、AI 分析紀錄、已儲存課表與使用者主動送出的意見回饋。
- 正式上線前應確認實際使用的 AI 供應商資料政策，並讓正式隱私權說明與部署設定一致。

## 自動化測試與 GitHub Actions

本機執行：

```bash
npm test
```

其中：

- `npm run check` 檢查後端與前端 JavaScript 語法。
- `node --test` 執行 API、靜態頁面、登入保護、NID OAuth 網址、課程資料及多語隱私文字測試。
- `.github/workflows/ci.yml` 會在每個 Pull Request 與推送到 `main` 時自動執行相同測試；全部通過後才適合合併。

## 更新 Dcard 心得與原文來源

教師的其他課程心得會優先顯示可讀摘要；資料不足時，前端會提供已填好課名與教師的 Dcard 搜尋。若要讓使用者直接開啟原始文章：

1. 設定 `DCARD_COOKIE` 後抓取公開文章索引：

   ```bash
   npm run crawl-dcard
   ```

2. 將文章網址、標題與公開互動數掛回心得資料：

   ```bash
   npm run attach-review-sources
   ```

3. 檢查 `public/course_reviews.json` 的差異後再提交。

`scripts/dcard_raw.json` 保持在 `.gitignore` 中，不會把完整文章與留言發布到前端；前端資料只保留最多五筆原文連結與必要的來源資訊。

## 安全注意事項

- **永遠不要**把 API Key 寫在前端或提交到版本控制
- 部署後將 `CORS_ORIGIN` 設為網站的 Railway 公開網址或自訂網域
- 正式環境必須設定高強度 `JWT_SECRET`，不可沿用 `.env.example` 的範例值
- NID 登入只透過逢甲官方 OAuth；本站不應建立收集 NID 密碼的表單或 endpoint
- NID API Key 每年 7/31 到期，續期後要重新驗證登入 callback
- 課表 PDF 可能含個人資料，必須維持上傳前的隱私告知並避免記錄原始檔案內容

## 專案結構

```
course-search/
├── public/                     # 由 Express 提供的前端靜態檔案
│   ├── index.html
│   ├── app.js
│   ├── new_styles.css
│   └── *.json                  # 課程資料
├── scripts/                    # 資料處理腳本
├── tests/                      # Node.js 自動化測試
├── .github/workflows/ci.yml    # PR 與 main 的自動測試
├── server.js                   # Railway 上的 Express 前後端入口
├── .env.example                # 環境變數樣板
├── package.json
└── package-lock.json
```
