const db = require('../src/core/db');

beforeEach(() => {
  db.initialize(':memory:');
});

afterEach(() => {
  db.closeConnection();
});

describe('history repository', () => {
  const sample = {
    treeId: 'error-solving',
    situation: '런타임 에러 발생',
    prompt: '이 에러를 해결해줘',
    answers: { q1: 'a1', q2: 'a2' },
  };

  test('save → findById', () => {
    const id = db.history.save(sample);
    expect(typeof id).toBe('number');
    const row = db.history.findById(id);
    expect(row.treeId).toBe(sample.treeId);
    expect(row.answers).toEqual(sample.answers);
    expect(row.scanPath).toBeNull();
  });

  test('findAll returns items in DESC order', () => {
    db.history.save({ ...sample, situation: 'first' });
    db.history.save({ ...sample, situation: 'second' });
    const rows = db.history.findAll();
    expect(rows[0].situation).toBe('second');
    expect(rows[1].situation).toBe('first');
  });

  test('count', () => {
    expect(db.history.count()).toBe(0);
    db.history.save(sample);
    db.history.save(sample);
    expect(db.history.count()).toBe(2);
  });

  test('delete', () => {
    const id = db.history.save(sample);
    expect(db.history.count()).toBe(1);
    db.history.delete(id);
    expect(db.history.count()).toBe(0);
    expect(db.history.findById(id)).toBeNull();
  });

  test('findAll limit/offset pagination', () => {
    for (let i = 0; i < 5; i++) {
      db.history.save({ ...sample, situation: `s${i}` });
    }
    const page1 = db.history.findAll({ limit: 2, offset: 0 });
    const page2 = db.history.findAll({ limit: 2, offset: 2 });
    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(2);
    expect(page1[0].situation).not.toBe(page2[0].situation);
  });
});

describe('template repository', () => {
  const sample = {
    name: 'my-template',
    treeId: 'feature-impl',
    answers: { q1: 'ans1' },
  };

  test('save → findByName', () => {
    const id = db.template.save(sample);
    expect(typeof id).toBe('number');
    const row = db.template.findByName('my-template');
    expect(row.treeId).toBe(sample.treeId);
    expect(row.answers).toEqual(sample.answers);
  });

  test('update → findById reflects changes', () => {
    const id = db.template.save(sample);
    db.template.update(id, { treeId: 'code-review', answers: { q1: 'updated' } });
    const row = db.template.findById(id);
    expect(row.treeId).toBe('code-review');
    expect(row.answers).toEqual({ q1: 'updated' });
  });

  test('delete', () => {
    const id = db.template.save(sample);
    db.template.delete(id);
    expect(db.template.findById(id)).toBeNull();
  });

  test('duplicate name throws DBError', () => {
    const { DBError } = require('../src/shared/errors');
    db.template.save(sample);
    expect(() => db.template.save(sample)).toThrow(DBError);
  });

  test('findAll returns all templates', () => {
    db.template.save(sample);
    db.template.save({ ...sample, name: 'other' });
    expect(db.template.findAll()).toHaveLength(2);
  });
});

describe('config repository', () => {
  test('set → get', () => {
    db.config.set('theme', 'dark');
    expect(db.config.get('theme')).toBe('dark');
  });

  test('overwrite → get new value', () => {
    db.config.set('theme', 'dark');
    db.config.set('theme', 'light');
    expect(db.config.get('theme')).toBe('light');
  });

  test('delete → get returns null', () => {
    db.config.set('lang', 'ko');
    db.config.delete('lang');
    expect(db.config.get('lang')).toBeNull();
  });

  test('get unknown key returns null', () => {
    expect(db.config.get('nonexistent')).toBeNull();
  });
});
