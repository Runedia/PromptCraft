import fs from 'node:fs';
import { Command } from 'commander';

import { scan } from '../../core/scanner/index.js';
import { DATA_DIR, LAST_SCAN_PATH } from '../../shared/constants.js';
import { ScanError } from '../../shared/errors.js';
import { formatDuration } from '../../shared/utils.js';
import { error, getChalk, startSpinner, stopSpinner } from '../ui/prompts.js';

/**
 * structure 객체를 트리 문자열 배열로 변환
 * @param {object} node - { name, children }
 * @param {string} prefix - 현재 줄 앞에 붙을 들여쓰기 문자열
 * @returns {string[]}
 */
function buildTreeLines(node, prefix) {
  const lines = [];
  const children = node.children || [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const isLast = i === children.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    if (typeof child === 'string') {
      lines.push(`${prefix}${connector}${child}`);
    } else {
      lines.push(`${prefix}${connector}${child.name}/`);
      const sub = buildTreeLines(child, prefix + childPrefix);
      for (const l of sub) lines.push(l);
    }
  }

  return lines;
}

/**
 * ScanResult를 터미널에 포맷 출력
 */
async function printResult(result, duration) {
  const chalk = await getChalk();

  console.log(chalk.green(`\n✓ 스캔 완료: ${result.path}`) + chalk.dim(` (소요시간: ${duration})`));

  // 언어
  console.log(chalk.bold('\n언어:'));
  if (result.languages && result.languages.length > 0) {
    for (const lang of result.languages) {
      const bar = `${lang.percentage.toFixed(1)}%`.padStart(6);
      console.log(`  ${lang.name.padEnd(16)} ${bar}  (${lang.count}개 파일)`);
    }
  } else {
    console.log(chalk.dim('  (감지된 언어가 없음)'));
  }

  // 프레임워크
  console.log(chalk.bold('\n프레임워크:'));
  if (result.frameworks && result.frameworks.length > 0) {
    for (const fw of result.frameworks) {
      const ver = fw.version ? ` ${fw.version}` : '';
      console.log(`  ${fw.name}${ver}`);
    }
  } else {
    console.log(chalk.dim('  (없음 - 감지된 프레임워크가 없을 때)'));
  }

  // 디렉토리 구조
  console.log(chalk.bold('\n디렉토리 구조:'));
  if (result.structure) {
    console.log(`  ${result.structure.name}/`);
    const lines = buildTreeLines(result.structure, '  ');
    for (const line of lines) {
      console.log(line);
    }
  } else {
    console.log(chalk.dim('  (구조 정보 없음)'));
  }

  // 패키지 매니저
  const pm = result.packageManager || '감지되지 않음';
  console.log(chalk.bold('\n패키지 매니저: ') + pm);

  // .env 파일
  const envStatus = result.hasEnv ? '있음' : '없음';
  console.log(chalk.bold('.env 파일: ') + envStatus);

  console.log('');
}

const cmd = new Command('scan')
  .description('프로젝트 디렉토리를 스캔합니다')
  .argument('[path]', '스캔할 디렉토리 경로 (기본값: 현재 디렉토리)', '.')
  .option('--json', 'JSON 형식으로 출력')
  .option('--save', '스캔 결과를 ~/.promptcraft/last-scan.json에 저장')
  .option('--depth <n>', '디렉토리 구조 탐색 깊이 (미지정 시 언어에 따라 자동 결정)', parseInt)
  .action(async (pathArg, options) => {
    const startTime = Date.now();

    await startSpinner('프로젝트 스캔 중...');

    try {
      const result = await scan(pathArg, { depth: options.depth });
      stopSpinner();

      const duration = formatDuration(Date.now() - startTime);

      if (options.save) {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(LAST_SCAN_PATH, JSON.stringify(result, null, 2), 'utf8');
      }

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        await printResult(result, duration);
      }
    } catch (err) {
      stopSpinner();
      if (err instanceof ScanError) {
        await error(`스캔 오류: ${err.message}`);
      } else {
        await error(`예기치 않은 오류: ${err.message}`);
      }
      process.exit(1);
    }
  });

export default cmd;
