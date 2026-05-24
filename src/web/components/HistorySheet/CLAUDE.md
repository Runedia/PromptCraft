# HistorySheet — 프롬프트 히스토리 Sheet

## 책임
- 우측 슬라이드 Sheet(shadcn `Sheet`, side=right)로 최근 프롬프트 히스토리 표시
- 열릴 때 `GET /api/history` fetch (AbortController)
- 행: 트리 아이콘 + 제목(situation, 비면 "(제목 없음)") + 상대시각 + prompt 1줄 스니펫
- 동작: 복원(현재 트리 일치 시만 활성, `cardStore.restoreAnswers` 경유 → undo 가능) · 복사(저장된 prompt) · 삭제(`DELETE /api/history/:id`, 낙관적 갱신)

## Props
- `open: boolean` / `onClose: () => void` — 부모(WorkspacePage)가 제어
- `currentTreeId: string | null` — 복원 활성 여부 판정

## 의존성
- shadcn `Sheet`, `Button`, `Tooltip`
- `@/lib/relativeTime`(UTC 안전 상대시각), `@/lib/treeCardStyles`(트리 아이콘)
- `@/store/cardStore`의 `restoreAnswers`
- `sonner.toast`
