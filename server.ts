import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
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

// Robust JSON extraction helper
function parseJSONResponse(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (innerErr) {
        // Fallback
      }
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (innerErr) {
        // Fallback
      }
    }
    throw new Error("無法將 AI 回傳內容解析為 JSON 格式。");
  }
}

// AI Assistant endpoint supporting multiple providers
app.post("/api/analyze", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { provider, messages, currentCode, instruction, fileName, fileLanguage } = req.body;

    // Build model prompt context
    const codeContext = currentCode
      ? `目前編輯中的檔案: \`${fileName || "index.ts"}\` (語言: ${fileLanguage || "typescript"})\n\`\`\`${fileLanguage || "typescript"}\n${currentCode}\n\`\`\``
      : `目前編輯區尚未開啟任何檔案或程式碼為空。`;

    const userPrompt = `使用者指令: ${instruction || "協助解答或編寫程式碼"}\n\n${codeContext}`;

    const systemInstruction = `你是一位資深的進階 AI 程式碼編寫與編修大師 (AI Code Copilot)。
你熟稔各種程式語言、軟體架構、設計模式以及演算法。

你的核心任務是協助使用者編寫、生成、修改、優化、解釋或偵錯程式碼。
請務必使用『繁體中文』(Traditional Chinese) 來作答。

回覆規範：
你必須回傳一個合法的 JSON 物件，包含以下欄位，切勿包含額外贅字或 Markdown 語法（除非被包裹在 JSON 中）：
1. "explanation": 用繁體中文撰寫的詳細且條理清晰的分析與邏輯架構說明。如果你指出 Bug，請在這裡說明原因。
2. "recommendedCode": 如果使用者是指示「編寫」、「編修」、「重構」、「優化」等涉及程式碼修正的操作，請填入『修改完成後的完整程式碼』，以便使用者可以在畫面上直接進行對比 (Diff View) 並按下一鍵覆蓋或接受。請不要提供只有局部省略的片段（例如寫...其餘相同...），這會破壞對比與覆蓋功能。如果純粹是「問答」或不需要修改編輯器中的檔案，填寫空字串即可。
3. "changedLines": 簡短摘要本次變更的部分。
4. "language": 精確的程式語言名稱（例如 typescript, javascript, python, html, css, json）。

JSON 範例格式：
{
  "explanation": "說明的內容...",
  "recommendedCode": "程式碼內容或空字串",
  "changedLines": "修改了哪些部分...",
  "language": "typescript"
}`;

    if (provider === "google-gemini" || provider === "gemini") {
      const ai = getGeminiClient();
      if (!ai) {
        res.status(400).json({
          error: "請設定 `GEMINI_API_KEY` 環境變數。如果是在本機開發，請在專案根目錄建立 `.env.local` 並且加入 `GEMINI_API_KEY=你的金鑰` 後重啟伺服器；如果是部署在 Vercel，請至專案設定 (Settings > Environment Variables) 配置此變數。",
        });
        return;
      }

      // Map conversation messages to conversational inputs
      const historyContext = (messages || [])
        .map((m: any) => `${m.role === "user" ? "使用者" : "助理"}: ${m.text}`)
        .join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
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

    } else {
      const nvidiaApiKey = process.env.NVIDIA_API_KEY;
      if (!nvidiaApiKey || nvidiaApiKey === "MY_NVIDIA_API_KEY" || nvidiaApiKey === "") {
        res.status(400).json({
          error: "請設定 `NVIDIA_API_KEY` 環境變數。如果是在本機開發，請在專案根目錄建立 `.env.local` 並且加入 `NVIDIA_API_KEY=你的金鑰` 後重啟伺服器；如果是部署在 Vercel，請至專案設定 (Settings > Environment Variables) 配置此變數。",
        });
        return;
      }

      let modelName = "";
      if (provider === "nvidia-code") {
        modelName = "google/codegemma-7b";
      } else if (provider === "nvidia") {
        modelName = "nvidia/llama-3.1-nemotron-70b-instruct";
      } else if (provider === "meta") {
        modelName = "meta/llama-3.3-70b-instruct";
      } else {
        res.status(400).json({ error: `不支援的 AI 服務商: ${provider}` });
        return;
      }

      const apiMessages = [
        { role: "system", content: systemInstruction },
        ...(messages || []).map((m: any) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: userPrompt },
      ];

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nvidiaApiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: apiMessages,
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA API 錯誤 (HTTP ${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const textResponse = data.choices?.[0]?.message?.content;
      if (!textResponse) {
        throw new Error("NVIDIA API 回傳為空。");
      }

      const result = parseJSONResponse(textResponse);
      res.json(result);
    }
  } catch (error: any) {
    console.error("Local API Error:", error);
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
