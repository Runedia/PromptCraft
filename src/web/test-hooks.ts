import type { CardSession } from '@core/types/card.js';
import { useCardStore } from '@/store/cardStore.js';

declare global {
  interface Window {
    __promptcraftTest?: { setSession: (session: CardSession) => void };
  }
}

/**
 * E2E 전용 store 주입 통로. VITE_E2E 빌드에서만 main.tsx가 설치하며,
 * 프로덕션 빌드에는 플래그가 없어 동적 import째로 트리쉐이크된다.
 */
export function installTestHooks(): void {
  window.__promptcraftTest = {
    setSession: (session) => useCardStore.getState().setSession(session),
  };
}
