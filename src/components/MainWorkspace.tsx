import React, { useState, useEffect } from "react";
import { Sparkles, Terminal, FileCode, CheckCircle2, AlertCircle, Trash2, HelpCircle } from "lucide-react";
import { CodeFile, Message, Workspace } from "../types";
import ChatPanel from "./ChatPanel";
import FileTabs from "./FileTabs";
import CodeEditor from "./CodeEditor";
import DiffViewer from "./DiffViewer";

const INITIAL_FILES: CodeFile[] = [
  {
    id: "f1",
    name: "App.tsx",
    content: `import React, { useState } from 'react';

// This is your web design sandbox (Vite + React)
export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8 max-w-sm mx-auto bg-[#16161D] border border-[#2D2D35] text-slate-100 mt-12 font-sans select-none rounded-none shadow-2xl">
      {/* Heavy Uppercase Heading */}
      <h1 className="text-3xl font-black italic tracking-tighter leading-none mb-1 text-white uppercase">
        SYSTEM_WORKSTATION
      </h1>
      <p className="text-[10px] text-[#8E8E9F] uppercase tracking-[0.2em] font-bold mb-6">
        PREVIEW_SANDBOX_STATION
      </p>

      <p className="text-xs text-[#8E8E9F] mb-6 leading-relaxed">
        這裡將會同步渲染您在左側對話框或主編輯器中協同撰寫的 Vite / TypeScript 專案。
      </p>

      <div className="flex flex-col items-center gap-4 bg-[#0A0A0F] p-6 border border-[#2D2D35]">
        <div className="text-[10px] font-mono text-[#00FF7F] uppercase tracking-widest font-bold">STATE_COUNTER</div>
        <span className="text-4xl font-black font-mono text-white tracking-widest">{count}</span>
        
        <button
          onClick={() => setCount(count + 1)}
          className="w-full py-2.5 bg-white hover:bg-[#00FF7F] text-black text-xs font-black uppercase tracking-widest transition rounded-none"
        >
          INCREMENT
        </button>
      </div>
    </div>
  );
}`,
    language: "typescript",
  },
  {
    id: "f2",
    name: "utils.ts",
    content: `/**
 * 高階格式化工具箱 (Bold Mono Utility)
 */

// 格式化日期與時間為萬國語口語樣式
export function formatDateTime(date: Date | string | number): string {
  const target = new Date(date);
  if (isNaN(target.getTime())) return "INVALID_TIME";

  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  const hr = String(target.getHours()).padStart(2, '0');
  const min = String(target.getMinutes()).padStart(2, '0');

  return \`\${year}-\${month}-\${day} \${hr}:\${min}\`;
}

// 防抖函式 (Debounce) 草稿 - 可請 AI 優化此處
export function debounce(func: (...args: any[]) => void, delay: number) {
  let timer: any = null;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
}`,
    language: "typescript",
  },
  {
    id: "f3",
    name: "index.html",
    content: `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Workspace Preview</title>
</head>
<body class="bg-[#0F0F12]">
    <div id="root"></div>
</body>
</html>`,
    language: "html",
  },
];

const LOCAL_STORAGE_KEY = "ai_code_workspace_session";

export default function MainWorkspace() {
  const [files, setFiles] = useState<CodeFile[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>("f1");
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewMode, setViewMode] = useState<"edit" | "diff">("edit");
  const [diffRecommendCode, setDiffRecommendCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("google-gemini");

  // Load project session from Local Storage on mount
  useEffect(() => {
    const backup = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (backup) {
      try {
        const parsed = JSON.parse(backup) as {
          files: CodeFile[];
          activeFileId: string;
          messages: Message[];
        };
        if (parsed.files && parsed.files.length > 0) {
          setFiles(parsed.files);
        }
        if (parsed.activeFileId) {
          setActiveFileId(parsed.activeFileId);
        }
        if (parsed.messages) {
          setMessages(parsed.messages);
        }
      } catch (e) {
        console.error("Failed to recover localStorage workspace backup:", e);
      }
    }
  }, []);

  // Save session to Local Storage whenever essential states change
  useEffect(() => {
    const payload = { files, activeFileId, messages };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  }, [files, activeFileId, messages]);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || null;

  // Handles updating code inside active files
  const handleChangeContent = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newContent } : f))
    );
  };

  // Switch tabs
  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
    // Automatically close diff viewer upon tab shifting to prevent viewing mismatched code
    setViewMode("edit");
    setDiffRecommendCode("");
  };

  // Create customized file
  const handleCreateFile = (name: string, content = "") => {
    const ext = name.split(".").pop()?.toLowerCase() || "typescript";
    let lang = "typescript";
    if (ext === "py") lang = "python";
    else if (ext === "html") lang = "html";
    else if (ext === "css") lang = "css";
    else if (ext === "js" || ext === "jsx") lang = "javascript";
    else if (ext === "json") lang = "json";

    const newFile: CodeFile = {
      id: "f_" + Date.now(),
      name,
      content,
      language: lang,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  // Close or remove custom files
  const handleDeleteFile = (id: string) => {
    if (files.length <= 1) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFileId === id) {
      const remaining = files.filter((f) => f.id !== id);
      setActiveFileId(remaining[0].id);
    }
  };

  // Trigger Local Safe notification and actual local file download
  const handleSaveFile = () => {
    if (!activeFile) return;

    try {
      const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = activeFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const feedback: Message = {
        id: "save_" + Date.now(),
        role: "assistant",
        text: `💾 成功將 「${activeFile.name}」 儲存並另存下載至您的本機裝置中！`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, feedback]);
    } catch (err) {
      setErrorMessage("無法進行檔案下載備份，請確認瀏覽器安全限制。");
    }
  };

  // Core API communicator with server proxy
  const handleSendMessage = async (userPromptText: string) => {
    if (!userPromptText.trim() || isLoading) return;

    // Remove any previous general errors
    setErrorMessage(null);

    const newUserMsg: Message = {
      id: "u_" + Date.now(),
      role: "user",
      text: userPromptText,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          messages: updatedMessages.slice(-8), // Send recent context only to keep tokens fast
          currentCode: activeFile?.content || "",
          instruction: userPromptText,
          fileName: activeFile?.name || "index.ts",
          fileLanguage: activeFile?.language || "typescript",
        }),
      });

      let data: any;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        if (!response.ok) {
          throw new Error(`伺服器錯誤 (HTTP ${response.status}): ${responseText || "無說明"}`);
        }
        throw new Error("無法解析後端回傳的資料格式。");
      }

      if (!response.ok) {
        throw new Error(data.error || "連線至後端助理模組時發生問題！");
      }

      // Add AI reply
      const aiReply: Message = {
        id: "ai_" + Date.now(),
        role: "assistant",
        text: data.explanation || "我已分析您的請求，但這次沒有提供特定的程式編修建議。",
        timestamp: new Date().toLocaleTimeString(),
        explanation: data.explanation,
        recommendedCode: data.recommendedCode || undefined,
        changedLines: data.changedLines || undefined,
        fileNameHandled: activeFile?.name,
      };

      setMessages((prev) => [...prev, aiReply]);

      // If AI recommended a substantial code block, activate Diff View automatically!
      if (data.recommendedCode) {
        setDiffRecommendCode(data.recommendedCode);
        setViewMode("diff");
      }
    } catch (err: any) {
      console.error(err);
      const isKeyError = err.message.includes("GEMINI_API_KEY") || err.message.includes("Secrets") || err.message.includes("環境變數");
      setErrorMessage(err.message);

      const errorReply: Message = {
        id: "err_" + Date.now(),
        role: "assistant",
        text: isKeyError
          ? `⚠️ 連線錯誤：後端需要配置 GEMINI_API_KEY。請確保環境變數（例如本機開發為根目錄下的 .env.local 檔案，Vercel 部署則為專案設定裡的 Environment Variables）中已正確填入您的 Gemini API 金鑰。`
          : `⚠️ 對話連線中斷：${err.message}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  // Open diff comparator from previous assistant chat bubble
  const handleOpenDiff = (recommendedCode: string) => {
    setDiffRecommendCode(recommendedCode);
    setViewMode("diff");
  };

  // Overwrite local file with AI suggestions
  const handleAcceptChanges = () => {
    if (!activeFile || !diffRecommendCode) return;
    handleChangeContent(diffRecommendCode);
    setViewMode("edit");
    setDiffRecommendCode("");

    // Notify user
    const successMsg: Message = {
      id: "apply_" + Date.now(),
      role: "assistant",
      text: `✅ 已成功套用變更！「${activeFile.name}」已與 AI 所建議的結構進行同步覆蓋。`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, successMsg]);
  };

  // Discard AI suggestions
  const handleDiscardChanges = () => {
    setViewMode("edit");
    setDiffRecommendCode("");
  };

  // Clear workspace chats and reset files list
  const handleResetWorkspace = () => {
    if (window.confirm("確認要清空此工作區的所有歷史對話並復原檔案範本嗎？")) {
      setFiles(INITIAL_FILES);
      setActiveFileId("f1");
      setMessages([]);
      setViewMode("edit");
      setDiffRecommendCode("");
      setErrorMessage(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <div id="main-workspace" className="flex flex-col h-screen overflow-hidden bg-[#0F0F12] font-sans antialiased text-[#E0E0E6]">
      {/* Universal Workspace Header */}
      <header className="h-[64px] border-b border-[#2D2D35] bg-[#16161D] px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="bg-white text-black font-black px-3 py-1 text-xl tracking-tighter shrink-0">
            CODE_TRYING_AI
          </div>
          <div className="hidden sm:block h-6 w-[1px] bg-[#2D2D35] mx-3"></div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-white">
              智慧語法 & UI 協同工作台
            </h1>
            <p className="text-[9px] text-[#8E8E9F] font-mono tracking-widest uppercase">
              VITE × REACT × TYPESCRIPT × GEMINI 2.4
            </p>
          </div>
        </div>

        {/* Global Control Station */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-[9px] font-mono text-[#00FF7F] border border-[#3D3D48] bg-[#111118] px-3.5 py-1.5 uppercase font-bold tracking-tight">
            <span className="w-1.5 h-1.5 bg-[#00FF7F] animate-pulse"></span>
            <span>PORT_3000_INGRESS_SECURE</span>
          </div>

          <button
            onClick={handleResetWorkspace}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[#2D2D35] hover:border-[#FA5252] hover:text-[#FA5252] text-[#8E8E9F] text-[10px] font-mono tracking-wider font-bold uppercase transition rounded-none mr-1 cursor-pointer"
            title="清空對話與檔案重設"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>RESET_PROJECT</span>
          </button>
        </div>
      </header>

      {/* Main Content Splitted Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: AI Chat Center */}
        <div className="w-[360px] md:w-[420px] lg:w-[460px] shrink-0 h-full border-r border-[#2D2D35]">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            activeFile={activeFile}
            onApplyCode={(code, fName) => {
              setDiffRecommendCode(code);
              // Handle optional case where name doesn't match active
              handleAcceptChanges();
            }}
            onOpenDiff={handleOpenDiff}
            provider={provider}
            onProviderChange={setProvider}
          />
        </div>

        {/* Right pane: Active file viewer & interactive IDE workspace */}
        <div className="flex-1 flex flex-col h-full bg-[#0A0A0F] overflow-hidden">
          {/* Tabs row */}
          <FileTabs
            files={files}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
          />

          {/* Feedback & Error banners */}
          {errorMessage && (
            <div className="bg-[#1C1014] border-b border-[#321319] p-3 px-5 text-xs text-[#F7768E] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#F7768E] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Workspace Body */}
          <div className="flex-1 overflow-hidden relative">
            {activeFile ? (
              viewMode === "diff" && diffRecommendCode ? (
                <DiffViewer
                  fileName={activeFile.name}
                  originalContent={activeFile.content}
                  recommendedContent={diffRecommendCode}
                  onAccept={handleAcceptChanges}
                  onReject={handleDiscardChanges}
                />
              ) : (
                <CodeEditor
                  file={activeFile}
                  onChangeContent={handleChangeContent}
                  onSaveFile={handleSaveFile}
                  onTriggerAIAnalyze={() =>
                    handleSendMessage(`請針對我的 \`${activeFile.name}\` 程式檔案進行代碼邏輯分析、Bug 診斷，並提出最佳化的重構與修飾方案。`)
                  }
                />
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#8E8E9F] p-8">
                <FileCode className="w-12 h-12 text-[#2D2D35] mb-2" />
                <p className="font-mono text-xs uppercase text-[#555561]">EMPTY_WORKSPACE</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
