import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { CONTEXT_FORMATS, generate, preview } from '../../core/context/index.js';
import type { ScanResult } from '../../core/types.js';
import { scan } from '../../core/scanner/index.js';
import { ContextError, ScanError } from '../../shared/errors.js';
import { resolvePath } from '../../shared/utils.js';
import {
  askConfirm,
  askMultiline,
  askText,
  error,
  info,
  section,
  startSpinner,
  stopSpinner,
  success,
  warn,
} from '../ui/prompts.js';

function diffLines(oldContent, newContent) {
  if (oldContent === newContent) {
    return { changed: false, addedLines: 0, removedLines: 0 };
  }
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  const addedLines = newLines.filter((l) => !oldSet.has(l)).length;
  const removedLines = oldLines.filter((l) => !newSet.has(l)).length;
  return { changed: true, addedLines, removedLines };
}

const cmd = new Command('context')
  .description('프로젝트 컨텍스트 파일을 생성합니다')
  .argument('[path]', '대상 디렉토리 경로', '.')
  .option('-f, --format <formats>', '생성할 포맷 (쉼표 구분)', 'claude,gemini')
  .option('-o, --output <path>', '출력 디렉토리')
  .option('--preview', '파일 생성 없이 내용만 출력')
  .option('--conventions <text>', '코딩 컨벤션 직접 입력')
  .option('--constraints <text>', '제약 사항 직접 입력')
  .action(async (pathArg, options) => {
    try {
      // 1. 대상 경로 확인
      const targetPath = resolvePath(pathArg);

      // 2. 프로젝트 스캔
      await startSpinner(`프로젝트 스캔 중: ${targetPath}`);
      let scanResult: ScanResult;
      try {
        scanResult = await scan(targetPath);
        stopSpinner();
        await success(`스캔 완료: ${scanResult.path}`);
      } catch (err) {
        stopSpinner();
        throw new ScanError(err.message);
      }

      // 3. 인터랙티브 수집 (--preview 아닐 때, CLI 옵션으로 미전달된 경우)
      let codingConventions = options.conventions || '';
      let constraints = options.constraints || '';
      let currentTask = '';

      if (!options.preview) {
        if (!options.conventions) {
          const enterConventions = await askConfirm('코딩 컨벤션/규칙을 입력하시겠습니까?');
          if (enterConventions) {
            codingConventions = await askMultiline('코딩 컨벤션을 입력하세요:');
          }
        }

        if (!options.constraints) {
          const enterConstraints = await askConfirm('제약 사항을 입력하시겠습니까?');
          if (enterConstraints) {
            constraints = await askMultiline('제약 사항을 입력하세요:');
          }
        }

        currentTask = await askText('현재 작업 중인 기능/태스크 (선택사항, Enter로 건너뜀)');
      }

      // 4. userConfig 구성
      const userConfig = { codingConventions, constraints, currentTask };

      // 5. formats 파싱 및 유효성 검증
      const formats = options.format
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
      for (const fmt of formats) {
        if (!CONTEXT_FORMATS[fmt]) {
          await error(
            `지원하지 않는 포맷입니다: ${fmt}\n사용 가능: ${Object.keys(CONTEXT_FORMATS).join(', ')}`
          );
          process.exit(1);
        }
      }

      // 출력 경로 결정
      const outputPath = options.output ? resolvePath(options.output) : targetPath;

      // 출력 경로 쓰기 권한 확인 (preview 모드 제외)
      if (!options.preview && fs.existsSync(outputPath)) {
        try {
          fs.accessSync(outputPath, fs.constants.W_OK);
        } catch {
          await error(`출력 경로에 쓰기 권한이 없습니다: ${outputPath}`);
          process.exit(1);
        }
      }

      await section('컨텍스트 파일 생성');

      // 6. preview 모드: 터미널 출력만
      if (options.preview) {
        for (const fmt of formats) {
          const content = preview(fmt, scanResult, userConfig);
          const fileName = CONTEXT_FORMATS[fmt];
          await info(`\n--- ${fileName} ---`);
          console.log(content);
        }
        return;
      }

      // 7. 생성 모드: 포맷별 파일 작성
      for (const fmt of formats) {
        const fileName = CONTEXT_FORMATS[fmt];
        const filePath = path.join(outputPath, fileName);

        let newContent: string;
        try {
          newContent = generate(fmt, scanResult, userConfig);
        } catch (err) {
          if (err instanceof ContextError) throw err;
          throw new ContextError(`컨텍스트 생성 실패 (${fmt}): ${err.message}`);
        }

        if (fs.existsSync(filePath)) {
          const existingContent = fs.readFileSync(filePath, 'utf8');
          const diff = diffLines(existingContent, newContent);

          if (!diff.changed) {
            await success(`${fileName} — 변경 없음`);
            continue;
          }

          const overwrite = await askConfirm(
            `${fileName}에 변경사항이 있습니다 (+${diff.addedLines}줄, -${diff.removedLines}줄). 덮어쓰시겠습니까?`
          );
          if (!overwrite) {
            await warn(`${fileName} — 건너뜀`);
            continue;
          }

          fs.mkdirSync(outputPath, { recursive: true });
          fs.writeFileSync(filePath, newContent, 'utf8');
          await success(`${fileName} — 업데이트 (+${diff.addedLines}줄, -${diff.removedLines}줄)`);
        } else {
          fs.mkdirSync(outputPath, { recursive: true });
          fs.writeFileSync(filePath, newContent, 'utf8');
          const lineCount = newContent.split('\n').length;
          await success(`${fileName} — 생성됨 (+${lineCount}줄)`);
        }
      }
    } catch (err) {
      stopSpinner();
      if (err instanceof ScanError) {
        await error(`프로젝트 스캔 실패: ${err.message}`);
      } else if (err instanceof ContextError) {
        await error(`컨텍스트 생성 실패: ${err.message}`);
      } else {
        await error(`예기치 않은 오류: ${err.message}`);
      }
      process.exit(1);
    }
  });

export default cmd;
