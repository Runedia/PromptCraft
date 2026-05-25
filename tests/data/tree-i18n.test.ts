/**
 * trees/*.json i18n 패리티 테스트
 * 5개 트리 파일의 label/description/roleSuffix 및 cardOverrides 내
 * 모든 leaf text 노드(hint/examples/options[].label/value/description)가 {ko,en} 형태인지 검증한다.
 */
import fs from 'node:fs';
import path from 'node:path';

interface I18nText {
  ko: string;
  en: string;
}

function isI18nText(v: unknown): v is I18nText {
  return typeof v === 'object' && v !== null && 'ko' in v && 'en' in v && typeof (v as I18nText).ko === 'string' && typeof (v as I18nText).en === 'string';
}

function isI18nTextArray(v: unknown): boolean {
  return typeof v === 'object' && v !== null && 'ko' in v && 'en' in v && Array.isArray((v as { ko: unknown }).ko) && Array.isArray((v as { en: unknown }).en);
}

const TREE_FILES = ['feature-impl.json', 'error-solving.json', 'code-review.json', 'concept-learn.json', 'refactoring.json'];

interface TreeJson {
  id: string;
  label: unknown;
  description: unknown;
  roleSuffix?: unknown;
  cardOverrides?: Record<
    string,
    {
      hint?: unknown;
      examples?: unknown;
      defaultValue?: unknown;
      options?: Array<{ value?: unknown; label?: unknown; description?: unknown }>;
      [k: string]: unknown;
    }
  >;
}

function loadTree(fileName: string): TreeJson {
  const filePath = path.join(process.cwd(), 'data', 'trees', fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as TreeJson;
}

describe('trees/*.json i18n 패리티', () => {
  test('트리 파일이 5개다', () => {
    const treesDir = path.join(process.cwd(), 'data', 'trees');
    const files = fs.readdirSync(treesDir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBe(5);
  });

  for (const fileName of TREE_FILES) {
    const tree = loadTree(fileName);

    describe(`tree: ${fileName}`, () => {
      test('label은 비어있지 않은 {ko,en}이어야 한다', () => {
        expect(isI18nText(tree.label)).toBe(true);
        expect((tree.label as I18nText).ko.trim()).not.toBe('');
        expect((tree.label as I18nText).en.trim()).not.toBe('');
      });

      test('description은 비어있지 않은 {ko,en}이어야 한다', () => {
        expect(isI18nText(tree.description)).toBe(true);
        expect((tree.description as I18nText).ko.trim()).not.toBe('');
        expect((tree.description as I18nText).en.trim()).not.toBe('');
      });

      if (tree.roleSuffix !== undefined) {
        test('roleSuffix는 비어있지 않은 {ko,en}이어야 한다', () => {
          expect(isI18nText(tree.roleSuffix)).toBe(true);
          expect((tree.roleSuffix as I18nText).ko.trim()).not.toBe('');
          expect((tree.roleSuffix as I18nText).en.trim()).not.toBe('');
        });
      }

      for (const [cardId, ov] of Object.entries(tree.cardOverrides ?? {})) {
        if (ov.hint !== undefined) {
          test(`cardOverrides.${cardId}.hint는 {ko,en}이어야 한다`, () => {
            expect(isI18nText(ov.hint)).toBe(true);
          });
        }

        if (ov.examples !== undefined) {
          test(`cardOverrides.${cardId}.examples는 ko/en 동일 길이 배열이어야 한다`, () => {
            expect(isI18nTextArray(ov.examples)).toBe(true);
            const ex = ov.examples as { ko: string[]; en: string[] };
            expect(ex.ko.length).toBeGreaterThan(0);
            expect(ex.ko.length).toBe(ex.en.length);
          });
        }

        if (ov.options !== undefined) {
          test(`cardOverrides.${cardId}.options의 value·label이 {ko,en}이어야 한다`, () => {
            for (const opt of ov.options ?? []) {
              expect(isI18nText(opt.value)).toBe(true);
              expect(isI18nText(opt.label)).toBe(true);
              if (opt.description !== undefined) {
                expect(isI18nText(opt.description)).toBe(true);
              }
            }
          });
        }

        if (ov.defaultValue !== undefined) {
          test(`cardOverrides.${cardId}.defaultValue는 {ko,en}이어야 한다`, () => {
            expect(isI18nText(ov.defaultValue)).toBe(true);
          });
        }
      }
    });
  }
});
