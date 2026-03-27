'use strict';

const fs = require('fs');
const { Command } = require('commander');

const {
  startSession,
  getCurrentQuestion,
  submitAnswer,
  getAnswers,
  destroySession,
} = require('../../core/qna/index');
const { buildPrompt } = require('../../core/prompt/index');
const db = require('../../core/db/index');
const { scan } = require('../../core/scanner/index');
const {
  askText,
  askSelect,
  askMultiline,
  askMentionMultiline,
  askConfirm,
  success,
  error,
  info,
  warn,
  section,
  startSpinner,
  stopSpinner,
} = require('../ui/prompts');
const {
  QNA_TREE_IDS,
  QNA_TREE_LABELS,
  QNA_TREE_DESCRIPTIONS,
  LAST_SCAN_PATH,
  DATA_DIR,
} = require('../../shared/constants');
const { BuildError, QnAError, ScanError } = require('../../shared/errors');

// 활성 세션 ID — SIGINT 핸들러에서 정리 용도
let _activeSessionId = null;

process.on('SIGINT', () => {
  if (_activeSessionId) {
    try { destroySession(_activeSessionId); } catch (_) {}
    _activeSessionId = null;
  }
  console.log('\n\n작업이 취소되었습니다.');
  process.exit(0);
});

/**
 * --scan 옵션 여부에 따라 ScanResult 반환.
 * 옵션이 없으면 last-scan.json 재사용 여부를 묻는다.
 */
async function resolveScanResult(options) {
  // --no-scan: 스캔 생략
  if (options.scan === false) {
    return null;
  }

  // --scan [path]: 명시적 스캔 실행
  if (options.scan !== undefined && options.scan !== true) {
    const scanPath = options.scan;
    await startSpinner(`프로젝트 스캔 중: ${scanPath}`);
    try {
      const result = await scan(scanPath);
      stopSpinner();
      await success(`스캔 완료: ${result.path}`);
      return result;
    } catch (err) {
      stopSpinner();
      throw new ScanError(err.message);
    }
  }

  // --scan (경로 없이): 현재 디렉토리 스캔
  if (options.scan === true) {
    await startSpinner('프로젝트 스캔 중: .');
    try {
      const result = await scan('.');
      stopSpinner();
      await success(`스캔 완료: ${result.path}`);
      return result;
    } catch (err) {
      stopSpinner();
      throw new ScanError(err.message);
    }
  }

  // 옵션 미지정: 캐시 유무에 따라 단일 select로 선택지 제시
  let cached = null;
  if (fs.existsSync(LAST_SCAN_PATH)) {
    try {
      cached = JSON.parse(fs.readFileSync(LAST_SCAN_PATH, 'utf8'));
    } catch (_) {
      // 파싱 실패 시 캐시 없는 것처럼 처리
    }
  }

  if (cached) {
    const scanDate = new Date(cached.scannedAt).toLocaleString('ko-KR', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    const choice = await askSelect('어떤 스캔 방식을 사용하시겠습니까?', [
      { name: '새로운 프로젝트 스캔 실행', value: 'scan' },
      { name: `이전 스캔 결과 사용 (${cached.path} | ${scanDate})`, value: 'reuse' }
    ]);
    if (choice === 'reuse') return cached;
    // choice === 'scan' → 아래 공통 스캔 실행으로 fall-through
  }

  // 공통 스캔 실행
  await startSpinner('프로젝트 스캔 중: .');
  try {
    const result = await scan('.');
    stopSpinner();
    await success(`스캔 완료: ${result.path}`);
    return result;
  } catch (err) {
    stopSpinner();
    throw new ScanError(err.message);
  }
}

/**
 * 트리 ID를 결정한다. --tree 옵션이 없으면 사용자에게 선택 요청.
 */
async function resolveTreeId(options) {
  if (options.tree) {
    const validIds = Object.values(QNA_TREE_IDS);
    if (!validIds.includes(options.tree)) {
      throw new BuildError(
        `유효하지 않은 트리 ID: ${options.tree}\n사용 가능: ${validIds.join(', ')}`
      );
    }
    return options.tree;
  }

  const choices = Object.entries(QNA_TREE_LABELS).map(([value, name]) => ({
    name,
    value,
    description: QNA_TREE_DESCRIPTIONS[value],
  }));
  return await askSelect('어떤 상황에 대한 프롬프트를 만들어 드릴까요?', choices);
}

/**
 * 템플릿으로부터 초기 answers 로드 (선택적).
 */
function loadTemplateAnswers(templateName) {
  if (!templateName) return {};
  try {
    db.initialize();
    const tmpl = db.template.findByName(templateName);
    if (!tmpl) {
      console.warn(`경고: 템플릿 "${templateName}"을 찾을 수 없습니다. 빈 답변으로 시작합니다.`);
      return {};
    }
    return tmpl.answers || {};
  } catch (_) {
    return {};
  }
}

/**
 * Q&A 루프: 완료될 때까지 질문을 반복한다.
 * templateAnswers가 있으면 해당 키는 건너뛴다.
 */
async function runQnALoop(sessionId, templateAnswers, projectRoot) {
  let step = 0;

  while (true) {
    let question;
    try {
      question = getCurrentQuestion(sessionId);
    } catch (err) {
      // 세션 완료로 인해 getCurrentQuestion이 던지는 경우
      break;
    }

    step += 1;
    await info(`[질문 ${step}] ${question.question}`);

    let answer;

    // 템플릿 답변이 있으면 재사용
    if (templateAnswers[question.key] !== undefined) {
      answer = templateAnswers[question.key];
      await info(`  (템플릿 값 사용: ${answer})`);
    } else {
      switch (question.inputType) {
        case 'select':
          answer = await askSelect(question.question, question.options);
          break;
        case 'multiline':
          answer = await askMultiline(question.question);
          break;
        case 'multiline-mention':
          answer = await askMentionMultiline(question.question, projectRoot);
          break;
        default: // 'text'
          answer = await askText(question.question, {
            validate: question.required
              ? (v) => (v.trim() ? true : '필수 항목입니다.')
              : undefined,
          });
      }
    }

    const result = submitAnswer(sessionId, answer);

    if (!result.success) {
      await warn(`입력 오류: ${result.error}`);
      step -= 1; // 재시도
      continue;
    }

    if (result.completed) break;
  }
}

const cmd = new Command('build')
  .description('Q&A 대화를 통해 프롬프트를 생성합니다')
  .option('-t, --tree <id>', 'Q&A 트리 ID (error-solving|feature-impl|code-review|concept-learn)')
  .option('--scan [path]', '빌드 전 스캔 실행 (경로 미지정 시 현재 디렉토리)')
  .option('--no-scan', '스캔 생략')
  .option('--template <name>', '저장된 템플릿으로 answers 미리 채우기')
  .option('--no-copy', '클립보드 복사 비활성화')
  .option('--output <file>', '생성된 프롬프트를 파일로 저장')
  .action(async (options) => {
    try {
      // DB 초기화
      db.initialize();

      // 1. 트리(상황) 선택
      const treeId = await resolveTreeId(options);

      // 2. 스캔 처리
      let scanResult = null;
      try {
        scanResult = await resolveScanResult(options);
      } catch (err) {
        await warn(`스캔 실패: ${err.message} — 스캔 없이 계속합니다.`);
      }

      // 3. 템플릿 로드
      const templateAnswers = loadTemplateAnswers(options.template);

      // 4. Q&A 세션 시작
      const { session } = startSession(treeId);
      _activeSessionId = session.sessionId;

      await section(`Q&A 시작 — ${QNA_TREE_LABELS[treeId]}`);

      const projectRoot = scanResult?.path || process.cwd();
      await runQnALoop(session.sessionId, templateAnswers, projectRoot);

      // 5. 답변 수집
      const answers = getAnswers(session.sessionId);

      // 6. 프롬프트 생성
      const prompt = buildPrompt(treeId, answers, scanResult);

      await section('생성된 프롬프트');
      console.log(prompt);

      // 7. 클립보드 복사
      if (options.copy !== false) {
        try {
          const { default: clipboardy } = await import('clipboardy');
          await clipboardy.write(prompt);
          await success('프롬프트가 클립보드에 복사되었습니다.');
        } catch (_) {
          await warn('클립보드 복사에 실패했습니다. (환경 제한일 수 있습니다)');
        }
      }

      // 8. 파일 저장
      if (options.output) {
        fs.writeFileSync(options.output, prompt, 'utf8');
        await success(`프롬프트가 파일에 저장되었습니다: ${options.output}`);
      }

      // 9. DB 히스토리 저장
      try {
        db.history.save({
          treeId,
          situation: QNA_TREE_LABELS[treeId],
          prompt,
          scanPath: scanResult ? scanResult.path : null,
          answers,
        });
      } catch (_) {
        await warn('히스토리 저장에 실패했습니다.');
      }

      // 10. 템플릿 저장 제안
      const saveTemplate = await askConfirm('이 답변을 템플릿으로 저장하시겠습니까?');
      if (saveTemplate) {
        const templateName = await askText('템플릿 이름을 입력하세요:', {
          validate: (v) => (v.trim() ? true : '이름을 입력하세요.'),
        });
        try {
          db.template.save({ name: templateName.trim(), treeId, answers });
          await success(`템플릿 "${templateName.trim()}"이 저장되었습니다.`);
        } catch (_) {
          await warn('템플릿 저장에 실패했습니다.');
        }
      }

      // 11. 세션 정리
      destroySession(session.sessionId);
      _activeSessionId = null;

    } catch (err) {
      if (err instanceof BuildError) {
        await error(`빌드 오류: ${err.message}`);
      } else if (err instanceof QnAError) {
        await error(`Q&A 오류: ${err.message}`);
      } else if (err instanceof ScanError) {
        await error(`스캔 오류: ${err.message}`);
      } else {
        await error(`예기치 않은 오류: ${err.message}`);
      }

      if (_activeSessionId) {
        try { destroySession(_activeSessionId); } catch (_) {}
        _activeSessionId = null;
      }

      process.exit(1);
    }
  });

module.exports = cmd;
