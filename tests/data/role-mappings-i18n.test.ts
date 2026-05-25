/**
 * role-mappings.json i18n 패리티 테스트
 * domainRoles / languageRoles / frameworkRoles의 모든 leaf 역할명이 비어있지 않은 {ko,en}인지 검증한다.
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

function expectNonEmptyI18n(v: unknown, ctx: string): void {
  expect(isI18nText(v), `${ctx} is not {ko,en}`).toBe(true);
  const t = v as I18nText;
  expect(t.ko.trim(), `${ctx}.ko empty`).not.toBe('');
  expect(t.en.trim(), `${ctx}.en empty`).not.toBe('');
}

interface RoleMappingsJson {
  domainRoles: Record<string, Record<string, unknown[]>>;
  languageRoles?: Record<string, unknown>;
  frameworkRoles: Record<string, unknown>;
}

function loadMappings(): RoleMappingsJson {
  const file = path.join(process.cwd(), 'data', 'role-mappings.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as RoleMappingsJson;
}

describe('role-mappings.json i18n 패리티', () => {
  const mappings = loadMappings();

  test('domainRoles의 모든 역할명이 {ko,en}이다', () => {
    for (const [domain, treeMap] of Object.entries(mappings.domainRoles)) {
      for (const [treeId, roles] of Object.entries(treeMap)) {
        expect(Array.isArray(roles)).toBe(true);
        roles.forEach((role, idx) => {
          expectNonEmptyI18n(role, `domainRoles.${domain}.${treeId}[${idx}]`);
        });
      }
    }
  });

  test('languageRoles의 모든 역할명이 {ko,en}이다', () => {
    for (const [lang, role] of Object.entries(mappings.languageRoles ?? {})) {
      expectNonEmptyI18n(role, `languageRoles.${lang}`);
    }
  });

  test('frameworkRoles의 모든 역할명이 {ko,en}이다', () => {
    for (const [fw, role] of Object.entries(mappings.frameworkRoles)) {
      expectNonEmptyI18n(role, `frameworkRoles.${fw}`);
    }
  });

  test('domainRoles는 11개 도메인, 각 도메인은 default 키를 보유한다', () => {
    const domains = Object.keys(mappings.domainRoles);
    expect(domains.length).toBe(11);
    for (const d of domains) {
      expect(mappings.domainRoles[d].default, `domain ${d} missing default`).toBeDefined();
    }
  });
});
