export type VibeLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type RefineMode = 'coach' | 'polish';
export type RefineVerdict = 'polished' | 'needs-improvement';
export type VibeDimension = 'DECOMP' | 'VERIFY' | 'ORCH' | 'FAIL' | 'CTX' | 'META';

export interface StructuralScore {
  completeness: number; // 0..100
  filledCards: string[];
  signals: { filePaths: number; stepEnumeration: boolean; upperCards: string[] };
  missing: string[];
}

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface DimensionScore {
  dimension: VibeDimension;
  level: VibeLevel;
  note: string;
}

export interface RefineAssessment {
  level: VibeLevel;
  quality: number; // 0..100
  dimensions: DimensionScore[];
  verdict: RefineVerdict;
  refined?: string; // verdict === 'polished'
  coaching?: string[]; // verdict === 'needs-improvement'
  rationale?: string;
}

export interface RefineConfig {
  baseUrl: string;
  model: string | null;
  apiKey: string;
  threshold: number;
}
