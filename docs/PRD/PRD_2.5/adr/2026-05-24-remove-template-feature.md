---
title: "Feature #26 템플릿 프리셋 — write-only dead feature로 전면 제거"
date: 2026-05-24
status: completed
scope:
  - "Feature #26"
  - "§3 Features (API 표 /api/templates)"
  - "§4.3.4 (ActionBar Save template)"
related:
  - "[[2026-05-24-run-as-simplified]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# 2026-05-24 — Feature #26 템플릿 프리셋 제거

**결정**: 템플릿 프리셋 저장/로드 기능(Feature #26, `POST/GET/DELETE /api/templates`)을 코드에서 전면 제거한다. UI·서버 라우트·코어 리포지토리·타입·테이블 `CREATE`를 삭제했다(master 커밋 `70e4408`).

**근거**:
1. **write-only dead feature**: `SaveTemplateModal`이 `POST /api/templates`로 저장은 했으나, 저장된 템플릿을 목록·로드·적용하는 소비 UI가 **단 한 건도 구현되지 않았다**(`3.Features.md:256` "POST만 사용, GET/DELETE는 UI 없음"). 즉 저장된 데이터는 SQLite에 들어간 뒤 사용자가 다시 꺼낼 방법이 없는 도달 불가 상태였다. 히스토리 쓰기 경로 단절과 동형의 spec/impl 격차.
2. **History와 기능 중복**: P1-11에서 구현한 History 기능(커밋 `4d1ea9b`)이 "과거 프롬프트 복원"을 이미 제공한다. 이름 붙인 큐레이션 프리셋(템플릿)을 살리려면 별도 목록/적용 UI 신설이 필요한데, 자동 로그(히스토리)와의 가치 차이가 현 시점 비용을 정당화하지 못한다고 판단했다.

**범위/구현 세부**:
- **제거**: `src/web` SaveTemplateModal·저장 버튼·`⌘S`·ui-ids(`WORK_ACTIONBAR_SAVE`·`WORK_SAVE_TEMPLATE_*`), `src/server/routes/template.ts`·`/api/templates` 마운트, `src/core/db/repositories/template.ts`·`db/index` export·`types.ts` Template* 타입·`connection.ts`의 `CREATE TABLE template`.
- **유지**: 카드 `SectionCard.template` 필드(`{{value}}` 치환)는 무관하므로 그대로. History·history/config 테이블·기타 라우트 전부 유지.
- **테이블 drop 미수행**: DB 마이그레이션 프레임워크가 부재(아래 부수 발견)하여 `CREATE` 블록만 제거했다. 신규 DB는 `template` 테이블을 만들지 않으며, 기존 로컬 DB(`~/.promptcraft/db.sqlite`)의 `template` 테이블은 고아로 남으나 어떤 코드도 참조하지 않으므로 무해하다. 향후 마이그레이션 체계가 도입되면 정식 `DROP`을 후속 처리한다.

**부수 발견(별도 과제)**: Feature #29 "DB 스키마 마이그레이션(`PRAGMA user_version`)"은 PRD가 "구현됨, 현재 v1"로 기술하나 실제 미구현이다(`connection.ts`에 `user_version`·`migrations/`·백업 로직 부재, `docs/SWA-evaluation-2026-04-30.md:89` 확인). 본 결정의 "테이블 drop 미수행"은 이 격차의 직접 결과다.

**번호/cross-ref 갱신(본문 반영 시)**:
- Feature #26 행 제거, 번호는 결번 유지(재번호 금지).
- `§3 Features` API 표의 `/api/templates` 행(GET/POST/DELETE) 제거.
- `3.Features.md:261`의 "History·Template 목록·Settings UI 보강" 문구에서 Template 항목 정정.
- (2026-05-24 전수조사 후속) [[4.UI-Design|§4.3.4]] ActionBar 표의 "Save template"(`BookmarkPlus`·`⌘S`·`onSave` prop) 행 제거 — 코드에서 이미 제거됨(`SaveTemplate`/`onSave`/`WORK_ACTIONBAR_SAVE`/`BookmarkPlus` `src/web` 잔존 0건 확인). scope에 §4.3.4 추가.
- Feature #29(마이그레이션) 상태를 "미구현"으로 정정할지는 별도 결정.
