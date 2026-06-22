import React, { useState } from "react";
import { Sparkles, Send, Bot, User, Code, FileCode, CheckCircle, RefreshCcw } from "lucide-react";
import { Message, CodeFile } from "../types";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeFile: CodeFile | null;
  onApplyCode: (code: string, fileName?: string) => void;
  onOpenDiff: (recommendedCode: string) => void;
}

const TEMPLATE_PROMPTS = [
  {
    icon: "💡",
    label: "編寫防抖 (Debounce) 函式",
    prompt: "請幫我用 TypeScript 寫一個高抗震的高階防抖 (Debounce) 函式，並提供實例說明。",
  },
  {
    icon: "🔍",
    label: "解釋右側程式碼架構",
    prompt: "請詳細解釋右側目前開啟的程式碼，包含變數宣告、各函式的功能以及它遵循的設計模式與軟體架構。",
  },
  {
    icon: "🛠",
    label: "診斷並修復 Bug",
    prompt: "請協同檢查我目前右側開啟的程式碼是否有語法錯誤、記憶體洩漏或潛在的極端狀態 Bug，並提出優化編修建議。",
  },
  {
    icon: "🧪",
    label: "撰寫單元測試",
    prompt: "請為我目前右側的程式碼撰寫優雅易懂的單元測試，涵蓋正常路徑與邊界異常路徑的模擬測試案例。",
  },
];

export default function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
  activeFile,
  onApplyCode,
  onOpenDiff,
}: ChatPanelProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  const handleTemplateClick = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  return (
    <div id="chat-panel" className="flex flex-col h-full bg-[#16161D] border-r border-[#2D2D35] text-[#E0E0E6] font-sans">
      {/* Panel Header */}
      <div className="p-6 border-b border-[#2D2D35] bg-[#111118] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="bg-white text-black font-black px-3 py-1 text-lg tracking-tighter select-none">
            CODE_TRYING_CO_PILOT
          </div>
          {activeFile && (
            <div className="flex items-center gap-1.5 bg-[#22222A] px-2.5 py-1 border border-[#3D3D48]">
              <FileCode className="w-3.5 h-3.5 text-[#00FF7F]" />
              <span className="text-[10px] text-[#E0E0E6] font-mono max-w-[120px] truncate uppercase tracking-tight">
                {activeFile.name}
              </span>
            </div>
          )}
        </div>

        {/* Huge Bold Typography Header */}
        <div className="mt-4">
          <h1 className="text-4xl font-black italic tracking-tighter leading-none text-white uppercase select-none">
            PROMPT<br />CO-PILOT
          </h1>
          <p className="text-[9px] text-[#8E8E9F] uppercase tracking-[0.2em] font-bold mt-1">
            AI CODE REVISION ENGINE
          </p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
        {messages.length === 0 && (
          <div className="h-full flex flex-col justify-center items-center text-center p-6 text-[#8E8E9F]">
            <Bot className="w-12 h-12 text-[#2D2D35] mb-3" />
            <p className="font-bold uppercase tracking-widest text-white text-xs mb-1">
              READY_TO_ARCHITECT
            </p>
            <p className="text-[11px] text-[#8E8E9F] max-w-xs leading-relaxed">
              點擊下方範本引導，或在對話框輸入期望生成的程式碼、邏輯架構，AI 將協助編寫。
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[95%] gap-1.5 ${
              msg.role === "user" ? "ml-auto" : "mr-auto"
            }`}
          >
            {/* Sender Badge */}
            <div
              className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[#8E8E9F] ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "user" ? (
                <>
                  <span>YOU</span>
                  <div className="w-2 h-2 bg-[#4F46E5]"></div>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-[#00FF7F]"></div>
                  <span className="text-[#00FF7F] font-bold">CO-PILOT</span>
                </>
              )}
            </div>

            {/* Bubble Content */}
            <div
              className={`p-4 transition-all duration-150 ${
                msg.role === "user"
                  ? "bg-[#22222A] text-white border border-[#3D3D48]"
                  : "bg-[#0A0A0F] text-[#D1D1D1] border border-[#2D2D35]"
              }`}
            >
              {/* Structured reply layout */}
              {msg.role === "assistant" && (msg.explanation || msg.recommendedCode) ? (
                <div className="space-y-4">
                  {/* Detailed Explanation */}
                  {msg.explanation && (
                    <div className="text-xs leading-relaxed whitespace-pre-wrap">
                      {msg.explanation}
                    </div>
                  )}

                  {/* Suggestion Code Box */}
                  {msg.recommendedCode && (
                    <div className="border border-[#2D2D35] bg-[#111118] p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00FF7F] uppercase tracking-wider">
                          <Code className="w-3.5 h-3.5" />
                          <span>SUGGESTED_{msg.fileNameHandled?.replace(".", "_").toUpperCase() || "CODE"}</span>
                        </div>
                        {msg.changedLines && (
                          <span className="text-[9px] bg-[#22222A] px-2 py-0.5 border border-[#3D3D48] text-white font-mono uppercase">
                            {msg.changedLines}
                          </span>
                        )}
                      </div>

                      {/* Code Peek View */}
                      <div className="bg-[#0A0A0F] p-2.5 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-32 leading-relaxed border border-[#2D2D35]">
                        {msg.recommendedCode.split("\n").slice(0, 5).join("\n")}
                        {msg.recommendedCode.split("\n").length > 5 && (
                          <div className="text-[#555561] italic mt-1">// ... more code lines ...</div>
                        )}
                      </div>

                      {/* Execution Action Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => onOpenDiff(msg.recommendedCode!)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#22222A] hover:bg-[#3D3D48] transition text-[10px] font-mono uppercase font-black text-white border border-[#3D3D48]"
                        >
                          <RefreshCcw className="w-3.5 h-3.5 text-[#00FF7F]" />
                          編修對比
                        </button>
                        <button
                          onClick={() => onApplyCode(msg.recommendedCode!, msg.fileNameHandled)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-[#00FF7F] active:bg-[#00FF7F] transition text-[10px] font-mono uppercase font-black text-black"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          直接覆蓋
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs">{msg.text}</span>
              )}
            </div>
          </div>
        ))}

        {/* AI Processing Animation */}
        {isLoading && (
          <div className="flex flex-col gap-1.5 mr-auto max-w-[90%]">
            <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-[#00FF7F] uppercase">
              <span className="w-2 h-2 bg-[#00FF7F] animate-ping inline-block"></span>
              <span>CO-PILOT IS WRITING...</span>
            </div>
            <div className="p-4 bg-[#0A0A0F] text-[#8E8E9F] border border-[#2D2D35] text-[11px] font-mono space-y-2">
              <div className="flex items-center gap-2 text-white">
                <span className="w-1.5 h-1.5 bg-[#00FF7F]"></span>
                <span>CODE_TRYING AI PARSING & ARCHITECTING</span>
              </div>
              <div className="text-[#555561] select-none leading-relaxed">
                $ gemini-analyze --syntax-tree --lang=zh-tw
                <br />
                &gt; Preparing high-typography responses...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Templates Prompt Shelf */}
      {messages.length < 4 && !isLoading && (
        <div className="p-4 border-t border-[#2D2D35] bg-[#111118]">
          <p className="text-[9px] text-[#8E8E9F] mb-3 uppercase tracking-widest font-black">
            📝 QUICK TEMPLATE EXECUTION:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATE_PROMPTS.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTemplateClick(t.prompt)}
                className="flex items-start text-left p-2 bg-[#0A0A0F] border border-[#2D2D35] hover:border-[#00FF7F] hover:bg-[#16161D] transition cursor-pointer"
              >
                <span className="mr-1.5 text-xs select-none">{t.icon}</span>
                <span className="text-[10px] font-mono text-[#8E8E9F] hover:text-white leading-normal">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Chat form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#2D2D35] bg-[#16161D] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isLoading
              ? "WAITING FOR RESPONSE..."
              : activeFile
              ? `ASK ${activeFile.name.toUpperCase()} REVISION...`
              : "ASK SYNTAX_AI TO REFRACTOR..."
          }
          disabled={isLoading}
          className="flex-1 bg-[#22222A] border border-[#3D3D48] text-xs font-mono text-white placeholder-[#555561] focus:outline-none focus:border-[#00FF7F] px-3.5 py-2.5 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-white text-black hover:bg-[#00FF7F] hover:text-black hover:shadow-lg disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black py-2.5 px-4 text-xs font-black uppercase tracking-wider shrink-0 transition"
        >
          EXECUTE
        </button>
      </form>
    </div>
  );
}
