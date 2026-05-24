# PRD 2.5 — 명세 문서

PromptCraft PRD 2.5. §별로 분할된 living spec.

## 파일 지도
- `0.Index.md` — 진입점. 문서 지도(§1~§7 요약·링크)·독해 가이드. **PRD 작업 시 먼저 읽을 것.**
- `1.Overview` ~ `7.Roadmap` — 절별 본문.
- `DECISIONS.md` — 의사결정 인덱스 + 작성 정책. `![[DECISIONS.base]]`로 `adr/` 자동 집계.
- `adr/YYYY-MM-DD-slug.md` — 개별 결정 1건=1파일(완료·취소·재정의 근거 trail).

## 변경 규칙 (상세는 DECISIONS.md "작성 정책")
- 본문은 **확정 spec만** 담는다. 완료·취소·재정의 결정은 `adr/`에 기록하고 본문에는 trail을 쓰지 않는다.
- 신규 결정 → `adr/YYYY-MM-DD-slug.md` 작성. frontmatter 필수: `title, date, status(active/completed/superseded), scope[], related[], tags:[prd,prd/2-5,adr]`. `DECISIONS.base`가 자동 집계하므로 인덱스 수동 편집 불필요.
- **번호 결번 정책**: KPI/P0/P1/P2/H 번호는 취소·완료 시 본문에서 행만 제거하고 **번호는 결번 유지**(재번호 금지 — historical cross-ref가 dead link 되는 것 방지).
- cross-ref(§·번호 참조)는 변경 시 함께 갱신. ADR 본문 내 dead link는 historical record로 보존하고, 후속 ADR이 발생 사실을 기록한다.
