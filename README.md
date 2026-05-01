# 逢甲選課助手（Course Search）

這個專案提供一個前端搜尋介面與 Node.js 後端代理服務，協助在不暴露 AI API Key 的情況下提供 AI 修課分析。

## 重要提醒

> **NID API KEY 每年 7/31 到期，每年必須重新向逢甲大學申請。**
> 申請網址請洽逢甲資訊處或 NID OAuth 服務窗口。

## 架構

```
前端 (Vercel)          後端 (Railway)
public/               server.js
  index.html    →  →    /api/analyze
  app.js              /api/planner-keywords
  config.js           /api/auth/login  (NID 登入，目前為假 endpoint)
```

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

3. **設定前端 API 網址**

   本地開發時前後端跑同一個 server，`config.js` 留空即可：

   ```bash
   cp public/config.example.js public/config.js
   # 保持 window.API_BASE_URL = '' 不變
   ```

4. **啟動伺服器**

   ```bash
   npm start
   ```

   伺服器預設跑在 `http://localhost:3000`。

## 部署：前端（Vercel）+ 後端（Railway）

### 後端部署到 Railway

1. 在 Railway 建立新專案，連結此 repo
2. Railway 會自動偵測 Node.js 並執行 `npm start`
3. 在 Railway 的環境變數設定頁加入：
   - `ANTHROPIC_API_KEY`（或 `OPENAI_API_KEY`）
   - 使用 OpenRouter 時加上 `AI_PROVIDER=openai`、`OPENAI_BASE_URL=https://openrouter.ai/api/v1`、OpenRouter model id，以及 PDF 辨識用的 `OPENROUTER_PDF_MODEL`
   - `CORS_ORIGIN`：填入你的 Vercel 前端網址，例如 `https://your-app.vercel.app`
4. 取得 Railway 提供的後端網址（例如 `https://your-backend.railway.app`）

> Railway 需要的設定：已有 `package.json` 的 `start` script，不需要額外的 `railway.json`。

### 前端部署到 Vercel

1. 修改 `public/config.js`，填入 Railway 後端網址：

   ```js
   window.API_BASE_URL = 'https://your-backend.railway.app';
   ```

2. 在 Vercel 建立新專案，連結此 repo
3. Vercel 會讀取 `vercel.json`，自動從 `public/` 目錄 serve 靜態檔案
4. **注意**：`public/config.js` 已加入 `.gitignore`，部署前確認 Vercel 專案目錄有此檔案，或改用 Vercel 的 Build Command 注入

> 若要讓 `config.js` 跟著 repo 一起部署，可從 `.gitignore` 移除 `public/config.js`，但要確保檔案內不含 API key。

## 後端 API

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

### `POST /api/auth/login`

**目前為假 endpoint**，之後會替換成逢甲大學 NID OAuth。

```json
{ "username": "student_id", "password": "password" }
```

## 安全注意事項

- **永遠不要**把 API Key 寫在前端或提交到版本控制
- 部署後設定 `CORS_ORIGIN` 限制只允許你的前端網址
- NID OAuth 整合完成前，`/api/auth/login` 任何帳密都會登入成功，請勿在正式環境使用

## 專案結構

```
course-search/
├── public/                     # 前端靜態檔案（部署到 Vercel）
│   ├── index.html
│   ├── app.js
│   ├── new_styles.css
│   ├── config.js               # 本地設定（已 gitignore）
│   ├── config.example.js       # config.js 樣板
│   └── *.json                  # 課程資料
├── scripts/                    # 資料處理腳本
├── server.js                   # Express 後端（部署到 Railway）
├── vercel.json                 # Vercel 前端部署設定
├── .env.example                # 環境變數樣板
├── package.json
└── package-lock.json
```
