import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLanguageMap, type LinguistYaml } from './build-language-map.js';

// 공식 Linguist languages.yml (main). 생성된 JSON을 커밋하므로 결과는 결정론적이다.
const SOURCE_URL = 'https://raw.githubusercontent.com/github-linguist/linguist/main/lib/linguist/languages.yml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, '../data/detection-rules/languages.json');

async function main(): Promise<void> {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`languages.yml fetch 실패: ${res.status}`);
  const text = await res.text();
  const yaml = Bun.YAML.parse(text) as LinguistYaml;

  const map = buildLanguageMap(yaml);
  const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  console.log(`languages.json 생성: ${Object.keys(sorted).length}개 확장자`);
}

main();
