const { errorHandler } = require('../../../src/server/middleware/errorHandler');

function makeRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe('errorHandler()', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('status(500)과 에러 메시지를 JSON으로 반환한다', () => {
    const err = new Error('DB 연결 실패');
    const res = makeRes();
    errorHandler(err, {} as any, res as any, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB 연결 실패' });
  });

  test('console.error로 에러를 로깅한다', () => {
    const err = new Error('테스트 에러');
    errorHandler(err, {} as any, makeRes() as any, jest.fn());
    expect(consoleSpy).toHaveBeenCalledWith('[Server Error]', '테스트 에러');
  });
});
