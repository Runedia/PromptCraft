/**
 * card-definitions.json i18n 패리티 테스트
 * 모든 카드에 대해 label/template이 {ko,en} 형태이고 비어있지 않은지 검증한다.
 * hint가 존재하면 {ko,en} 형태여야 하고, examples가 존재하면 ko/en 배열 길이가 같아야 한다.
 */
import fs from 'node:fs';
import path from 'node:path';

interface I18nText {
  ko: string;
  en: string;
}
interface I18nTextArray {
  ko: string[];
  en: string[];
}
interface CardDef {
  label: I18nText;
  required: boolean;
  inputType: string;
  template: I18nText;
  hint?: I18nText;
  examples?: I18nTextArray;
  options?: Array<{ value: I18nText; label: I18nText; description?: I18nText }>;
  [k: string]: unknown;
}

function loadDefs(): Record<string, CardDef> {
  const file = path.join(process.cwd(), 'data', 'cards', 'card-definitions.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isI18nText(v: unknown): v is I18nText {
  return typeof v === 'object' && v !== null && 'ko' in v && 'en' in v && typeof (v as I18nText).ko === 'string' && typeof (v as I18nText).en === 'string';
}

describe('card-definitions.json i18n 패리티', () => {
  const defs = loadDefs();
  const entries = Object.entries(defs);

  test('카드 수가 27개다', () => {
    expect(entries.length).toBe(27);
  });

  for (const [id, def] of entries) {
    describe(`card: ${id}`, () => {
      test('label은 비어있지 않은 {ko,en}이어야 한다', () => {
        expect(isI18nText(def.label)).toBe(true);
        expect(def.label.ko.trim()).not.toBe('');
        expect(def.label.en.trim()).not.toBe('');
      });

      test('template은 비어있지 않은 {ko,en}이어야 한다', () => {
        expect(isI18nText(def.template)).toBe(true);
        expect(def.template.ko.trim()).not.toBe('');
        expect(def.template.en.trim()).not.toBe('');
      });

      if (def.hint !== undefined) {
        test('hint가 있으면 {ko,en} 형태여야 한다', () => {
          expect(isI18nText(def.hint)).toBe(true);
          expect((def.hint as I18nText).ko.trim()).not.toBe('');
          expect((def.hint as I18nText).en.trim()).not.toBe('');
        });
      }

      if (def.examples !== undefined) {
        test('examples가 있으면 ko/en 배열 길이가 같아야 한다', () => {
          const ex = def.examples as I18nTextArray;
          expect(Array.isArray(ex.ko)).toBe(true);
          expect(Array.isArray(ex.en)).toBe(true);
          expect(ex.ko.length).toBeGreaterThan(0);
          expect(ex.ko.length).toBe(ex.en.length);
        });
      }

      if (def.options !== undefined) {
        test('options 각 항목의 value가 비어있지 않은 {ko,en}이어야 한다', () => {
          for (const opt of def.options ?? []) {
            expect(isI18nText(opt.value)).toBe(true);
            expect(opt.value.ko.trim()).not.toBe('');
            expect(opt.value.en.trim()).not.toBe('');
          }
        });

        test('options 각 항목의 label이 {ko,en}이어야 한다', () => {
          for (const opt of def.options ?? []) {
            expect(isI18nText(opt.label)).toBe(true);
            expect(opt.label.ko.trim()).not.toBe('');
            expect(opt.label.en.trim()).not.toBe('');
          }
        });

        test('options 각 항목의 description이 있으면 {ko,en}이어야 한다', () => {
          for (const opt of def.options ?? []) {
            if (opt.description !== undefined) {
              expect(isI18nText(opt.description)).toBe(true);
            }
          }
        });
      }
    });
  }
});
