import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const isCheck = process.argv.includes('--check');
const root = resolve(import.meta.dir, '..');
const uiIdsPath = resolve(root, 'src/web/ui-ids.ts');
const outputPath = resolve(root, 'docs/ui-map.md');

const source = readFileSync(uiIdsPath, 'utf-8');

interface UiEntry {
  id: string;
  screen: string;
  region: string;
  description: string;
  file: string;
}

function extractTag(jsdoc: string, tag: string): string {
  const m = jsdoc.match(new RegExp(`@${tag}\\s+(.+)`));
  return m ? m[1].trim() : '';
}

const entries: UiEntry[] = [];
const RE = /\/\*\*([\s\S]*?)\*\/\s*(\w+):\s*'\w+'/g;

for (const m of source.matchAll(RE)) {
  const screen = extractTag(m[1], 'screen');
  if (!screen) continue;
  entries.push({
    id: m[2],
    screen,
    region: extractTag(m[1], 'region'),
    description: extractTag(m[1], 'description'),
    file: extractTag(m[1], 'file'),
  });
}

if (entries.length === 0) {
  console.error('UI_IDS에서 항목을 찾지 못했습니다. ui-ids.ts 경로와 JSDoc 형식을 확인하세요.');
  process.exit(1);
}

const rows = entries.map((e) => `| \`${e.id}\` | ${e.screen} | ${e.region} | ${e.description} | \`${e.file}\` |`).join('\n');

const content = [
  '# UI 식별자 맵',
  '',
  '> 자동 생성 파일 — 직접 수정 금지. `bun run ui-map:generate`로 재생성.',
  '',
  '| ID | 화면 | 영역 | 설명 | 파일 |',
  '|---|---|---|---|---|',
  rows,
  '',
].join('\n');

if (isCheck) {
  if (!existsSync(outputPath)) {
    console.error('docs/ui-map.md 파일이 없습니다. bun run ui-map:generate를 먼저 실행하세요.');
    process.exit(1);
  }
  const existing = readFileSync(outputPath, 'utf-8');
  if (existing !== content) {
    console.error('docs/ui-map.md가 ui-ids.ts와 동기화되어 있지 않습니다. bun run ui-map:generate를 실행하세요.');
    process.exit(1);
  }
  console.log(`docs/ui-map.md 동기화 확인 완료 (${entries.length}개 항목).`);
} else {
  writeFileSync(outputPath, content, 'utf-8');
  console.log(`docs/ui-map.md 생성 완료 (${entries.length}개 항목).`);
}
