import React, { useState, useRef } from "react";
import { Plus, X, File, FileCode, FileText, Upload } from "lucide-react";
import { CodeFile } from "../types";

interface FileTabsProps {
  files: CodeFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string, content?: string) => void;
  onDeleteFile: (id: string) => void;
}

export default function FileTabs({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}: FileTabsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;

    for (let i = 0; i < inputFiles.length; i++) {
      const uFile = inputFiles[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        onCreateFile(uFile.name, fileContent || "");
      };
      reader.readAsText(uFile);
    }
    e.target.value = "";
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFileName.trim();

    if (!trimmed) return;
    if (files.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("檔案名稱重複！");
      return;
    }

    // Determine extension/language
    onCreateFile(trimmed);
    setNewFileName("");
    setIsAdding(false);
    setError("");
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "ts":
      case "tsx":
        return <FileCode className="w-4 h-4 text-sky-400" />;
      case "js":
      case "jsx":
        return <FileCode className="w-4 h-4 text-yellow-400" />;
      case "html":
        return <FileCode className="w-4 h-4 text-orange-500" />;
      case "css":
        return <FileCode className="w-4 h-4 text-teal-400" />;
      case "py":
        return <FileCode className="w-4 h-4 text-emerald-400" />;
      case "md":
        return <FileText className="w-4 h-4 text-indigo-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div id="file-tabs" className="bg-[#0A0A0F] border-b border-[#2D2D35] flex items-center px-4 overflow-x-auto min-h-[46px] select-none scrollbar-none">
      {/* File tabs row */}
      <div className="flex items-center gap-1 flex-1">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center gap-2 px-4 py-3 text-xs font-mono cursor-pointer transition-all border-b-2 ${
                isActive
                  ? "bg-[#111118] text-white border-[#00FF7F] font-bold"
                  : "bg-[#0A0A0F] text-[#8E8E9F] border-transparent hover:bg-[#111118]/60 hover:text-white"
              }`}
            >
              {getFileIcon(file.name)}
              <span className="tracking-tight">{file.name}</span>
              {files.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                  className="p-0.5 hover:bg-[#2D2D35] text-[#555561] hover:text-[#FA5252] transition ml-1"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Inline file creator dialog trigger */}
        {isAdding ? (
          <form onSubmit={handleCreate} className="flex items-center gap-1 ml-3 font-mono">
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => {
                setNewFileName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. math.py"
              className="bg-[#22222A] border border-[#3D3D48] text-white px-2 py-1 text-xs outline-none min-w-[140px] focus:border-[#00FF7F] rounded-none"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-white hover:bg-[#00FF7F] text-black font-black text-[10px] uppercase cursor-pointer transition-colors rounded-none"
            >
              ADD
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError("");
              }}
              className="px-2 py-1 bg-[#16161D] hover:bg-[#22222A] text-[#8E8E9F] hover:text-white font-bold text-[10px] uppercase cursor-pointer transition-all border border-[#2D2D35] rounded-none"
            >
              CLOSE
            </button>
            {error && <span className="text-[10px] text-rose-400 ml-1 font-sans">{error}</span>}
          </form>
        ) : (
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            <button
              onClick={() => setIsAdding(true)}
              className="p-1 px-2.5 bg-[#111118] border border-[#2D2D35] hover:border-[#00FF7F] text-[#8E8E9F] hover:text-white active:scale-95 transition cursor-pointer text-[10px] font-mono tracking-wider uppercase font-black"
              title="建立新檔案"
            >
              + ADD_FILE
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
              accept=".txt,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.md"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 px-2.5 bg-[#111118] border border-[#2D2D35] hover:border-[#00FF7F] text-[#8E8E9F] hover:text-white active:scale-95 transition cursor-pointer text-[10px] font-mono tracking-wider uppercase font-black flex items-center gap-1"
              title="匯入讀取本機檔案"
            >
              <Upload className="w-3 h-3 text-[#00FF7F]" />
              IMPORT_FILE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
