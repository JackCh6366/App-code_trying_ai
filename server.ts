import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit for large codebase contexts
app.use(express.json({ limit: "15mb" }));

// Helper to initialize Gemini SDK safely and lazy-loaded
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Health check
app.get("/api/health", (req, res) => {
  const apiKeyStatus = process.env.GEMINI_API_KEY ? "CONFIGURED" : "MISSING";
  res.json({
    status: "ok",
    apiKeyStatus,
    timestamp: new Date().toISOString(),
  });
});

// AI Assistant endpoint
app.post("/api/code/assistant", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { messages, currentCode, instruction, fileName, fileLanguage } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      res.status(400).json({
        error: "請在 AI Studio 中設定 `GEMINI_API_KEY` 環境變數（可至右上角 Settings > Secrets 進行配置）才可開始與 AI 進行連線互動。",
      });
      return;
    }

    // Build model prompt context
    const codeContext = currentCode
      ? `目前編輯中的檔案: \`${fileName || "index.ts"}\` (語言: ${fileLanguage || "typescript"})\n\`\`\`${fileLanguage || "typescript"}\n${currentCode}\n\`\`\``
      : `目前編輯區尚未開啟任何檔案或程式碼為空。`;

    const userPrompt = `使用者指令: ${instruction || "協助解答或編寫程式碼"}\n\n${codeContext}`;

    // Map conversation messages to conversational inputs
    const historyContext = (messages || [])
      .map((m: any) => `${m.role === "user" ? "使用者" : "助理"}: ${m.text}`)
      .join("\n");

    const systemInstruction = `你是一位資深的進階 AI 程式碼編寫與編修大師 (AI Code Copilot)。
你熟稔各種程式語言、軟體架構、設計模式以及演算法。

你的核心任務是協助使用者編寫、生成、修改、優化、解釋或偵錯程式碼。
請務必使用『繁體中文』(Traditional Chinese) 來作答。

回覆規範：
請務必遵守 Response Schema 格式規範。
1. 在 [explanation] 寫下詳細且條理清晰的繁體中文分析與邏輯架構說明。如果你指出 Bug，請在這裡說明原因。
2. 如果使用者是指示「編寫」、「編修」、「重構」、「優化」等涉及程式碼修正的操作，請在 [recommendedCode] 中填入『修改完成後的完整程式碼』，以便使用者可以在畫面上直接進行對比 (Diff View) 並按下一鍵覆蓋或接受。請不要提供只有局部省略的片段（例如寫...其餘相同...），這會破壞對比與覆蓋功能。
3. 如果使用者純粹是「問答」或「觀念諮詢」，不需要生成/修改編輯器中的檔案程式碼，則 [recommendedCode] 填寫空字串即可。
4. [changedLines] 簡短摘要本次變更的部分。
5. [language] 請填入精確的程式語言名稱（例如 typescript, javascript, python, html, css, json）。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemInstruction}\n\n=== 歷史對話內容 ===\n${historyContext}\n\n=== 本次操作請求 ===\n${userPrompt}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: {
              type: Type.STRING,
              description: "用繁體中文撰寫程式架構與程式語法說明，甚至是除錯的邏輯細節與修正方針。",
            },
            recommendedCode: {
              type: Type.STRING,
              description: "生成的完整程式碼內容。如需要修改原程式碼，請提供完整包含修改處的新程式碼。如只是單純回答問題且不用修改檔案，可傳空值。",
            },
            changedLines: {
              type: Type.STRING,
              description: "變更部分行數簡介或核心功能異動說明。",
            },
            language: {
              type: Type.STRING,
              description: "程式語言名稱 e.g. typescript, javascript, html, python",
            },
          },
          required: ["explanation"],
        },
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("Gemini 回傳為空。");
    }

    const result = JSON.parse(textResponse);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: error.message || "AI 呼叫失敗，請檢查系統記錄或確認網路狀況。",
    });
  }
});

// Configure Vite or Static server
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Code Assistant full-stack server listening on http://localhost:${PORT}`);
  });
}

setupServer();
