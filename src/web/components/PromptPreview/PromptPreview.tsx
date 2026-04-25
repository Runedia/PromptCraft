import { ClipboardCopy, History, Redo2, Save, Undo2 } from 'lucide-react';
import { useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js';
import { useKeyboard } from '@/hooks/useKeyboard.js';
import { useCardStore, useTemporalStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

interface PromptPreviewProps {
  onSave?: () => void;
  onHistory?: () => void;
}

/**
 * @ui-ids WORK_PREVIEW, WORK_PREVIEW_HEADER, WORK_PREVIEW_UNDO_BTN, WORK_PREVIEW_REDO_BTN,
 *   WORK_PREVIEW_CONTENT, WORK_PREVIEW_ACTION_BAR, WORK_PREVIEW_COPY_BTN,
 *   WORK_PREVIEW_SAVE_BTN, WORK_PREVIEW_HISTORY_BTN
 */
export function PromptPreview({ onSave, onHistory }: PromptPreviewProps) {
  const { prompt, preview, tokenEstimate } = useCardStore();
  const { undo, redo } = useTemporalStore();

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    toast.success('복사됨');
  }, [prompt]);

  useKeyboard({ onCopy: handleCopy, onSave });

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden" data-ui-id={UI_IDS.WORK_PREVIEW}>
      {/* 헤더 */}
      <div className="flex-none flex items-center justify-between px-5 py-3 border-b border-border/50" data-ui-id={UI_IDS.WORK_PREVIEW_HEADER}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">미리보기</span>
          <div className="flex gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-ui-id={UI_IDS.WORK_PREVIEW_UNDO_BTN}
                  className="size-7 text-muted-foreground hover:text-foreground"
                  onClick={() => undo()}
                >
                  <Undo2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>실행 취소 (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-ui-id={UI_IDS.WORK_PREVIEW_REDO_BTN}
                  className="size-7 text-muted-foreground hover:text-foreground"
                  onClick={() => redo()}
                >
                  <Redo2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>다시 실행 (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <span className="font-code text-xs text-muted-foreground bg-background px-2 py-1 rounded-md border border-border/50">
          ~{tokenEstimate.toLocaleString()} tok
        </span>
      </div>

      {/* 미리보기 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-foreground prose-preview" data-ui-id={UI_IDS.WORK_PREVIEW_CONTENT}>
        {preview ? (
          <ReactMarkdown>{preview}</ReactMarkdown>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-muted-foreground text-sm">카드를 채우면 프롬프트가 표시됩니다.</p>
          </div>
        )}
      </div>

      {/* 액션 바 */}
      <div className="flex-none flex gap-2 px-5 py-3 border-t border-border/50" data-ui-id={UI_IDS.WORK_PREVIEW_ACTION_BAR}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="default" data-ui-id={UI_IDS.WORK_PREVIEW_COPY_BTN} onClick={handleCopy} disabled={!prompt}>
              <ClipboardCopy data-icon="inline-start" size={15} />
              복사
            </Button>
          </TooltipTrigger>
          <TooltipContent>클립보드 복사 (Ctrl+Enter)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="outline" data-ui-id={UI_IDS.WORK_PREVIEW_SAVE_BTN} onClick={onSave}>
              <Save data-icon="inline-start" size={15} />
              저장
            </Button>
          </TooltipTrigger>
          <TooltipContent>템플릿 저장 (Ctrl+S)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="outline" data-ui-id={UI_IDS.WORK_PREVIEW_HISTORY_BTN} className="ml-auto" onClick={onHistory}>
              <History data-icon="inline-start" size={15} />
              히스토리
            </Button>
          </TooltipTrigger>
          <TooltipContent>히스토리</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
