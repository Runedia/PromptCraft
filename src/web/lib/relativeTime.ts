import type { Locale } from '@shared/i18n/types.js';

type Translator = (key: string, vars?: Record<string, string | number>) => string;

/** SQLite datetime('now')(타임존 없는 UTC)를 상대 시각으로 변환한다. */
export function formatRelativeTime(createdAt: string, t: Translator, lang: Locale, now: Date = new Date()): string {
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(createdAt) ? createdAt : `${createdAt.replace(' ', 'T')}Z`;
  const then = new Date(iso);
  const sec = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (sec < 60) return t('web.relativeTime.justNow');
  const min = Math.floor(sec / 60);
  if (min < 60) return t('web.relativeTime.minutesAgo', { n: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t('web.relativeTime.hoursAgo', { n: hr });
  const day = Math.floor(hr / 24);
  if (day === 1) return t('web.relativeTime.yesterday');
  if (day < 7) return t('web.relativeTime.daysAgo', { n: day });
  // 7일 초과 fallback: Intl 날짜 포맷은 t() 소관이 아니므로 lang으로 locale을 결정한다.
  return then.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
