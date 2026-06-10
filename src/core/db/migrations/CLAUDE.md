# src/core/db/migrations — 스키마 마이그레이션

- `PRAGMA user_version` 기반 순차 마이그레이션. `SCHEMA_VERSION` = MIGRATIONS 마지막 항목의 version.
- 새 마이그레이션 추가: `v<N>.ts` 생성 → `index.ts`의 `MIGRATIONS` 배열 끝에 추가. version은 1씩 증가, 재정렬 금지.
- `up()`은 단일 트랜잭션(BEGIN IMMEDIATE) 안에서 실행됨 — 내부에서 BEGIN/COMMIT 금지.
- 기존 DB 업그레이드 시 `VACUUM INTO`로 `<db>.bak.<ts>` 백업 후 적용. 실패 시 ROLLBACK + DBError → 기동 중단이 정상 동작.
- Export 포맷의 `schemaVersion`이 이 버전 축을 공유한다 (`../transfer.ts`).
