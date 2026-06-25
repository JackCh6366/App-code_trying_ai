# Code Trying AI - 智慧語法 & UI 協同工作台

這是一個基於 Vite + React + Tailwind CSS，並結合 Google Gemini AI 模型的網頁開發協同工作台。原專案由 Google AI Studio 建立，本版本已完成調整優化，使其成為符合一般標準的專案，可直接部署至 **Vercel** 使用，並保留本機開發環境。

---

## 🚀 專案特點

- **AI Code Copilot**: 使用 `gemini-3.5-flash` 模型，支援繁體中文（台灣習慣用語）為您解答問題、分析 Bug 與編修程式碼。
- **Diff 對比檢視**: AI 建議的程式碼可一鍵切換 Diff 視圖，方便比對修改前後的差異，並支援一鍵覆蓋套用。
- **多檔案工作區**: 內置模擬 IDE 的標籤頁系統，可自由新增、修改與刪除檔案。
- **Vercel Serverless 支援**: API 部分已重構為 Vercel Serverless Functions 獨立運作，無須運行傳統 Node.js 伺服器即可部署。

---

## 🛠️ 本機開發 (Local Development)

### 1. 安裝依賴套件
```bash
npm install
```

### 2. 設定環境變數
請在專案根目錄建立 `.env.local` 檔案，並填入您的 Gemini API Key：
```env
GEMINI_API_KEY="您的_GEMINI_API_金鑰"
```
> 💡 可以在 [Google AI Studio](https://aistudio.google.com/) 免費申請 Gemini API 金鑰。

### 3. 啟動本機伺服器
```bash
npm run dev
```
啟動後可在瀏覽器開啟 `http://localhost:3000` 進行開發與調試。本機開發會透過 `server.ts` 同時託管前端 Vite 與後端 API。

---

## ☁️ 部署至 Vercel

本專案已完全相容 Vercel 的託管規範。部署步驟如下：

1. **推送至 GitHub / GitLab / Bitbucket**：將此專案程式碼上傳至您的 Git 儲存庫。
2. **在 Vercel 匯入專案**：
   - 登入 Vercel 控制台，點擊 **Add New > Project**。
   - 匯入您剛剛上傳的 Git 儲存庫。
3. **配置環境變數 (Environment Variables)**：
   - 在專案設定的 `Environment Variables` 區塊中：
     - **Key**: `GEMINI_API_KEY`
     - **Value**: *（填入您的 Gemini API 金鑰）*
4. **部署**：
   - 點擊 **Deploy**，Vercel 會自動辨識專案結構，將前端建置至靜態主機，並將 `api/` 內的路徑自動編譯為 **Serverless Functions**。

---

## 📁 檔案結構說明

- `/src`：React 前端應用程式，包含編輯器、Diff 對比及對話面板。
- `/api`：Vercel Serverless Functions，處理後端 AI 請求的端點：
  - `/api/health`：API 運作狀態檢查。
  - `/api/code/assistant`：處理與 Gemini AI 交互的核心端點。
- `/vercel.json`：Vercel 路由設定檔，用於確保 SPA 路由與 API 正確轉發。
- `/server.ts`：用於本機開發的 Express / Vite 中間件伺服器。
