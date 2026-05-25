import { describe, expect, it } from 'bun:test';
import { t } from '../../../src/shared/i18n/t.js';

// 'test' 네임스페이스는 Stage 0 검증 전용 스캐폴드다. 'test.onlyEn'은 en.json에만 두어
// ko→en 폴백 경로를 검증하는 의도적 비대칭 키다. Stage 5C(bundle-parity)에서 'test'
// 네임스페이스 전체를 실제 키로 교체할 예정이다.
describe('t', () => {
  it('점표기 키를 lang별로 조회한다', () => {
    expect(t('test.greeting', 'ko', { name: '루네' })).toBe('안녕 루네');
    expect(t('test.greeting', 'en', { name: 'Rune' })).toBe('Hi Rune');
  });
  it('ko 누락 시 en으로 폴백한다', () => {
    expect(t('test.onlyEn', 'ko')).toBe('EN only');
  });
  it('없는 키는 key 자체를 반환한다', () => {
    expect(t('no.such.key', 'ko')).toBe('no.such.key');
  });
  it('미정의 보간 변수는 플레이스홀더를 보존한다', () => {
    expect(t('test.greeting', 'en', {})).toBe('Hi {{name}}');
  });
  it('vars 없이 호출 가능하다', () => {
    expect(t('test.greeting', 'ko')).toBe('안녕 {{name}}');
  });
});
