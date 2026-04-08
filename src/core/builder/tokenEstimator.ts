/**
 * GPT-4 계열 기준 대략적 토큰 추정 (cl100k_base 근사).
 * 정밀도보다 실시간 피드백용이므로 단순 근사로 충분.
 * - 한국어: ~2자/토큰
 * - 영문/기타: ~4자/토큰
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const koreanChars = (text.match(/[가-힣]/g) ?? []).length;
  const otherChars = text.length - koreanChars;
  return Math.ceil(koreanChars / 2 + otherChars / 4);
}
