import fs from 'node:fs';
import React from 'react';
import { scan } from '../../../../core/scanner/index.js';
import { LAST_SCAN_PATH } from '../../../../shared/constants.js';
import Header from '../components/Header.js';
import ScanSummary from '../components/ScanSummary.js';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * ScanScreen — 스캔/재사용/생략 선택 + Ink 내 스피너 + 결과 시각화
 *
 * Phase 상태머신: 'select' → 'scanning' → 'done' | 'error'
 * options.noScan    → 즉시 wizard.goToQnA(null)
 * options.initialScanPath → 'scanning' 단계부터 시작
 */
function ScanScreen({ wizard, options, inkComponents }) {
  const { Box, Text, useInput } = inkComponents;

  // noScan이면 즉시 건너뜀
  React.useEffect(() => {
    if (options.noScan) {
      wizard.goToQnA(null);
    }
  }, [options.noScan, wizard.goToQnA]);

  // 캐시 로드
  const cached = React.useMemo(() => {
    if (!fs.existsSync(LAST_SCAN_PATH)) return null;
    try {
      return JSON.parse(fs.readFileSync(LAST_SCAN_PATH, 'utf8'));
    } catch {
      return null;
    }
  }, []);

  // 초기 phase 결정
  function deriveInitialPhase() {
    if (options.noScan) return 'done';
    if (options.initialScanPath) return 'scanning';
    return 'select';
  }

  const [phase, setPhase] = React.useState(deriveInitialPhase);
  const [scanPath, setScanPath] = React.useState(options.initialScanPath || '.');
  const [scanResult, setScanResult] = React.useState(null);
  const [scanError, setScanError] = React.useState('');
  const [spinnerIdx, setSpinnerIdx] = React.useState(0);
  const [selectIdx, setSelectIdx] = React.useState(0);

  // 스캔 선택지 구성
  const selectItems = React.useMemo(() => {
    const items = [{ label: '새로운 프로젝트 스캔 실행', value: 'scan' }];
    if (cached) {
      const d = new Date(cached.scannedAt);
      const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      items.push({ label: `이전 스캔 결과 사용  (${cached.path} | ${dateStr})`, value: 'reuse' });
    }
    items.push({ label: '스캔 없이 진행', value: 'skip' });
    return items;
  }, [cached]);

  // 선택 키 처리
  useInput((_input, key) => {
    if (phase === 'select') {
      if (key.upArrow) setSelectIdx((i) => Math.max(0, i - 1));
      if (key.downArrow) setSelectIdx((i) => Math.min(selectItems.length - 1, i + 1));
      if (key.return) {
        const choice = selectItems[selectIdx].value;
        if (choice === 'reuse') {
          wizard.goToQnA(cached);
        } else if (choice === 'skip') {
          wizard.goToQnA(null);
        } else {
          setScanPath('.');
          setPhase('scanning');
        }
      }
    } else if (phase === 'done') {
      if (key.return) {
        wizard.goToQnA(scanResult);
      }
    } else if (phase === 'error') {
      if (key.return) {
        wizard.goToQnA(null);
      }
    }
  });

  // 스캔 실행
  React.useEffect(() => {
    if (phase !== 'scanning') return;
    let cancelled = false;
    scan(scanPath)
      .then((result) => {
        if (!cancelled) {
          // 캐시 저장
          try {
            fs.writeFileSync(LAST_SCAN_PATH, JSON.stringify(result), 'utf8');
          } catch (_) {}
          setScanResult(result);
          setPhase('done');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setScanError(err.message);
          setPhase('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [phase, scanPath]);

  // 스피너 애니메이션
  React.useEffect(() => {
    if (phase !== 'scanning') return;
    const timer = setInterval(() => {
      setSpinnerIdx((i) => (i + 1) % SPINNER_FRAMES.length);
    }, 100);
    return () => clearInterval(timer);
  }, [phase]);

  // 렌더링
  let body: React.ReactElement | null;
  if (phase === 'select') {
    body = React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(
        Box,
        { marginBottom: 1 },
        React.createElement(Text, { bold: true }, '  어떤 스캔 방식을 사용하시겠습니까?')
      ),
      ...selectItems.map((item, i) => {
        const isActive = i === selectIdx;
        return React.createElement(
          Box,
          { key: item.value },
          React.createElement(
            Text,
            {
              color: isActive ? 'cyanBright' : 'gray',
              bold: isActive,
            },
            `  ${isActive ? '❯ ' : '  '}${item.label}`
          )
        );
      }),
      React.createElement(
        Box,
        { marginTop: 1, paddingX: 2 },
        React.createElement(Text, { dimColor: true }, '힌트: ↑↓ 선택  |  Enter 확인')
      )
    );
  } else if (phase === 'scanning') {
    body = React.createElement(
      Box,
      { marginLeft: 2 },
      React.createElement(Text, { color: 'cyan' }, `${SPINNER_FRAMES[spinnerIdx]} `),
      React.createElement(Text, null, `프로젝트 스캔 중: ${scanPath}`)
    );
  } else if (phase === 'done') {
    body = React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(
        Box,
        { marginBottom: 1 },
        React.createElement(Text, { color: 'green', bold: true }, '  ✓ 스캔 완료')
      ),
      React.createElement(ScanSummary, { scanResult, inkComponents }),
      React.createElement(
        Box,
        { marginTop: 1, paddingX: 2 },
        React.createElement(Text, { dimColor: true }, '힌트: Enter로 계속')
      )
    );
  } else if (phase === 'error') {
    body = React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(
        Box,
        { marginBottom: 1 },
        React.createElement(Text, { color: 'red', bold: true }, '  ✗ 스캔 실패')
      ),
      React.createElement(
        Box,
        { marginLeft: 2 },
        React.createElement(Text, { color: 'red' }, scanError)
      ),
      React.createElement(
        Box,
        { marginTop: 1, paddingX: 2 },
        React.createElement(Text, { dimColor: true }, '힌트: Enter로 스캔 없이 계속')
      )
    );
  }

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'cyan',
      paddingX: 1,
      paddingY: 0,
    },
    React.createElement(Header, { treeId: '스캔 설정', inkComponents }),
    body
  );
}

export default ScanScreen;
