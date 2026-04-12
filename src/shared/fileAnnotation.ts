export interface FileLineRange {
  filename: string;
  lineStart?: number;
  lineEnd?: number;
}

export interface FileAttachment {
  filePath: string;
  displayPath: string;
  lineStart?: number;
  lineEnd?: number;
  content: string;
  language: string;
  totalLines: number;
}

export interface MentionReference {
  raw: string;
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  offset: number;
}
