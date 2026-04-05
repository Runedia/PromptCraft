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

export interface QnASelectOption {
  value: string;
  label: string;
}

export type QnAOption = string | QnASelectOption;

export type QnAInputType = 'text' | 'multiline' | 'multiline-mention' | 'select' | 'select-or-text';

export interface QnATreeNode {
  id: string;
  question: string;
  answerKey?: string;
  key?: string;
  inputType: QnAInputType;
  required?: boolean;
  next?: string | null;
  branches?: Record<string, string | null>;
  branchOn?: Record<string, string | null>;
  options?: QnAOption[] | null;
  optionsSource?: string;
  hint?: string | null;
  placeholder?: string | null;
  examples?: string[] | null;
}

export interface QnATree {
  id?: string;
  startNodeId?: string;
  startNode?: string;
  nodes: Record<string, QnATreeNode>;
}

export type QnAAnswers = Record<string, string>;

export interface QnASession {
  sessionId: string;
  treeId: string;
  currentNodeId: string;
  answers: QnAAnswers;
  completed: boolean;
  scanResult: ScanResult | null;
}

export interface QnAQuestion {
  nodeId: string;
  question: string;
  key: string;
  inputType: QnAInputType;
  required: boolean;
  options: QnAOption[] | null;
  hint: string | null;
  placeholder: string | null;
  examples: string[] | null;
}

export interface QnAValidationResult {
  valid: boolean;
  error?: string;
}

export interface QnASubmitSuccess {
  success: true;
  completed: boolean;
}

export interface QnASubmitFailure {
  success: false;
  error: string;
}

export type QnASubmitResult = QnASubmitSuccess | QnASubmitFailure;

export type PromptAnswers = Record<string, string>;

export interface PromptPresetSummary {
  id: string;
  treeId: string;
  name: string;
  description: string;
  examples: string[];
}

export interface PromptPreset extends PromptPresetSummary {
  answers: PromptAnswers;
}

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
