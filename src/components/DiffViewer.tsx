import React from "react";
import { ArrowLeftRight, Check, X, Code, FileDiff } from "lucide-react";

interface DiffViewerProps {
  fileName: string;
  originalContent: string;
  recommendedContent: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function DiffViewer({
  fileName,
  originalContent,
  recommendedContent,
  onAccept,
  onReject,
}: DiffViewerProps) {
  const originalLines = originalContent.split("\n");
  const recommendedLines = recommendedContent.split("\n");

  const maxLines = Math.max(originalLines.length, recommendedLines.length);

  return (
    <div id="diff-viewer" className="flex flex-col h-full bg-[#0A0A0F] text-[#E0E0E6]">
      {/* Diff Header */}
      <div className="p-3.5 border-b border-[#2D2D35] bg-[#111118] flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <FileDiff className="w-4 h-4 text-[#00FF7F]" />
          <span className="text-xs font-mono font-semibold text-[#D1D1D1]">
            變更對比檢視: <span className="text-[#00FF7F]">{fileName.toUpperCase()}</span>
          </span>
          <span className="text-[10px] bg-[#22222A] border border-[#3D3D48] text-[#00FF7F] px-2.5 py-0.5 rounded-none font-mono tracking-wider uppercase font-bold">
            PROPOSED_BY_AI
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#16161D] hover:bg-[#22222A] text-[#8E8E9F] hover:text-white border border-[#2D2D35] hover:border-[#3D3D48] text-[10px] font-black uppercase tracking-wider transition cursor-pointer rounded-none"
          >
            <X className="w-3.5 h-3.5" />
            <span>DISCARD</span>
          </button>
          <button
            onClick={onAccept}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#00FF7F] text-black text-[10px] font-black uppercase tracking-wider transition cursor-pointer rounded-none hover:shadow-lg"
          >
            <Check className="w-3.5 h-3.5" />
            <span>ACCEPT_REVISION</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Diff Container */}
      <div className="flex-1 grid grid-cols-2 overflow-hidden h-full">
        {/* Left column: Original Code (Red Tint) */}
        <div className="flex flex-col border-r border-[#2D2D35] overflow-hidden bg-[#0A0A0F]">
          <div className="p-2.5 bg-[#1C1014] text-[#F7768E] text-[10px] font-mono font-bold px-4 border-b border-[#321319] flex justify-between items-center select-none">
            <span>🔴 ORIGINAL_CODE (BEFORE)</span>
            <span className="text-[10px] text-[#F7768E]/60">{originalLines.length} LINES</span>
          </div>

          <div className="flex-grow overflow-y-auto font-mono text-sm leading-6 p-4 select-none relative scrollbar-thin">
            {originalLines.map((line, idx) => (
              <div
                key={idx}
                className="flex items-start group hover:bg-rose-950/10 transition-all border-l-2 border-rose-500/20"
              >
                <span className="w-8 text-right pr-3.5 text-rose-600/40 text-[11px] select-none shrink-0 border-r border-rose-950/10">
                  {idx + 1}
                </span>
                <span className="pl-3 text-rose-300 whitespace-pre max-w-full overflow-x-auto truncate">
                  - {line || " "}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: AI Proposed Code (Green Tint) */}
        <div className="flex flex-col overflow-hidden bg-[#0a0f0a]/30">
          <div className="p-2.5 bg-[#0C1510] text-[#00FF7F] text-[10px] font-mono font-bold px-4 border-b border-[#0F2218] flex justify-between items-center select-none">
            <span>🟢 AI_PROPOSED_METRIC (AFTER)</span>
            <span className="text-[10px] text-[#00FF7F]/60">{recommendedLines.length} LINES</span>
          </div>

          <div className="flex-grow overflow-y-auto font-mono text-sm leading-6 p-4 select-none relative scrollbar-thin">
            {recommendedLines.map((line, idx) => (
              <div
                key={idx}
                className="flex items-start group hover:bg-emerald-950/10 transition-all border-l-2 border-emerald-500/20"
              >
                <span className="w-8 text-right pr-3.5 text-[#00FF7F]/30 text-[11px] select-none shrink-0 border-r border-emerald-950/10">
                  {idx + 1}
                </span>
                <span className="pl-3 text-emerald-200 whitespace-pre max-w-full overflow-x-auto truncate">
                  + {line || " "}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dual action warning footer */}
      <div className="p-4.5 border-t border-[#2D2D35] bg-[#111118]/95 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6">
        <div className="text-xs text-[#8E8E9F] max-w-xl leading-relaxed">
          請仔細比對左右兩側程式區塊的增刪變更。
          點擊「ACCEPT_REVISION」將會以 AI 演算結果完全覆蓋本機編輯暫存；如果想保留目前的草稿，請點擊「DISCARD」。
        </div>

        <div className="flex gap-2 shrink-0 font-mono">
          <button
            onClick={onReject}
            className="px-4 py-2 bg-[#16161D] hover:bg-[#22222A] text-xs border border-[#2D2D35] text-[#D1D1D1] font-bold transition cursor-pointer rounded-none"
          >
            RETURN_TO_EDITOR
          </button>
          <button
            onClick={onAccept}
            className="px-5 py-2 bg-white hover:bg-[#00FF7F] hover:text-black text-xs rounded-none text-black font-black transition cursor-pointer flex items-center gap-1.5 shadow"
          >
            <Check className="w-4 h-4" />
            COVER_AND_OVERWRITE
          </button>
        </div>
      </div>
    </div>
  );
}
