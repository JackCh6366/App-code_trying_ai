import React, { useRef, useEffect } from "react";
import { FileCode, Save, Sparkles, Code } from "lucide-react";
import { CodeFile } from "../types";

interface CodeEditorProps {
  file: CodeFile;
  onChangeContent: (content: string) => void;
  onSaveFile: () => void;
  onTriggerAIAnalyze: () => void;
}

export default function CodeEditor({
  file,
  onChangeContent,
  onSaveFile,
  onTriggerAIAnalyze,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = file.content.split("\n");

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Adjust line numbers height on window or resize events
  useEffect(() => {
    handleScroll();
  }, [file.content]);

  return (
    <div id="code-editor" className="flex flex-col h-full bg-[#0A0A0F] border-b border-[#2D2D35]">
      {/* Editor Sub-Header / Tool Bar */}
      <div className="flex items-center justify-between p-3.5 bg-[#111118] border-b border-[#2D2D35] px-5">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-[#00FF7F]" />
          <span className="text-xs font-mono text-[#D1D1D1] uppercase tracking-tight">
            {file.name} — {(file.content.length / 1024).toFixed(2)} KB ({lines.length} 行)
          </span>
          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-none bg-[#22222A] text-[#00FF7F] border border-[#3D3D48] font-mono">
            {file.language}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          {/* Ask AI to Inspect */}
          <button
            onClick={onTriggerAIAnalyze}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#00FF7F] text-black text-[10px] font-black uppercase tracking-wider transition cursor-pointer rounded-none hover:shadow-lg"
            title="請 AI 分析與優化此檔案"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI_ANALYZE_FILE</span>
          </button>

          {/* Local Save Checkmark */}
          <button
            onClick={onSaveFile}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#16161D] hover:bg-[#22222A] text-[#8E8E9F] hover:text-white border border-[#2D2D35] hover:border-[#3D3D48] text-[10px] uppercase font-black tracking-wider transition cursor-pointer rounded-none"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>SAVE</span>
          </button>
        </div>
      </div>

      {/* Editor Core */}
      <div className="flex-grow flex overflow-hidden relative">
        {/* Line Numbers gutter */}
        <div
          ref={lineNumbersRef}
          className="w-12 bg-[#0A0A0F] text-right pr-4 py-4 select-none overflow-hidden text-xs text-[#3D3D48] font-mono leading-6 border-r border-[#2D2D35]"
        >
          {lines.map((_, idx) => (
            <div key={idx} className="h-6">
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={file.content}
          onChange={(e) => onChangeContent(e.target.value)}
          onScroll={handleScroll}
          className="flex-grow bg-[#0A0A0F] text-[#E0E0E6] p-4 font-mono text-sm leading-6 resize-none outline-none focus:outline-none overflow-y-auto whitespace-pre h-full w-full select-text selection:bg-[#00FF7F]/20 selection:text-white"
          placeholder="// 在此編寫或編修您的程式語法或架構..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
