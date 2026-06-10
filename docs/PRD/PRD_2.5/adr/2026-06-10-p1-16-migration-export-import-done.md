---
title: "§7.2.2 P1-16 DB 스키마 마이그레이션 완료 + Export/Import 신규 — KPI #12 충족"
date: 2026-06-10
status: completed
scope:
  - "§7.2.2"
  - "§7.1.1"
  - "§3.2.9"
related:
  - "[[2026-05-24-feat29-migration-unimplemented]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-06-10 — §7.2.2 P1-16 DB 스키마 마이그레이션 완료 + Export/Import 신규

**결정**: P1-16(DB 스키마 마이그레이션)을 구현 완료 처리한다. [[7.Roadmap|§7.2.2]] P1-A 표에서 P1-16 행을 제거하고(번호 결번 유지), [[7.Roadmap|§7.1.1]] KPI #12를 "자동 검증 테스트로 측정"으로 갱신한다. 동일 버전 축을 공유하는 Export/Import 기능을 함께 도입한다.

**구현 내용**:
1. `src/core/db/migrations/` — `PRAGMA user_version` 기반 순차 마이그레이션. v1 = history·config baseline. 버전별 `BEGIN IMMEDIATE` 단일 트랜잭션, 락 획득 후 user_version 재확인(멀티 인스턴스 동시 기동 가드).
2. 백업: 기존 DB 업그레이드 시 `VACUUM INTO`로 `promptcraft.db.bak.<yyyyMMdd-HHmmss-SSS>` 생성. 실패 시 ROLLBACK + 백업 경로를 포함한 DBError로 **기동 중단**.
3. `current > SCHEMA_VERSION`(구버전 앱 × 신버전 DB) 기동 거부.
4. Export/Import: `GET /api/export`·`POST /api/import` + SettingsSheet "데이터" 섹션. 단일 JSON 번들(history + config 테이블 + 글로벌 config.json), Import는 병합 — history `(treeId, createdAt, prompt)` dedup, config 키 단위 덮어쓰기.

**정정**: [[2026-05-24-feat29-migration-unimplemented]]의 백업 파일명 `db.sqlite.bak.<ts>`는 실제 DB 파일명(`promptcraft.db`)과 불일치 — `promptcraft.db.bak.<ts>`로 정정한다(타임스탬프는 Windows 파일명 제약으로 콜론 제외). 또한 globalConfig는 스펙 §5.1의 "ConfigManager 경유" 대신 `transfer.ts`가 config.json 파일을 직접 읽는 방식으로 구현 — ConfigManager를 경유하면 DEFAULTS가 백업에 섞이므로 의도된 편차다.

**KPI #12**: `tests/core/db/migrations.test.ts`(신규 적용·레거시 스탬프·실패 롤백·백업 보존·신버전 거부)가 마이그레이션 자동 검증을 상시 수행한다 — "미측정 → 자동 검증 충족"으로 갱신.

**연쇄 정리**:
- [[7.Roadmap|§7.2.2]] P1-A 표에서 P1-16 행 제거, 표 아래에 결번 유지 1문장 추가.
- [[7.Roadmap|§7.2.4]] 매트릭스 건수 조정 (P1-A 잔여: P1-3·P1-4 2건).
- [[7.Roadmap|§7.1.1]] KPI #12 행: 측정 방식을 자동 테스트로, 상태를 충족으로 갱신.
