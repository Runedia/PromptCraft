# RefineSheet — AI 다듬기 결과 Sheet

## 책임
- 우측 Sheet(shadcn `Sheet`, side=right). WorkspacePage `showRefine`로 제어.
- open 시 `GET /api/llm/status`(모델 설정·도달성) + `POST /api/prompt/structural`(완성도·임계값) 조회.
- 모델 미설정(configuredModel null) → "Settings에서 모델 선택" 안내.
- 모델 설정됨 + 도달 불가(available false) → 엔드포인트 도달 불가 경고. 다듬기 버튼 미노출(SDK 재시도 대기 제거).
- belowThreshold → 비차단 advisory note(muted, 경고 아님). 버튼은 항상 활성. mode 분기 없음 — 단일 [AI 다듬기] 버튼.
- 버튼 클릭 시에만 `POST /api/prompt/refine` → LLM 호출(사용자 트리거 = zero-LLM 기본 유지). body는 `{ cards, lang }`(mode 없음).
- 결과: rationale + 다듬은 프롬프트(복사 전용) + 보강 제안(suggestions) 리스트. 레벨/질 배지·verdict 없음. 원본 무손실.
- 에러 토스트 분기: 409 no_model→모델 선택 안내, 422 refine_parse_failed→형식 미준수 안내, 그 외(503 등)→도달 불가 안내.

## Props
- `open: boolean` / `onClose: () => void` — WorkspacePage 제어(History/Settings Sheet와 동일 패턴).

## 의존성
- shadcn `Sheet`, `Button`; `sonner.toast`; `useCardStore.cards`; `useLocale.lang`.
- 백엔드 `GET /api/llm/status`, `POST /api/prompt/structural`, `POST /api/prompt/refine`.
