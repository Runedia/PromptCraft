import type { FileLineRange, MentionReference } from '../../shared/fileAnnotation.js';

const MENTION_PATTERN = /@([\w.\s/-]+(?:#L\d+(?:-\d+)?)?)/g;
const LINE_RANGE_REGEX = /^([^#]+)(?:#L(\d+)(?:-(\d+))?)?$/;

const EXT_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  md: 'markdown',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  html: 'html',
  css: 'css',
  scss: 'scss',
  sh: 'bash',
  sql: 'sql',
};

export function parseMentions(text: string): MentionReference[] {
  const refs: MentionReference[] = [];
  for (const match of text.matchAll(MENTION_PATTERN)) {
    const raw = match[0];
    const { filename: filePath, lineStart, lineEnd } = parseLineRange(match[1]);
    refs.push({ raw, filePath, lineStart, lineEnd, offset: match.index ?? 0 });
  }
  return refs;
}

export function parseLineRange(mention: string): FileLineRange {
  const m = mention.match(LINE_RANGE_REGEX);
  if (!m) return { filename: mention };
  return {
    filename: m[1],
    lineStart: m[2] !== undefined ? Number(m[2]) : undefined,
    lineEnd: m[3] !== undefined ? Number(m[3]) : undefined,
  };
}

export function extractLines(content: string, lineStart?: number, lineEnd?: number): string {
  if (lineStart === undefined) return content;
  const lines = content.split('\n');
  const start = Math.max(0, lineStart - 1);
  const end = lineEnd !== undefined ? Math.min(lines.length, lineEnd) : start + 1;
  return lines.slice(start, end).join('\n');
}

export function inferLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  return EXT_LANG[ext] ?? 'text';
}
