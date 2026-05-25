import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useT } from '@/i18n/useT.js';
import { cn } from '@/lib/utils';
import { useCardStore } from '@/store/cardStore.js';
import { useUIStore } from '@/store/uiStore.js';
import { UI_IDS } from '@/ui-ids.js';

/**
 * V2 Three-Column 워크스페이스 우측 440px 미리보기 패널.
 * 헤더 36px : 좌측 [원문]/미리보기 토글 / 우측 토큰 카운트
 * 본문 : 두 렌더 모드 전환
 *   · 'raw'      : carbon-mono raw text (LLM 입력과 1:1 시각 매핑)
 *   · 'rendered' : react-markdown + remark-gfm prose 렌더 (가독성 우선)
 * 빈 카드는 두 모드 모두 회색 헤더 + italic "(비어 있음 — 출력에서 제외)" 처리.
 * 토글 상태는 useUIStore에서 localStorage persist.
 *
 * @ui-ids WORK_PREVIEW, WORK_PREVIEW_HEADER, WORK_PREVIEW_CONTENT,
 *         WORK_PREVIEW_TOGGLE_RAW, WORK_PREVIEW_TOGGLE_RENDERED
 */
export function PromptPreview() {
  const t = useT();
  const { cards, tokenEstimate } = useCardStore();
  const previewMode = useUIStore((s) => s.previewMode);
  const setPreviewMode = useUIStore((s) => s.setPreviewMode);

  const activeFilled = cards.filter((c) => c.active && c.value && c.value.trim() !== '');
  const activeEmpty = cards.filter((c) => c.active && (!c.value || c.value.trim() === ''));
  const isBlank = activeFilled.length === 0 && activeEmpty.length === 0;

  const toggleBtnBase = 'relative h-full flex items-center text-[11px] font-code uppercase tracking-[0.07em] border-b-2 -mb-px transition-colors';
  const toggleBtnActive = 'border-primary text-foreground';
  const toggleBtnInactive = 'border-transparent text-muted-foreground hover:text-foreground';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted" data-ui-id={UI_IDS.WORK_PREVIEW}>
      {/* 헤더 36px */}
      <div data-ui-id={UI_IDS.WORK_PREVIEW_HEADER} className="h-9 px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-5 h-full">
          <button
            type="button"
            data-ui-id={UI_IDS.WORK_PREVIEW_TOGGLE_RAW}
            onClick={() => setPreviewMode('raw')}
            aria-pressed={previewMode === 'raw'}
            className={cn(toggleBtnBase, previewMode === 'raw' ? toggleBtnActive : toggleBtnInactive)}
          >
            {t('web.promptPreview.raw')}
          </button>
          <button
            type="button"
            data-ui-id={UI_IDS.WORK_PREVIEW_TOGGLE_RENDERED}
            onClick={() => setPreviewMode('rendered')}
            aria-pressed={previewMode === 'rendered'}
            className={cn(toggleBtnBase, previewMode === 'rendered' ? toggleBtnActive : toggleBtnInactive)}
          >
            {t('web.promptPreview.rendered')}
          </button>
        </div>
        <span className="text-[11px] font-code text-muted-foreground">~{tokenEstimate.toLocaleString()} tokens</span>
      </div>

      {/* 본문 — design dense=true (padding 20/24) */}
      <div
        data-ui-id={UI_IDS.WORK_PREVIEW_CONTENT}
        className={cn(
          'flex-1 overflow-y-auto px-6 py-5 text-foreground',
          previewMode === 'raw' ? 'font-code text-[12px] leading-[1.7]' : 'prose-preview font-sans text-[13px] leading-[1.6]'
        )}
      >
        {isBlank ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-muted-foreground text-sm font-sans">{t('web.promptPreview.blank')}</p>
          </div>
        ) : (
          <>
            {activeFilled.map((c) =>
              previewMode === 'raw' ? (
                <div key={c.id} className="mb-[18px]">
                  <div className="text-primary font-semibold mb-1 text-[12.5px]">## {c.label}</div>
                  <div className="whitespace-pre-wrap text-secondary-foreground">{c.value}</div>
                </div>
              ) : (
                <div key={c.id} className="mb-[18px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{`## ${c.label}\n\n${c.value}`}</ReactMarkdown>
                </div>
              )
            )}
            {activeEmpty.map((c) => (
              <div key={c.id} className="mb-[18px] opacity-40">
                <div className="text-muted-foreground font-semibold mb-1 text-[12.5px] font-code">## {c.label}</div>
                <div className="italic font-sans text-muted-foreground">{t('web.promptPreview.empty')}</div>
              </div>
            ))}
            <div className="mt-8 pt-4 border-t border-dashed border-border flex justify-between text-[11px] text-muted-foreground font-code">
              <span>{activeFilled.length} sections active</span>
              <span>~{tokenEstimate.toLocaleString()} tokens</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
