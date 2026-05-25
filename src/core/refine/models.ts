export interface RefineModelDef {
  id: string;
  label: string;
  hint: string;
  tier: 'light' | 'quality';
}

/** 권장 모델 shortlist. 실제 선택 가능 모델은 엔드포인트의 /v1/models가 결정한다. */
export const REFINE_MODELS: RefineModelDef[] = [
  { id: 'gemma-4-E4B-it', label: 'Gemma 4 E4B', hint: 'effective 4B · on-device · CPU 친화', tier: 'light' },
  { id: 'Qwen3.5-9B', label: 'Qwen3.5 9B', hint: '9B dense · GPU 권장 · 고품질', tier: 'quality' },
];

export function isRefineModelId(id: string): boolean {
  return REFINE_MODELS.some((m) => m.id === id);
}
