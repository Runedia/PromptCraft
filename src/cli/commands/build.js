'use strict';

const { Command } = require('commander');

const { renderInkApp } = require('../ui/ink/index');
const db = require('../../core/db/index');
const { QNA_TREE_LABELS } = require('../../shared/constants');
const { BuildError, QnAError } = require('../../shared/errors');

/**
 * 템플릿으로부터 초기 answers 로드 (선택적).
 */
function loadTemplateAnswers(templateName) {
  if (!templateName) return {};
  try {
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
      db.initialize();
      const templateAnswers = loadTemplateAnswers(options.template);

      let result;
      try {
        result = await renderInkApp({
          initialTreeId:   options.tree,
          initialScanPath: typeof options.scan === 'string' ? options.scan : undefined,
          noScan:          options.scan === false,
          templateAnswers,
          noCopy:          options.copy === false,
          output:          options.output,
          onCancel: () => process.exit(0),
        });
      } catch (err) {
        if (err.message === 'CANCELLED') process.exit(0);
        throw err;
      }

      // renderInkApp이 null을 반환하는 경우 (예: 비정상 종료)
      if (!result) process.exit(0);

      // DB 히스토리 저장
      try {
        db.history.save({
          treeId:    result.treeId,
          situation: QNA_TREE_LABELS[result.treeId] || result.treeId,
          prompt:    result.prompt,
          scanPath:  result.scanResult ? result.scanResult.path : null,
          answers:   result.answers,
        });
      } catch (_) {
        // 히스토리 저장 실패는 무시
      }

      process.exit(0);

    } catch (err) {
      if (err instanceof BuildError) {
        console.error(`빌드 오류: ${err.message}`);
      } else if (err instanceof QnAError) {
        console.error(`Q&A 오류: ${err.message}`);
      } else {
        console.error(`예기치 않은 오류: ${err.message}`);
      }
      process.exit(1);
    }
  });

module.exports = cmd;
