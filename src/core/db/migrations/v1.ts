import type { Migration } from './types.js';

/** baseline: PRD 2.5 시점의 history·config 스키마. IF NOT EXISTS이므로 레거시 DB(user_version=0, 테이블 존재)에도 무파괴 적용된다. */
const v1: Migration = {
  version: 1,
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        treeId TEXT NOT NULL,
        situation TEXT NOT NULL,
        prompt TEXT NOT NULL,
        scanPath TEXT,
        answers TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  },
};

export { v1 };
