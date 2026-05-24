/** SQLite datetime('now')(타임존 없는 UTC)를 한국어 상대 시각으로 변환한다. */
export function formatRelativeTime(createdAt: string, now: Date = new Date()): string {
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(createdAt) ? createdAt : `${createdAt.replace(' ', 'T')}Z`;
  const then = new Date(iso);
  const sec = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (sec < 60) return '방금 전';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day === 1) return '어제';
  if (day < 7) return `${day}일 전`;
  return then.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}
