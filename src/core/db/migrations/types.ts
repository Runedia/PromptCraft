import type { Database } from 'bun:sqlite';

/** 스키마 마이그레이션 1단계. up()은 단일 트랜잭션 안에서 실행된다 — BEGIN/COMMIT을 직접 호출하지 말 것. */
interface Migration {
  version: number;
  up(db: Database): void;
}

export type { Migration };
