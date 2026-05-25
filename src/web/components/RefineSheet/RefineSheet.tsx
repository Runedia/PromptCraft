import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet.js';
import { useLocale } from '@/i18n/LocaleContext.js';
import { useT } from '@/i18n/useT.js';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

interface RefineSheetProps {
  open: boolean;
  onClose: () => void;
}

interface Status {
  available: boolean;
  configuredModel: string | null;
}
interface Structural {
  completeness: number;
  belowThreshold: boolean;
  missing: string[];
}
interface Assessment {
  refined: string;
  suggestions: string[];
  rationale?: string;
}

/**
 * @ui-ids WORK_REFINE_SHEET, WORK_REFINE_RUN_BTN, WORK_REFINE_RESULT
 */
export function RefineSheet({ open, onClose }: RefineSheetProps) {
  const t = useT();
  const { lang } = useLocale();
  const cards = useCardStore((s) => s.cards);
  const [status, setStatus] = useState<Status | null>(null);
  const [structural, setStructural] = useState<Structural | null>(null);
  const [result, setResult] = useState<Assessment | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    const ac = new AbortController();
    const snapshot = useCardStore.getState().cards;
    fetch('/api/llm/status', { signal: ac.signal })
      .then((r) => r.json())
      .then((s) => setStatus(s))
      .catch(() => setStatus({ available: false, configuredModel: null }));
    fetch('/api/prompt/structural', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards: snapshot }),
      signal: ac.signal,
    })
      .then((r) => r.json())
      .then((s) => setStructural(s))
      .catch(() => {});
    return () => ac.abort();
  }, [open]);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/prompt/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards, lang }),
      });
      if (!res.ok) {
        if (res.status === 409) toast.warning(t('web.refine.noModel'));
        else if (res.status === 422) toast.error(t('web.refine.parseFailed'));
        else toast.error(t('web.refine.unavailable'));
        return;
      }
      setResult((await res.json()) as Assessment);
    } catch {
      toast.error(t('web.refine.failed'));
    } finally {
      setRunning(false);
    }
  };

  const copyRefined = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('web.refine.copied'));
    } catch {
      toast.error(t('web.refine.failed'));
    }
  };

  const noModel = status && !status.configuredModel;
  const unreachable = status?.configuredModel && !status.available;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" data-ui-id={UI_IDS.WORK_REFINE_SHEET} className="w-[460px] sm:max-w-[460px] p-0 flex flex-col gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border text-left">
          <SheetTitle className="text-sm">{t('web.refine.title')}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {status === null ? null : noModel ? (
            <p className="text-[13px] text-muted-foreground">{t('web.refine.noModel')}</p>
          ) : unreachable ? (
            <p className="text-[13px] text-warning">{t('web.refine.unavailable')}</p>
          ) : (
            <>
              {structural?.belowThreshold && <p className="text-[13px] text-muted-foreground">{t('web.refine.advisory')}</p>}
              <Button type="button" data-ui-id={UI_IDS.WORK_REFINE_RUN_BTN} onClick={run} disabled={running} className="w-full h-9">
                {running ? t('web.refine.running') : t('web.refine.run')}
              </Button>

              {result && (
                <div data-ui-id={UI_IDS.WORK_REFINE_RESULT} className="space-y-3">
                  {result.rationale && <p className="text-[12.5px] text-secondary-foreground">{result.rationale}</p>}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-code uppercase tracking-[0.07em] text-muted-foreground">{t('web.refine.refinedTitle')}</span>
                      <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => copyRefined(result.refined)}>
                        {t('web.refine.copy')}
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap font-code text-[12px] bg-muted rounded p-3 text-secondary-foreground">{result.refined}</pre>
                  </div>
                  {result.suggestions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-code uppercase tracking-[0.07em] text-muted-foreground">{t('web.refine.suggestionsTitle')}</span>
                      <ul className="list-disc pl-5 text-[12.5px] text-secondary-foreground space-y-1">
                        {result.suggestions.map((s, i) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: 서버 응답 일회성 렌더, 재정렬 없음
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
