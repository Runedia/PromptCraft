/**
 * GPT-4 계열 기준 대략적 토큰 추정 (cl100k_base 근사).
 * 정밀도보다 실시간 피드백용이므로 단순 근사로 충분.
 * - 한국어: ~2자/토큰
 * - 영문/기타: ~4자/토큰
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // 매치 배열을 물질화하지 않고 단일 패스로 한글 음절(U+AC00–U+D7A3, /[가-힣]/ 와 동일 범위)만 카운트한다.
  // 긴 한국어 프롬프트에서 임시 문자열·배열 할당과 정규식 백트래킹을 제거한다.
  let koreanChars = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) koreanChars++;
  }
  const otherChars = text.length - koreanChars;
  return Math.ceil(koreanChars / 2 + otherChars / 4);
}
