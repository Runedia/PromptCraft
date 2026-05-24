import type { HistoryRecord } from '@core/types.js';
import { Copy, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js';
import { formatRelativeTime } from '@/lib/relativeTime.js';
import { getTreeCardStyle } from '@/lib/treeCardStyles.js';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

interface HistorySheetProps {
  open: boolean;
  onClose: () => void;
  currentTreeId: string | null;
}

/**
 * @ui-ids WORK_HISTORY_SHEET, WORK_HISTORY_ITEM, WORK_HISTORY_RESTORE_BTN,
 *   WORK_HISTORY_COPY_BTN, WORK_HISTORY_DELETE_BTN, WORK_HISTORY_EMPTY
 */
export function HistorySheet({ open, onClose, currentTreeId }: HistorySheetProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const restoreAnswers = useCardStore((s) => s.restoreAnswers);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    fetch('/api/history', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: HistoryRecord[]) => setRecords(data))
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') {
          toast.error('히스토리를 불러오지 못했습니다.');
          setRecords([]);
        }
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [open]);

  const handleRestore = (rec: HistoryRecord) => {
    restoreAnswers(rec.answers);
    toast.success('프롬프트를 불러왔습니다.');
    onClose();
  };

  const handleCopy = async (rec: HistoryRecord) => {
    try {
      await navigator.clipboard.writeText(rec.prompt);
      toast.success('클립보드에 복사됨');
    } catch {
      toast.error('복사 실패');
    }
  };

  const handleDelete = async (id: number) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) toast.error('삭제 실패');
    } catch {
      toast.error('삭제 실패');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" data-ui-id={UI_IDS.WORK_HISTORY_SHEET} className="w-[420px] sm:max-w-[420px] p-0 flex flex-col gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border text-left">
          <SheetTitle className="text-sm">최근 프롬프트</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">불러오는 중…</p>
          ) : records.length === 0 ? (
            <p data-ui-id={UI_IDS.WORK_HISTORY_EMPTY} className="p-6 text-sm text-muted-foreground text-center">
              아직 사용한 프롬프트가 없습니다.
            </p>
          ) : (
            records.map((rec) => {
              const style = getTreeCardStyle(rec.treeId);
              const restorable = rec.treeId === currentTreeId;
              const trimmed = rec.situation.trim();
              const title = trimmed || '(제목 없음)';
              return (
                <div key={rec.id} data-ui-id={UI_IDS.WORK_HISTORY_ITEM} className="px-4 py-3 border-b border-border/60 hover:bg-background/60">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`flex items-center justify-center size-4 rounded ${style.iconBg} ${style.iconColor} shrink-0`}>{style.icon(10)}</span>
                    <span className={`flex-1 truncate text-[13px] font-medium ${trimmed ? '' : 'italic text-muted-foreground'}`}>{title}</span>
                    <span className="text-[10px] font-code text-muted-foreground shrink-0">{formatRelativeTime(rec.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mb-2 font-code">{rec.prompt.replace(/\n+/g, ' ')}</p>
                  <div className="flex items-center gap-1.5">
                    {restorable ? (
                      <Button type="button" variant="outline" size="sm" data-ui-id={UI_IDS.WORK_HISTORY_RESTORE_BTN} onClick={() => handleRestore(rec)} className="h-7 gap-1 text-[11px]">
                        <RotateCcw size={12} /> 복원
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button type="button" variant="outline" size="sm" disabled data-ui-id={UI_IDS.WORK_HISTORY_RESTORE_BTN} className="h-7 gap-1 text-[11px]">
                              <RotateCcw size={12} /> 복원
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>다른 워크플로우 — 복사만 가능</TooltipContent>
                      </Tooltip>
                    )}
                    <Button type="button" variant="ghost" size="sm" data-ui-id={UI_IDS.WORK_HISTORY_COPY_BTN} onClick={() => handleCopy(rec)} className="h-7 gap-1 text-[11px]">
                      <Copy size={12} /> 복사
                    </Button>
                    <Button type="button" variant="ghost" size="icon" data-ui-id={UI_IDS.WORK_HISTORY_DELETE_BTN} onClick={() => handleDelete(rec.id)} aria-label="삭제" className="size-7 ml-auto text-destructive">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
