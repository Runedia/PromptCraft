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

export interface RefineAssessment {
  refined: string;
  suggestions: string[];
  rationale?: string;
}

export interface RefineConfig {
  baseUrl: string;
  model: string | null;
  apiKey: string;
  threshold: number;
}
