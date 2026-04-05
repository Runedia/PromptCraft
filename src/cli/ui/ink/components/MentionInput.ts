import React from 'react';
import { parseMentions } from '../../file-mention.js';
import { useFileComplete } from '../hooks/useFileComplete.js';
import { removeLastGrapheme } from '../utils/text.js';
import FileDropdown from './FileDropdown.js';

function MentionInput({ projectRoot, onSubmit, initialValue, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;

  const initialLines = React.useMemo(() => {
    if (typeof initialValue !== 'string' || initialValue.length === 0) return [];
    return initialValue.split('\n');
  }, [initialValue]);
  const [lines, setLines] = React.useState(initialLines.slice(0, -1));
  const [curLine, setCurLine] = React.useState(
    initialLines.length > 0 ? initialLines[initialLines.length - 1] : ''
  );
  const [inMention, setInMention] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const fc = useFileComplete(projectRoot);

  // @ 이후 경로 partial 추출
  function extractPartial(line) {
    const atIdx = line.lastIndexOf('@');
    if (atIdx === -1) return null;
    const after = line.slice(atIdx + 1);
    // 공백이 있으면 @ 멘션 아님
    if (after.includes(' ')) return null;
    return after;
  }

  function applyCompletion(line, chosen) {
    const atIdx = line.lastIndexOf('@');
    if (atIdx === -1) return line + chosen;
    return line.slice(0, atIdx + 1) + chosen;
  }

  useInput((input, key) => {
    if (done) return;
    // ── Enter ─────────────────────────────────────────────────────
    if (key.return) {
      // 드롭다운에서 Enter → 항목 확정
      if (inMention && fc.candidates.length > 0) {
        const chosen = fc.accept();
        const newLine = applyCompletion(curLine, chosen);
        setCurLine(newLine);
        if (chosen.endsWith('/')) {
          fc.updateQuery(chosen);
        } else {
          fc.reset();
          setInMention(false);
        }
        return;
      }
      // 빈 줄 → 입력 완료
      if (curLine === '') {
        setDone(true);
        const allText = lines.join('\n');
        const processed = parseMentions(allText, projectRoot);
        onSubmit(processed);
        return;
      }
      // 줄 추가
      setLines((prev) => [...prev, curLine]);
      setCurLine('');
      fc.reset();
      setInMention(false);
      return;
    }

    // ── Tab: 첫 번째 항목 자동완성 ────────────────────────────────
    if (key.tab) {
      if (fc.candidates.length > 0) {
        const chosen = fc.accept();
        const newLine = applyCompletion(curLine, chosen);
        setCurLine(newLine);
        if (chosen.endsWith('/')) {
          fc.updateQuery(chosen);
        } else {
          fc.reset();
          setInMention(false);
        }
      }
      return;
    }

    // ── 화살표: 드롭다운 탐색 ─────────────────────────────────────
    if (key.upArrow) {
      if (inMention) fc.moveUp();
      return;
    }
    if (key.downArrow) {
      if (inMention) fc.moveDown();
      return;
    }

    // ── Backspace ──────────────────────────────────────────────────
    if (key.backspace || key.delete) {
      if (curLine.length > 0) {
        const newLine = removeLastGrapheme(curLine);
        setCurLine(newLine);
        const partial = extractPartial(newLine);
        if (partial !== null) {
          fc.updateQuery(partial);
          setInMention(true);
        } else {
          fc.reset();
          setInMention(false);
        }
      } else if (lines.length > 0) {
        const prev = lines[lines.length - 1];
        setLines((l) => l.slice(0, -1));
        setCurLine(prev);
        fc.reset();
        setInMention(false);
      }
      return;
    }

    // ── Escape: 드롭다운 닫기 ─────────────────────────────────────
    if (key.escape) {
      fc.reset();
      setInMention(false);
      return;
    }

    // ── 일반 문자 ─────────────────────────────────────────────────
    if (input && !key.ctrl && !key.meta) {
      const newLine = curLine + input;
      setCurLine(newLine);

      const partial = extractPartial(newLine);
      if (partial !== null) {
        fc.updateQuery(partial);
        setInMention(true);
      } else {
        fc.reset();
        setInMention(false);
      }
    }
  });

  if (done) return null;
  return React.createElement(
    Box,
    { flexDirection: 'column' },
    // 완료된 줄들
    ...lines.map((ln, i) =>
      React.createElement(
        Box,
        { key: `mentionline-${i}` },
        React.createElement(Text, { color: 'gray' }, '  '),
        React.createElement(Text, { dimColor: true }, ln)
      )
    ),
    // 현재 입력 줄
    React.createElement(
      Box,
      { flexDirection: 'row' },
      React.createElement(Text, { color: 'cyan' }, '> '),
      React.createElement(Text, null, curLine),
      React.createElement(Text, { color: 'cyan' }, '▌')
    ),
    // 파일 드롭다운
    inMention
      ? React.createElement(FileDropdown, {
          candidates: fc.candidates,
          activeIdx: fc.dropdownIdx,
          inkComponents,
        })
      : null
  );
}

export default MentionInput;
