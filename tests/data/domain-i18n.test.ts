/**
 * domains/*.json i18n 패리티 테스트
 * 7개 도메인 파일의 cardOverrides 내 모든 leaf text 노드가 {ko,en} 형태인지 재귀 검증한다.
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

/** examples는 Record<treeId, I18nTextArray> | I18nTextArray 형태로 들어온다.
 * I18nTextArray = {ko: string[], en: string[]} */
function isI18nTextArray(v: unknown): boolean {
  return typeof v === 'object' && v !== null && 'ko' in v && 'en' in v && Array.isArray((v as { ko: unknown }).ko) && Array.isArray((v as { en: unknown }).en);
}

/** examples 형태 확인: I18nTextArray 또는 Record<string, I18nTextArray> */
function validateExamples(examples: unknown, domainFile: string, cardId: string): void {
  if (isI18nTextArray(examples)) {
    // Direct I18nTextArray form
    const ex = examples as { ko: string[]; en: string[] };
    expect(ex.ko.length).toBeGreaterThan(0);
    expect(ex.ko.length).toBe(ex.en.length);
  } else if (typeof examples === 'object' && examples !== null) {
    // Record<treeId, I18nTextArray> form
    for (const [treeId, arr] of Object.entries(examples)) {
      expect(isI18nTextArray(arr)).toBe(true);
      if (isI18nTextArray(arr)) {
        const typedArr = arr as { ko: string[]; en: string[] };
        expect(typedArr.ko.length).toBeGreaterThan(0);
        expect(typedArr.ko.length).toBe(typedArr.en.length);
      } else {
        throw new Error(`${domainFile} → cardOverrides.${cardId}.examples.${treeId} is not I18nTextArray`);
      }
    }
  } else {
    throw new Error(`${domainFile} → cardOverrides.${cardId}.examples has unexpected type`);
  }
}

const DOMAIN_FILES = ['general.json', 'web-frontend.json', 'web-backend.json', 'data-ml.json', 'desktop.json', 'mobile.json', 'systems.json'];

describe('domains/*.json i18n 패리티', () => {
  test('도메인 파일이 7개다', () => {
    const domainsDir = path.join(process.cwd(), 'data', 'domains');
    const files = fs.readdirSync(domainsDir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBe(7);
  });

  for (const fileName of DOMAIN_FILES) {
    const filePath = path.join(process.cwd(), 'data', 'domains', fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
      domain: string;
      cardOverrides: Record<
        string,
        {
          hint?: unknown;
          label?: unknown;
          examples?: unknown;
          [k: string]: unknown;
        }
      >;
    };

    describe(`domain: ${fileName}`, () => {
      for (const [cardId, override] of Object.entries(data.cardOverrides)) {
        if (override.hint !== undefined) {
          test(`${cardId}.hint는 {ko,en}이어야 한다`, () => {
            expect(isI18nText(override.hint)).toBe(true);
            expect((override.hint as I18nText).ko.trim()).not.toBe('');
            expect((override.hint as I18nText).en.trim()).not.toBe('');
          });
        }

        if (override.label !== undefined) {
          test(`${cardId}.label은 {ko,en}이어야 한다`, () => {
            expect(isI18nText(override.label)).toBe(true);
            expect((override.label as I18nText).ko.trim()).not.toBe('');
            expect((override.label as I18nText).en.trim()).not.toBe('');
          });
        }

        if (override.examples !== undefined) {
          test(`${cardId}.examples는 I18nTextArray 또는 Record<treeId,I18nTextArray>이어야 한다`, () => {
            validateExamples(override.examples, fileName, cardId);
          });
        }
      }
    });
  }
});
