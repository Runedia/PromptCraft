import type { Ignore } from 'ignore';

export interface ScanLanguage {
  name: string;
  extension: string;
  count: number;
  percentage: number;
}

export interface ScanFramework {
  name: string;
  version: string | null;
  source: string;
}

export interface ScanStructureNode {
  name: string;
  children: Array<string | ScanStructureNode>;
}

export interface ScanTimings {
  languagesMs: number;
  frameworksMs: number;
  structureMs: number;
  totalMs: number;
}

export interface IgnoreRules {
  ig: Ignore;
  source: 'gitignore' | 'default';
}

export interface ScanResult {
  path: string;
  languages: ScanLanguage[];
  frameworks: ScanFramework[];
  structure: ScanStructureNode;
  packageManager: 'pnpm' | 'yarn' | 'npm' | null;
  hasEnv: boolean;
  configFiles: string[];
  ignoreSource: IgnoreRules['source'];
  scannedAt: string;
  timings?: ScanTimings;
}

export type PromptAnswers = Record<string, string>;

export interface HistorySaveInput {
  treeId: string;
  situation: string;
  prompt: string;
  scanPath?: string | null;
  answers: PromptAnswers;
}

export interface HistoryRecord {
  id: number;
  treeId: string;
  situation: string;
  prompt: string;
  scanPath: string | null;
  answers: PromptAnswers;
  createdAt: string;
}

export interface TemplateSaveInput {
  name: string;
  treeId: string;
  answers: PromptAnswers;
}

export interface TemplateUpdateInput {
  name?: string;
  treeId?: string;
  answers?: PromptAnswers;
}

export interface TemplateRecord {
  id: number;
  name: string;
  treeId: string;
  answers: PromptAnswers;
  createdAt: string;
  updatedAt: string;
}
