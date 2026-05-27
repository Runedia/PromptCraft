export type LangRole = 'primary' | 'template' | 'config';
export interface LangEntry {
  name: string;
  role: LangRole;
}
interface LinguistLang {
  type?: string;
  extensions?: string[];
}
export type LinguistYaml = Record<string, LinguistLang>;

// 화이트리스트: 언어명 → role. 신규 언어 지원은 이 목록에 한 줄 추가하면 된다.
// (확장자는 Linguist가 제공하므로 손으로 유지하지 않는다.)
const WHITELIST: Record<string, LangRole> = {
  JavaScript: 'primary',
  TypeScript: 'primary',
  Python: 'primary',
  Java: 'primary',
  Go: 'primary',
  Rust: 'primary',
  C: 'primary',
  'C++': 'primary',
  'C#': 'primary',
  Ruby: 'primary',
  PHP: 'primary',
  Swift: 'primary',
  Kotlin: 'primary',
  Dart: 'primary',
  Scala: 'primary',
  Lua: 'primary',
  R: 'primary',
  Zig: 'primary',
  Vue: 'primary',
  Svelte: 'primary',
  Astro: 'primary',
  JSON: 'config',
  XML: 'config',
  YAML: 'config',
};

// 별칭 병합: Linguist가 분리한 언어를 대표 언어로 흡수 (.tsx는 TypeScript로).
const ALIASES: Record<string, string> = { TSX: 'TypeScript' };

// 충돌 확장자 우선순위: 이 확장자는 지정된 언어로만 매핑한다.
const CONFLICT_PRIORITY: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.rs': 'Rust',
  '.h': 'C',
};

// 모호 충돌 확장자: 어느 언어로도 단정할 수 없어 제외한다.
const EXCLUDE_EXT = new Set(['.inc', '.fcgi', '.spec', '.pluginspec']);

// Linguist에 없거나 다르게 분류되는 PromptCraft 고유 매핑 (마지막에 덮어쓴다).
const MANUAL: Record<string, LangEntry> = {
  '.zon': { name: 'Zig Object Notation', role: 'config' },
  '.jsp': { name: 'JSP', role: 'template' },
};

export function buildLanguageMap(yaml: LinguistYaml): Record<string, LangEntry> {
  const out: Record<string, LangEntry> = {};
  for (const [rawName, lang] of Object.entries(yaml)) {
    const name = ALIASES[rawName] ?? rawName;
    const role = WHITELIST[name];
    if (!role) continue; // 화이트리스트 밖 언어 제외
    for (const ext of lang.extensions ?? []) {
      const e = ext.toLowerCase();
      if (e.indexOf('.', 1) !== -1) continue; // 복합 확장자(.zig.zon 등)는 path.extname으로 매칭 불가 → 드롭
      if (EXCLUDE_EXT.has(e)) continue;
      const forced = CONFLICT_PRIORITY[e];
      if (forced && forced !== name) continue; // 충돌: 우선순위 언어가 아니면 skip
      if (out[e] && !forced) continue; // 비충돌 중복: 먼저 등록된 것 유지
      out[e] = { name, role };
    }
  }
  for (const [e, entry] of Object.entries(MANUAL)) {
    out[e] = entry;
  }
  return out;
}
