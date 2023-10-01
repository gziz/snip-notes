export interface Workspace {
  id: number;
  name: string;
  path: string;
}
  
export interface File {
  id: number;
  relativePath: string;
  workspaceId: number;
}

export interface Note {
  id: number;
  title: string;
  noteText: string;
  codeText: string;
  startLine: number;
  endLine: number;
  languageId: string;
  category: string;
  fileId: number;
  createdDate: string;
}

export interface DbNote {
  id: number;
  title: string;
  note_text: string;
  code_text: string;
  start_line: number;
  end_line: number;
  language_id: string;
  category: string;
  file_id: number;
  created_date: string;
}

export interface EmojiMap {
  [key: string]: string;
}