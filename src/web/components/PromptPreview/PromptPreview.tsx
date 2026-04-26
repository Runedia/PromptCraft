import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

/**
 * V2 Three-Column 워크스페이스 우측 440px 미리보기 패널.
 * design/v2-three-column.jsx 의 PreviewMarkdown 자체 mono 렌더 (dense=true) 충실 구현.
 * - 헤더 36px : 좌 "preview" mono uppercase / 우 토큰 카운트
 * - 본문 : font-code 12px line-height 1.7
 *   · active+value 카드 : `## {label}` amber accent 600 12.5px + body whitespace-pre-wrap fg-secondary
 *   · active+empty 카드 : 회색 헤더 + italic "(비어 있음 — 출력에서 제외)" — opacity 0.4
 * - 하단 dashed border-top : "{N} sections active" 좌 / "~{N} tokens" 우
 *
 * @ui-ids WORK_PREVIEW, WORK_PREVIEW_HEADER, WORK_PREVIEW_CONTENT
 */
export function PromptPreview() {
  const { cards, tokenEstimate } = useCardStore();
  const activeFilled = cards.filter((c) => c.active && c.value && c.value.trim() !== '');
  const activeEmpty = cards.filter((c) => c.active && (!c.value || c.value.trim() === ''));
  const isBlank = activeFilled.length === 0 && activeEmpty.length === 0;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted" data-ui-id={UI_IDS.WORK_PREVIEW}>
      {/* 헤더 36px */}
      <div data-ui-id={UI_IDS.WORK_PREVIEW_HEADER} className="h-9 px-4 border-b border-border flex items-center justify-between shrink-0">
        <span className="text-[11px] font-code uppercase tracking-[0.07em] text-muted-foreground">preview</span>
        <span className="text-[11px] font-code text-muted-foreground">~{tokenEstimate.toLocaleString()} tokens</span>
      </div>

      {/* 본문 — design dense=true (padding 20/24) */}
      <div data-ui-id={UI_IDS.WORK_PREVIEW_CONTENT} className="flex-1 overflow-y-auto px-6 py-5 font-code text-[12px] leading-[1.7] text-foreground">
        {isBlank ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-muted-foreground text-sm font-sans">카드를 채우면 프롬프트가 표시됩니다.</p>
          </div>
        ) : (
          <>
            {activeFilled.map((c) => (
              <div key={c.id} className="mb-[18px]">
                <div className="text-primary font-semibold mb-1 text-[12.5px]">## {c.label}</div>
                <div className="whitespace-pre-wrap text-secondary-foreground">{c.value}</div>
              </div>
            ))}
            {activeEmpty.map((c) => (
              <div key={c.id} className="mb-[18px] opacity-40">
                <div className="text-muted-foreground font-semibold mb-1 text-[12.5px]">## {c.label}</div>
                <div className="italic font-sans text-muted-foreground">(비어 있음 — 출력에서 제외)</div>
              </div>
            ))}
            <div className="mt-8 pt-4 border-t border-dashed border-border flex justify-between text-[11px] text-muted-foreground">
              <span>{activeFilled.length} sections active</span>
              <span>~{tokenEstimate.toLocaleString()} tokens</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
