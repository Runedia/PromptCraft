import fs from 'node:fs';
import React from 'react';
import * as db from '../../../../core/db/index.js';
import Header from '../components/Header.js';
import TextInput from '../components/TextInput.js';

const PAGE_HEIGHT = 20;
const SHORTCUTS = {
  copy: new Set(['c', 'ㅊ']),
  saveTemplate: new Set(['s', 'ㄴ']),
  saveFile: new Set(['o', 'ㅐ']),
  quit: new Set(['q', 'ㅂ']),
};

/**
 * ResultScreen — 프롬프트 결과 표시 + 액션 (복사/파일저장/템플릿저장/종료)
 *
 * Sub-phase: 'view' | 'save-name' | 'save-file'
 */
function ResultScreen({ wizard, options, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;
  const prompt = wizard.prompt || '';
  const lines = prompt.split('\n');
  const totalPages = Math.max(1, Math.ceil(lines.length / PAGE_HEIGHT));

  const [phase, setPhase] = React.useState('view');
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [copyStatus, setCopyStatus] = React.useState(null); // null | 'success' | 'error'
  const [statusMsg, setStatusMsg] = React.useState('');

  // 자동 클립보드 복사
  React.useEffect(() => {
    if (options.noCopy) return;
    import('clipboardy')
      .then((mod) => mod.default.write(prompt))
      .then(() => {
        setCopyStatus('success');
        setStatusMsg('프롬프트가 클립보드에 복사되었습니다.');
        setTimeout(() => setStatusMsg(''), 3000);
      })
      .catch(() => {
        setCopyStatus('error');
        setStatusMsg('클립보드 복사 실패 (환경 제한일 수 있습니다)');
        setTimeout(() => setStatusMsg(''), 3000);
      });
  }, [options.noCopy, prompt]);

  // 자동 파일 저장
  React.useEffect(() => {
    if (!options.output) return;
    try {
      fs.writeFileSync(options.output, prompt, 'utf8');
      setStatusMsg(`파일 저장 완료: ${options.output}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg(`파일 저장 실패: ${err.message}`);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  }, [prompt, options.output]);

  // 뷰 단계 키 처리
  useInput((input, key) => {
    if (phase !== 'view') return;
    const normalized = (typeof input === 'string' ? input : '').toLowerCase();

    if (key.upArrow) {
      setScrollOffset((o) => Math.max(0, o - 1));
    } else if (key.downArrow) {
      setScrollOffset((o) => Math.min(Math.max(0, lines.length - PAGE_HEIGHT), o + 1));
    } else if (SHORTCUTS.copy.has(normalized)) {
      // 수동 복사
      import('clipboardy')
        .then((mod) => mod.default.write(prompt))
        .then(() => {
          setStatusMsg('클립보드에 복사되었습니다.');
          setTimeout(() => setStatusMsg(''), 3000);
        })
        .catch(() => {
          setStatusMsg('클립보드 복사 실패');
          setTimeout(() => setStatusMsg(''), 3000);
        });
    } else if (SHORTCUTS.saveTemplate.has(normalized)) {
      setPhase('save-name');
    } else if (SHORTCUTS.saveFile.has(normalized)) {
      setPhase('save-file');
    } else if (SHORTCUTS.quit.has(normalized)) {
      // 종료: onComplete 호출
      if (options.onComplete) {
        options.onComplete({
          answers: wizard.answers,
          prompt: wizard.prompt,
          treeId: wizard.treeId,
          scanResult: wizard.scanResult,
        });
      }
    }
  });

  // 현재 페이지에 표시할 줄
  const visibleLines = lines.slice(scrollOffset, scrollOffset + PAGE_HEIGHT);
  const currentPage = Math.ceil(scrollOffset / PAGE_HEIGHT) + 1;

  // 상태 배너 (복사/저장 결과)
  const bannerEl = statusMsg
    ? React.createElement(
        Box,
        { marginBottom: 1, paddingX: 1 },
        React.createElement(
          Text,
          { color: copyStatus === 'error' ? 'red' : 'green' },
          `  ${statusMsg}`
        )
      )
    : null;

  // 프롬프트 텍스트 영역
  const contentEl = React.createElement(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    ...visibleLines.map((line, i) =>
      React.createElement(
        Box,
        { key: `line-${scrollOffset + i}` },
        React.createElement(Text, null, `  ${line}`)
      )
    ),
    React.createElement(
      Box,
      { justifyContent: 'flex-end', paddingRight: 1 },
      React.createElement(Text, { dimColor: true }, `[${currentPage}/${totalPages} 페이지]`)
    )
  );

  // 액션 바 (view 단계)
  const actionBar = React.createElement(
    Box,
    {
      borderStyle: 'single',
      borderColor: 'gray',
      paddingX: 1,
    },
    React.createElement(Text, { color: 'cyanBright' }, '[c] '),
    React.createElement(Text, { dimColor: true }, '복사  '),
    React.createElement(Text, { color: 'cyanBright' }, '[s] '),
    React.createElement(Text, { dimColor: true }, '템플릿  '),
    React.createElement(Text, { color: 'cyanBright' }, '[o] '),
    React.createElement(Text, { dimColor: true }, '파일 저장  '),
    React.createElement(Text, { color: 'cyanBright' }, '[q] '),
    React.createElement(Text, { dimColor: true }, '종료'),
    React.createElement(Text, { dimColor: true }, '  (한/영 키보드 모두 지원)')
  );

  // save-name 단계: 템플릿 이름 입력
  if (phase === 'save-name') {
    return React.createElement(
      Box,
      {
        flexDirection: 'column',
        borderStyle: 'round',
        borderColor: 'cyan',
        paddingX: 1,
        paddingY: 0,
      },
      React.createElement(Header, { treeId: '생성 완료', inkComponents }),
      React.createElement(
        Box,
        { marginBottom: 1 },
        React.createElement(Text, { bold: true }, '  템플릿 이름을 입력하세요:')
      ),
      React.createElement(
        Box,
        { marginLeft: 2 },
        React.createElement(TextInput, {
          required: true,
          initialValue: '',
          onSubmit: (name) => {
            try {
              db.template.save({
                name: name.trim(),
                treeId: wizard.treeId,
                answers: wizard.answers,
              });
              setStatusMsg(`템플릿 "${name.trim()}" 저장 완료`);
            } catch (_) {
              setStatusMsg('템플릿 저장 실패');
            }
            setTimeout(() => setStatusMsg(''), 3000);
            setPhase('view');
          },
          inkComponents,
        })
      )
    );
  }

  // save-file 단계: 파일 경로 입력
  if (phase === 'save-file') {
    return React.createElement(
      Box,
      {
        flexDirection: 'column',
        borderStyle: 'round',
        borderColor: 'cyan',
        paddingX: 1,
        paddingY: 0,
      },
      React.createElement(Header, { treeId: '생성 완료', inkComponents }),
      React.createElement(
        Box,
        { marginBottom: 1 },
        React.createElement(Text, { bold: true }, '  저장할 파일 경로를 입력하세요:')
      ),
      React.createElement(
        Box,
        { marginLeft: 2 },
        React.createElement(TextInput, {
          required: true,
          initialValue: '',
          onSubmit: (filePath) => {
            try {
              fs.writeFileSync(filePath.trim(), prompt, 'utf8');
              setStatusMsg(`파일 저장 완료: ${filePath.trim()}`);
            } catch (err) {
              setStatusMsg(`파일 저장 실패: ${(err as Error).message}`);
            }
            setTimeout(() => setStatusMsg(''), 3000);
            setPhase('view');
          },
          inkComponents,
        })
      )
    );
  }

  // 기본 뷰 단계
  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'cyan',
      paddingX: 1,
      paddingY: 0,
    },
    React.createElement(Header, { treeId: '생성 완료', inkComponents }),
    bannerEl,
    contentEl,
    actionBar,
    React.createElement(
      Box,
      { marginTop: 0, paddingX: 2 },
      React.createElement(Text, { dimColor: true }, '↑↓ 스크롤')
    )
  );
}

export default ResultScreen;
