# RefineSheet — AI 다듬기 결과 Sheet

## 책임
- 우측 Sheet(shadcn `Sheet`, side=right). WorkspacePage `showRefine`로 제어.
- open 시 `GET /api/llm/status`(모델 설정·도달성) + `POST /api/prompt/structural`(완성도·임계값) 조회.
- 모델 미설정(configuredModel null) → "Settings에서 모델 선택" 안내.
- belowThreshold → "데이터 부족" 경고 + [자동 생성] 버튼(mode=coach). 아니면 [평가+다듬기](mode=polish).
- 버튼 클릭 시에만 `POST /api/prompt/refine` → LLM 호출(사용자 트리거 = zero-LLM 기본 유지).
- 결과: 레벨/질 배지 + verdict 분기(polished→다듬은 프롬프트+복사 / needs-improvement→코칭 리스트). 원본은 변경하지 않음(복사 전용).

## Props
- `open: boolean` / `onClose: () => void` — WorkspacePage 제어(History/Settings Sheet와 동일 패턴).

## 의존성
- shadcn `Sheet`, `Button`; `sonner.toast`; `useCardStore.cards`; `useLocale.lang`.
- 백엔드 `GET /api/llm/status`, `POST /api/prompt/structural`, `POST /api/prompt/refine`.
