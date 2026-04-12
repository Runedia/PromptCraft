import path from 'node:path';

const { isPathAllowed, validatePath } = require('../../../src/server/middleware/pathGuard');

const ROOT = path.resolve('/tmp/project');

// ─── isPathAllowed ────────────────────────────────────────────────────

describe('isPathAllowed()', () => {
  test('정상 경로는 허용한다', () => {
    expect(isPathAllowed('src/main.ts', ROOT)).toBe(true);
  });

  test('.. 경로 탐색은 차단한다', () => {
    expect(isPathAllowed('../secret', ROOT)).toBe(false);
    expect(isPathAllowed('src/../../etc/passwd', ROOT)).toBe(false);
  });

  test('.env 파일은 차단한다', () => {
    expect(isPathAllowed('.env', ROOT)).toBe(false);
    expect(isPathAllowed('.env.local', ROOT)).toBe(false);
    expect(isPathAllowed('.env.production', ROOT)).toBe(false);
  });

  test('바이너리/미디어 확장자는 차단한다', () => {
    expect(isPathAllowed('app.exe', ROOT)).toBe(false);
    expect(isPathAllowed('lib.dll', ROOT)).toBe(false);
    expect(isPathAllowed('image.jpg', ROOT)).toBe(false);
    expect(isPathAllowed('video.mp4', ROOT)).toBe(false);
    expect(isPathAllowed('archive.zip', ROOT)).toBe(false);
  });

  test('허용된 확장자는 통과한다', () => {
    expect(isPathAllowed('src/index.ts', ROOT)).toBe(true);
    expect(isPathAllowed('package.json', ROOT)).toBe(true);
    expect(isPathAllowed('README.md', ROOT)).toBe(true);
  });
});

// ─── validatePath ─────────────────────────────────────────────────────

describe('validatePath()', () => {
  test('허용된 경로는 절대 경로로 변환해 반환한다', () => {
    const result = validatePath('src/index.ts', ROOT);
    expect(result).toBe(path.resolve(ROOT, 'src/index.ts'));
  });

  test('차단된 경로는 에러를 던진다', () => {
    expect(() => validatePath('../outside', ROOT)).toThrow('접근이 허용되지 않는 경로입니다');
    expect(() => validatePath('.env', ROOT)).toThrow('접근이 허용되지 않는 경로입니다');
  });

  test('에러 메시지에 경로가 포함된다', () => {
    expect(() => validatePath('../secret', ROOT)).toThrow('../secret');
  });
});
