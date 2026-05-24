---
title: PRD 2.5 의사결정 이력
aliases:
  - PRD 2.5 DECISIONS
  - PRD 2.5 ADR
tags:
  - prd
  - prd/2-5
  - adr-index
version: "2.5"
status: living
created: 2026-05-22
up: "[[0.Index]]"
---

# PRD 2.5 의사결정 이력

본 문서는 PRD 2.5 작성·정정 과정의 주요 의사결정 인덱스입니다. **git log로는 무엇이 바뀌었는지만 추적되며, 왜 바뀌었는지의 근거는 `adr/` 폴더의 개별 ADR 파일에 보존됩니다.**

각 ADR은 결정 일자, 결정 내용, 근거, 연쇄 정리 4개 필드를 frontmatter + 본문으로 정리합니다. 아래 Bases 뷰는 `adr/` 폴더의 ADR 파일들을 frontmatter 기준으로 자동 집계합니다.

## ADR 목록 (Bases)

![[DECISIONS.base]]

## 본 문서의 작성 정책

1. **신규 결정이 발생하면 `adr/YYYY-MM-DD-slug.md` 파일을 신규 작성.** frontmatter 필수 필드: `title`, `date`, `status`(active/completed/superseded), `scope`(영향 절·코드 영역 list), `related`(관련 ADR wikilink list), `tags: [prd, prd/2-5, adr]`. 본 인덱스의 Bases 뷰가 자동으로 새 ADR을 집계합니다.
2. **번호 결번 정책**: KPI / P0 / P1 / P2 / H 등의 번호는 결정으로 취소·완료될 때 본문에서 행만 제거하고 **번호는 결번 상태로 유지**합니다. 재번호화는 historical cross-ref를 dead link로 만드므로 채택하지 않습니다.
3. **결정 번복 시**: 기존 ADR의 frontmatter `status`를 `superseded`로 변경하고 `superseded_by: "[[새-ADR-slug]]"`를 추가. 새 ADR을 별도 파일로 작성하고 `related`에 이전 ADR을 명시. 기존 ADR 본문은 historical record로 그대로 유지합니다.
4. **historical record 보존 원칙**: ADR 본문 내 cross-ref가 후속 결정으로 dead link가 되어도 본문은 수정하지 않습니다. 후속 ADR이 명시적으로 dead link 발생 사실을 기록합니다.
5. **본 문서는 작업자 사이의 합의 기록**이며, 외부 사용자 대상 변경 안내는 별도 채널(CHANGELOG, 릴리스 노트)로 처리합니다.

## 비공개 메타데이터 (사용자 개인 보관 필요)

다음은 PRD에 들어가지 않으나 후속 평가 시 가치 있는 정보입니다. 사용자가 별도 메모로 보관하시기 바랍니다.

- **R1 / R2 / R3 모델 식별 매핑** — 본 평가에서 평가자 편향 차단 목적으로 비공개 처리. 향후 모델별 강점·약점 패턴(R2 단언 과장, R3 scope 축소 보고 등) 분석 시 매핑 필요.
- **외부 도구 의존 매핑** — `getagentseal/codeburn` 외 사용 중인 토큰·latency·observability 도구 목록.
