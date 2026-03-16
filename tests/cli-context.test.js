'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// ── Mock scanResult ──────────────────────────────────────────────────────────

const MOCK_SCAN = {
  path: '/projects/myapp',
  languages: [{ name: 'JavaScript', count: 40, percentage: 62.5 }],
  frameworks: [{ name: 'Express', version: '4.18.2' }],
  packageManager: 'npm',
  structure: { name: 'root', children: [] },
  hasEnv: false,
  configFiles: ['package.json'],
  scannedAt: '2026-03-12T00:00:00.000Z',
};

jest.mock('../src/core/scanner/index', () => ({
  scan: jest.fn().mockResolvedValue(MOCK_SCAN),
}));

// ── Mock UI prompts ──────────────────────────────────────────────────────────

const mockPrompts = {
  startSpinner: jest.fn().mockResolvedValue(undefined),
  stopSpinner: jest.fn(),
  success: jest.fn().mockResolvedValue(undefined),
  error: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue(undefined),
  warn: jest.fn().mockResolvedValue(undefined),
  section: jest.fn().mockResolvedValue(undefined),
  askText: jest.fn().mockResolvedValue(''),
  askMultiline: jest.fn().mockResolvedValue(''),
  askConfirm: jest.fn().mockResolvedValue(false),
};

jest.mock('../src/cli/ui/prompts', () => mockPrompts);

// ── Mock process.exit ────────────────────────────────────────────────────────

jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`process.exit(${code})`);
});

// ── Module references (after mocks are set up) ────────────────────────────────

const { scan } = require('../src/core/scanner/index');

// context 명령 — Commander Command 인스턴스. CJS 캐시로 동일 인스턴스 재사용.
const cmd = require('../src/cli/commands/context');

/**
 * context 명령의 action을 실행한다.
 * parseAsync argv는 [node, script, ...args] 형식이어야 한다.
 * context 명령 자체이므로 'context'는 argv에 포함하지 않는다.
 */
async function runContextCommand(args) {
  await cmd.parseAsync(['node', 'promptcraft', ...args]);
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  scan.mockResolvedValue(MOCK_SCAN);
  mockPrompts.askConfirm.mockResolvedValue(false);
  mockPrompts.askText.mockResolvedValue('');
  mockPrompts.askMultiline.mockResolvedValue('');
});

describe('format 파싱', () => {
  test('단일 포맷 지정 시 해당 파일만 생성', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ctx-'));
    try {
      await runContextCommand(['--format', 'claude', '--output', tmpDir, '--conventions', 'ESLint', '--constraints', 'none']);
      expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'GEMINI.md'))).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('쉼표 구분 복수 포맷 지정 시 모든 파일 생성', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ctx-'));
    try {
      await runContextCommand(['--format', 'claude,gemini', '--output', tmpDir, '--conventions', 'ESLint', '--constraints', 'none']);
      expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'GEMINI.md'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('잘못된 포맷 지정 시 process.exit(1) 호출', async () => {
    await expect(
      runContextCommand(['--format', 'notion', '--output', os.tmpdir(), '--conventions', 'x', '--constraints', 'y'])
    ).rejects.toThrow('process.exit(1)');
  });
});

describe('preview 모드', () => {
  test('--preview 시 파일을 생성하지 않는다', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ctx-'));
    try {
      await runContextCommand(['--preview', '--format', 'claude,gemini', '--output', tmpDir]);
      expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(false);
      expect(fs.existsSync(path.join(tmpDir, 'GEMINI.md'))).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('--preview 시 info()로 파일명을 포함한 내용을 출력한다', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ctx-'));
    try {
      await runContextCommand(['--preview', '--format', 'claude', '--output', tmpDir]);
      expect(mockPrompts.info).toHaveBeenCalledWith(expect.stringContaining('CLAUDE.md'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('--preview 시 askConfirm이 호출되지 않는다', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ctx-'));
    try {
      await runContextCommand(['--preview', '--format', 'claude', '--output', tmpDir]);
      expect(mockPrompts.askConfirm).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('파일 생성', () => {
  test('신규 파일은 확인 없이 바로 생성된다', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ctx-'));
    try {
      await runContextCommand(['--format', 'claude', '--output', tmpDir, '--conventions', 'ESLint', '--constraints', 'no eval']);
      expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
      expect(mockPrompts.success).toHaveBeenCalledWith(expect.stringContaining('생성됨'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('기존 파일과 내용이 동일하면 "변경 없음" 메시지 출력', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ctx-'));
    try {
      // 첫 번째 실행: 파일 생성
      await runContextCommand(['--format', 'claude', '--output', tmpDir, '--conventions', 'ESLint', '--constraints', 'no eval']);
      jest.clearAllMocks();
      mockPrompts.askConfirm.mockResolvedValue(false);
      mockPrompts.askText.mockResolvedValue('');
      scan.mockResolvedValue(MOCK_SCAN);

      // 두 번째 실행: 동일 옵션 → 변경 없음
      await runContextCommand(['--format', 'claude', '--output', tmpDir, '--conventions', 'ESLint', '--constraints', 'no eval']);
      expect(mockPrompts.success).toHaveBeenCalledWith(expect.stringContaining('변경 없음'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('기존 파일과 내용이 다르고 덮어쓰기 거부 시 파일 미변경', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ctx-'));
    try {
      // 첫 번째 실행
      await runContextCommand(['--format', 'claude', '--output', tmpDir, '--conventions', 'ESLint', '--constraints', 'none']);
      const contentBefore = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');

      jest.clearAllMocks();
      mockPrompts.askConfirm.mockResolvedValue(false); // 덮어쓰기 거부
      mockPrompts.askText.mockResolvedValue('');
      scan.mockResolvedValue(MOCK_SCAN);

      // 두 번째 실행: 다른 옵션 + 덮어쓰기 거부
      await runContextCommand(['--format', 'claude', '--output', tmpDir, '--conventions', 'Prettier', '--constraints', 'no eval']);

      const contentAfter = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
      expect(contentAfter).toBe(contentBefore);
      expect(mockPrompts.warn).toHaveBeenCalledWith(expect.stringContaining('건너뜀'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('기존 파일과 내용이 다르고 덮어쓰기 승인 시 파일 갱신', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-ctx-'));
    try {
      // 첫 번째 실행
      await runContextCommand(['--format', 'claude', '--output', tmpDir, '--conventions', 'ESLint', '--constraints', 'none']);
      const contentBefore = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');

      jest.clearAllMocks();
      mockPrompts.askConfirm.mockResolvedValue(true); // 덮어쓰기 승인
      mockPrompts.askText.mockResolvedValue('');
      scan.mockResolvedValue(MOCK_SCAN);

      // 두 번째 실행: 다른 내용 + 덮어쓰기 승인
      await runContextCommand(['--format', 'claude', '--output', tmpDir, '--conventions', 'Prettier + airbnb style guide', '--constraints', 'no eval allowed']);

      const contentAfter = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
      expect(contentAfter).not.toBe(contentBefore);
      expect(mockPrompts.success).toHaveBeenCalledWith(expect.stringContaining('업데이트'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('스캔 오류 처리', () => {
  test('스캔 실패 시 error 출력 및 process.exit(1) 호출', async () => {
    scan.mockRejectedValueOnce(new Error('디렉토리를 찾을 수 없습니다'));

    await expect(
      runContextCommand(['--format', 'claude', '--output', os.tmpdir(), '--conventions', 'x', '--constraints', 'y'])
    ).rejects.toThrow('process.exit(1)');

    expect(mockPrompts.error).toHaveBeenCalledWith(expect.stringContaining('스캔 실패'));
  });
});
