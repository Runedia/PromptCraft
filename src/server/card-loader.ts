import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CardDefinition } from '../core/types/card.js';

const CARDS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/cards/card-definitions.json');

// 카드 정의는 빌드 산출물(정적)이므로 프로세스 수명 동안 1회만 읽어 파싱한다.
// 세션 생성·트리 조회마다 디스크 read + JSON.parse를 반복하던 비용을 제거한다.
// 실패한 Promise를 캐시에 남기지 않도록 reject 시 캐시를 비워 다음 호출에서 재시도되게 한다.
let _cache: Promise<Record<string, CardDefinition>> | null = null;

export const cardLoader = {
  loadCardDefinitions(): Promise<Record<string, CardDefinition>> {
    if (!_cache) {
      _cache = (Bun.file(CARDS_FILE).json() as Promise<Record<string, CardDefinition>>).catch((err) => {
        _cache = null;
        throw err;
      });
    }
    return _cache;
  },
};
