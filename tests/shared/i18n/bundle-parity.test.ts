import { describe, expect, it } from 'bun:test';
import en from '../../../src/shared/i18n/locales/en.json' with { type: 'json' };
import ko from '../../../src/shared/i18n/locales/ko.json' with { type: 'json' };

// 'test' 네임스페이스는 Stage 0 검증용 스캐폴드 fixture다.
// 'test.onlyEn'은 ko→en 폴백 경로 검증을 위해 en.json에만 존재하는 의도적 비대칭 키다.
// production 네임스페이스(core, web, cli)의 대칭성만 보장하면 충분하므로 test.* 는 검사에서 제외한다.
const PRODUCTION_NAMESPACES = new Set(['core', 'web', 'cli']);

function flatten(o: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(o).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === 'object' && !Array.isArray(v) ? flatten(v as Record<string, unknown>, key) : [key];
  });
}

function productionKeys(bundle: Record<string, unknown>): string[] {
  return flatten(bundle).filter((k) => PRODUCTION_NAMESPACES.has(k.split('.')[0]));
}

describe('locale 번들 정합성', () => {
  it('ko와 en의 production 키 세트가 동일하다 (core, web, cli 네임스페이스)', () => {
    const koKeys = productionKeys(ko as Record<string, unknown>).sort();
    const enKeys = productionKeys(en as Record<string, unknown>).sort();
    expect(koKeys).toEqual(enKeys);
  });

  it('production 번들에 빈 문자열 값이 없다', () => {
    const checkEmpty = (bundle: Record<string, unknown>, locale: string) => {
      const empties = flatten(bundle)
        .filter((k) => PRODUCTION_NAMESPACES.has(k.split('.')[0]))
        .filter((k) => {
          const val = k.split('.').reduce<unknown>((acc, part) => {
            if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
            return undefined;
          }, bundle);
          return val === '';
        });
      if (empties.length > 0) {
        throw new Error(`[${locale}] 빈 문자열 값 발견: ${empties.join(', ')}`);
      }
    };
    checkEmpty(ko as Record<string, unknown>, 'ko');
    checkEmpty(en as Record<string, unknown>, 'en');
  });
});
