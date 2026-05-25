import type { Locale } from '@shared/i18n/types.js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { guessBrowserLang, resolveServerLang } from './resolveInitialLang.js';

interface LocaleContextValue {
  lang: Locale;
  setLang: (lang: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  /** 첫 페인트용 초기 lang. 미지정 시 navigator.language로 추정한다. */
  initialLang?: Locale;
  children: React.ReactNode;
}

/**
 * locale 상태를 보유한다. 마운트 시 브라우저 언어로 시작한 뒤, /api/locale 응답으로
 * 서버 설정(config ui.language 우선)을 반영한다. browser guess≠server lang이면
 * 응답 후 server lang으로 갱신된다(M3). 호출자는 한 번만 마운트하면 된다.
 */
export function LocaleProvider({ initialLang, children }: LocaleProviderProps) {
  const [lang, setLangState] = useState<Locale>(() => initialLang ?? guessBrowserLang(typeof navigator !== 'undefined' ? navigator.language : undefined));
  // 사용자가 명시적으로 언어를 바꾼 이후(SettingsSheet 등)에는 뒤늦은 마운트 /api/locale 응답이
  // 그 선택을 silent revert하지 못하도록 한다(I2 race). 외부 setLang 호출 시 set.
  const userOverrodeRef = useRef(false);

  // 외부에 노출하는 setLang: 사용자 명시 변경으로 간주해 override 플래그를 세운다.
  const setLang = useCallback((next: Locale) => {
    userOverrodeRef.current = true;
    setLangState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/locale')
      .then((r) => r.json())
      .then((data: { lang?: unknown }) => {
        // 사용자가 응답 도착 전에 명시적으로 바꿨다면 server 응답을 무시한다(초기 자동 해소 vs 사용자 선택 구분).
        if (cancelled || userOverrodeRef.current) return;
        setLangState((current) => resolveServerLang(current, data.lang));
      })
      .catch(() => {
        // 서버 응답 실패 시 브라우저 추정 값 유지
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({ lang, setLang }), [lang, setLang]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** 현재 locale과 setLang을 반환한다. LocaleProvider 외부에서 호출하면 throws. */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}
