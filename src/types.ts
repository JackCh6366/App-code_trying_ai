export interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string; // fallback or clean text containing markdown
  timestamp: string;
  explanation?: string;       // AI explanatory text
  recommendedCode?: string;   // AI suggested/generated code
  changedLines?: string;      // AI explanation of what changed
  isPendingAccept?: boolean;   // If true, prompts a diff visualizer
  fileNameHandled?: string;   // The filename being generated/edited
}

export interface Workspace {
  id: string;
  name: string;
  files: CodeFile[];
  activeFileId: string;
  messages: Message[];
  createdAt: string;
}
