const { AppError, ScanError, QnAError, BuildError, DBError, ContextError, ValidationError } =
  require('../../src/shared/errors');

// ─── AppError ────────────────────────────────────────────────────────

describe('AppError', () => {
  test('message와 code가 설정된다', () => {
    const err = new AppError('테스트 에러', 'TEST_CODE');
    expect(err.message).toBe('테스트 에러');
    expect(err.code).toBe('TEST_CODE');
  });

  test('name이 클래스명으로 설정된다', () => {
    const err = new AppError('msg', 'CODE');
    expect(err.name).toBe('AppError');
  });

  test('Error를 상속한다', () => {
    const err = new AppError('msg', 'CODE');
    expect(err).toBeInstanceOf(Error);
  });

  test('stack trace가 존재한다', () => {
    const err = new AppError('msg', 'CODE');
    expect(err.stack).toBeDefined();
  });
});

// ─── 각 에러 서브클래스 ──────────────────────────────────────────────

const errorCases = [
  { Cls: ScanError, code: 'SCAN_ERROR', name: 'ScanError' },
  { Cls: QnAError, code: 'QNA_ERROR', name: 'QnAError' },
  { Cls: BuildError, code: 'BUILD_ERROR', name: 'BuildError' },
  { Cls: DBError, code: 'DB_ERROR', name: 'DBError' },
  { Cls: ContextError, code: 'CONTEXT_ERROR', name: 'ContextError' },
  { Cls: ValidationError, code: 'VALIDATION_ERROR', name: 'ValidationError' },
];

describe.each(errorCases)('$name', ({ Cls, code, name }) => {
  test(`code가 "${code}"이다`, () => {
    const err = new Cls('에러 발생');
    expect(err.code).toBe(code);
  });

  test('message가 설정된다', () => {
    const err = new Cls('에러 메시지');
    expect(err.message).toBe('에러 메시지');
  });

  test('AppError와 Error를 상속한다', () => {
    const err = new Cls('msg');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  test(`name이 "${name}"이다`, () => {
    const err = new Cls('msg');
    expect(err.name).toBe(name);
  });
});
