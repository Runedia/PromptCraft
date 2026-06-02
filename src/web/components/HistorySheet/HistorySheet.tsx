import type { HistoryRecord } from '@core/types.js';
import { Copy, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js';
import { useLocale } from '@/i18n/LocaleContext.js';
import { useT } from '@/i18n/useT.js';
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
  const t = useT();
  const { lang } = useLocale();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const restoreAnswers = useCardStore((s) => s.restoreAnswers);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setConfirming(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    fetch('/api/history', { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const count = Number(r.headers.get('X-Total-Count'));
        const data = (await r.json()) as HistoryRecord[];
        return { count, data };
      })
      .then(({ count, data }) => {
        setRecords(data);
        setTotal(Number.isFinite(count) ? count : data.length);
      })
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') {
          toast.error(t('web.historySheet.loadError'));
          setRecords([]);
          setTotal(0);
        }
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [open, t]);

  const handleRestore = (rec: HistoryRecord) => {
    restoreAnswers(rec.answers);
    toast.success(t('web.historySheet.restoreSuccess'));
    onClose();
  };

  const handleCopy = async (rec: HistoryRecord) => {
    try {
      await navigator.clipboard.writeText(rec.prompt);
      toast.success(t('web.historySheet.copySuccess'));
    } catch {
      toast.error(t('web.historySheet.copyError'));
    }
  };

  const handleDelete = async (id: number) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setTotal((n) => Math.max(0, n - 1));
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) toast.error(t('web.historySheet.deleteError'));
    } catch {
      toast.error(t('web.historySheet.deleteError'));
    }
  };

  const handleClearAll = async () => {
    setConfirming(false);
    const prevRecords = records;
    const prevTotal = total;
    setRecords([]);
    setTotal(0);
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { deleted } = (await res.json()) as { deleted: number };
      toast.success(t('web.historySheet.clearSuccess', { count: deleted }));
    } catch {
      setRecords(prevRecords);
      setTotal(prevTotal);
      toast.error(t('web.historySheet.clearError'));
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" data-ui-id={UI_IDS.WORK_HISTORY_SHEET} className="w-[420px] sm:max-w-[420px] p-0 flex flex-col gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border text-left">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-sm">
              {t('web.historySheet.title')}
              {total > 0 && <span className="ml-1.5 text-xs font-code text-muted-foreground">{total}</span>}
            </SheetTitle>
            {total > 0 &&
              (confirming ? (
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    data-ui-id={UI_IDS.WORK_HISTORY_CLEAR_CONFIRM_BTN}
                    onClick={handleClearAll}
                    className="h-7 gap-1 text-[11px]"
                  >
                    <Trash2 size={12} /> {t('web.historySheet.clearConfirm', { count: total })}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)} className="h-7 text-[11px]">
                    {t('web.historySheet.clearCancel')}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-ui-id={UI_IDS.WORK_HISTORY_CLEAR_BTN}
                  onClick={() => setConfirming(true)}
                  className="h-7 gap-1 text-[11px] ml-auto text-destructive"
                >
                  <Trash2 size={12} /> {t('web.historySheet.clearAll')}
                </Button>
              ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">{t('web.historySheet.loading')}</p>
          ) : records.length === 0 ? (
            <p data-ui-id={UI_IDS.WORK_HISTORY_EMPTY} className="p-6 text-sm text-muted-foreground text-center">
              {t('web.historySheet.empty')}
            </p>
          ) : (
            records.map((rec) => {
              const style = getTreeCardStyle(rec.treeId);
              const restorable = rec.treeId === currentTreeId;
              const trimmed = rec.situation.trim();
              const title = trimmed || t('web.historySheet.noTitle');
              return (
                <div key={rec.id} data-ui-id={UI_IDS.WORK_HISTORY_ITEM} className="px-4 py-3 border-b border-border/60 hover:bg-background/60">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`flex items-center justify-center size-4 rounded ${style.iconBg} ${style.iconColor} shrink-0`}>{style.icon(10)}</span>
                    <span className={`flex-1 truncate text-[13px] font-medium ${trimmed ? '' : 'italic text-muted-foreground'}`}>{title}</span>
                    <span className="text-[10px] font-code text-muted-foreground shrink-0">{formatRelativeTime(rec.createdAt, t, lang)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mb-2 font-code">{rec.prompt.replace(/\n+/g, ' ')}</p>
                  <div className="flex items-center gap-1.5">
                    {restorable ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-ui-id={UI_IDS.WORK_HISTORY_RESTORE_BTN}
                        onClick={() => handleRestore(rec)}
                        className="h-7 gap-1 text-[11px]"
                      >
                        <RotateCcw size={12} /> {t('web.historySheet.restore')}
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled
                              data-ui-id={UI_IDS.WORK_HISTORY_RESTORE_BTN}
                              className="h-7 gap-1 text-[11px]"
                            >
                              <RotateCcw size={12} /> {t('web.historySheet.restore')}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{t('web.historySheet.otherWorkflow')}</TooltipContent>
                      </Tooltip>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-ui-id={UI_IDS.WORK_HISTORY_COPY_BTN}
                      onClick={() => handleCopy(rec)}
                      className="h-7 gap-1 text-[11px]"
                    >
                      <Copy size={12} /> {t('web.historySheet.copy')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-ui-id={UI_IDS.WORK_HISTORY_DELETE_BTN}
                      onClick={() => handleDelete(rec.id)}
                      aria-label={t('web.historySheet.deleteLabel')}
                      className="size-7 ml-auto text-destructive"
                    >
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
