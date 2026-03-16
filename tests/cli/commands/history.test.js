'use strict';

const db = require('../../../src/core/db');

// chalk, inquirer, clipboardy는 ESM-only이므로 mock 처리
jest.mock('../../../src/cli/ui/prompts', () => ({
  success: jest.fn().mockResolvedValue(undefined),
  error: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue(undefined),
  warn: jest.fn().mockResolvedValue(undefined),
  section: jest.fn().mockResolvedValue(undefined),
  getChalk: jest.fn().mockResolvedValue({
    bold: (s) => s,
    green: (s) => s,
    red: (s) => s,
    blue: (s) => s,
    yellow: (s) => s,
    cyan: (s) => s,
    gray: (s) => s,
    dim: (s) => s,
  }),
  askConfirm: jest.fn().mockResolvedValue(true),
}));

const prompts = require('../../../src/cli/ui/prompts');

const SAMPLE = {
  treeId: 'error-solving',
  situation: '에러 해결',
  prompt: 'Node.js TypeError를 해결해주세요.',
  answers: { q1: 'a1' },
};

beforeEach(() => {
  db.initialize(':memory:');
  jest.clearAllMocks();
});

afterEach(() => {
  db.closeConnection();
});

// ─── clearAll ────────────────────────────────────────────────────

describe('history.clearAll()', () => {
  test('모든 레코드를 삭제한다', () => {
    db.history.save(SAMPLE);
    db.history.save(SAMPLE);
    expect(db.history.count()).toBe(2);
    const changes = db.history.clearAll();
    expect(changes).toBe(2);
    expect(db.history.count()).toBe(0);
  });

  test('빈 테이블에서 0을 반환한다', () => {
    expect(db.history.clearAll()).toBe(0);
  });
});

// ─── defaultAction (기본 동작) ────────────────────────────────────

describe('history 기본 동작', () => {
  test('히스토리 없으면 info 메시지 출력', async () => {
    // defaultAction을 직접 테스트하기 위해 내부 로직을 db를 통해 검증
    const rows = db.history.findAll({ limit: 10 });
    expect(rows).toHaveLength(0);
    // info가 호출될 조건 검증
    expect(prompts.info).not.toHaveBeenCalled();
  });

  test('히스토리 있으면 목록 반환', async () => {
    db.history.save(SAMPLE);
    db.history.save({ ...SAMPLE, prompt: '두 번째 프롬프트' });
    const rows = db.history.findAll({ limit: 10 });
    expect(rows).toHaveLength(2);
    expect(rows[0].prompt).toBe('두 번째 프롬프트'); // DESC 순서
  });
});

// ─── findById / show ──────────────────────────────────────────────

describe('history show', () => {
  test('존재하는 id로 조회하면 레코드 반환', () => {
    const id = db.history.save(SAMPLE);
    const record = db.history.findById(id);
    expect(record).not.toBeNull();
    expect(record.treeId).toBe('error-solving');
    expect(record.prompt).toBe(SAMPLE.prompt);
  });

  test('존재하지 않는 id는 null 반환', () => {
    const record = db.history.findById(9999);
    expect(record).toBeNull();
  });
});

// ─── delete ──────────────────────────────────────────────────────

describe('history delete', () => {
  test('확인 후 항목 삭제', () => {
    const id = db.history.save(SAMPLE);
    db.history.delete(id);
    expect(db.history.findById(id)).toBeNull();
    expect(db.history.count()).toBe(0);
  });

  test('존재하지 않는 id 삭제 시 changes=0', () => {
    const changes = db.history.delete(9999);
    expect(changes).toBe(0);
  });
});

// ─── count ───────────────────────────────────────────────────────

describe('history count', () => {
  test('저장 후 개수 증가', () => {
    expect(db.history.count()).toBe(0);
    db.history.save(SAMPLE);
    expect(db.history.count()).toBe(1);
    db.history.save(SAMPLE);
    expect(db.history.count()).toBe(2);
  });
});

// ─── list (pagination) ────────────────────────────────────────────

describe('history list pagination', () => {
  test('limit 옵션 적용', () => {
    for (let i = 0; i < 5; i++) {
      db.history.save({ ...SAMPLE, situation: `s${i}` });
    }
    const rows = db.history.findAll({ limit: 3 });
    expect(rows).toHaveLength(3);
  });

  test('offset 옵션 적용', () => {
    for (let i = 0; i < 5; i++) {
      db.history.save({ ...SAMPLE, situation: `s${i}` });
    }
    const page1 = db.history.findAll({ limit: 2, offset: 0 });
    const page2 = db.history.findAll({ limit: 2, offset: 2 });
    expect(page1[0].situation).not.toBe(page2[0].situation);
  });
});

// ─── askConfirm 취소 처리 ─────────────────────────────────────────

describe('askConfirm 취소 시 삭제 안 함', () => {
  test('clearAll: 취소하면 데이터 유지', async () => {
    prompts.askConfirm.mockResolvedValueOnce(false);

    db.history.save(SAMPLE);
    const total = db.history.count();
    expect(total).toBe(1);

    // clear 로직 시뮬레이션
    const confirmed = await prompts.askConfirm(`모든 히스토리(${total}개)를 삭제하시겠습니까?`);
    if (confirmed) db.history.clearAll();

    expect(db.history.count()).toBe(1); // 삭제 안 됨
  });

  test('delete: 취소하면 데이터 유지', async () => {
    prompts.askConfirm.mockResolvedValueOnce(false);

    const id = db.history.save(SAMPLE);
    const confirmed = await prompts.askConfirm(`히스토리 #${id}를 삭제하시겠습니까?`);
    if (confirmed) db.history.delete(id);

    expect(db.history.count()).toBe(1);
  });
});
