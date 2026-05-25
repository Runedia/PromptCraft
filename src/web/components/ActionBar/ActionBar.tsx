import { PROVIDERS, RUN_TARGETS, type RunTarget } from '@core/run/providers.js';
import { ChevronDown, Copy, History, Play, Redo2, Settings, Sparkles, Undo2 } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js';
import { useT } from '@/i18n/useT.js';
import { useCardStore, useTemporalStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

export type { RunTarget };

const DEFAULT_TARGET: RunTarget = 'claude-code';

interface ActionBarProps {
  onHistory?: () => void;
  onSettings?: () => void;
  onRefine?: () => void;
  projectPath?: string;
}

export interface ActionBarHandle {
  copy: () => Promise<void>;
  runDefault: () => Promise<void>;
}

/**
 * @ui-ids WORK_ACTIONBAR_UNDO, WORK_ACTIONBAR_REDO,
 *   WORK_ACTIONBAR_COPY, WORK_ACTIONBAR_RUN, WORK_ACTIONBAR_HISTORY, WORK_ACTIONBAR_SETTINGS,
 *   WORK_ACTIONBAR_REFINE
 */
export const ActionBar = forwardRef<ActionBarHandle, ActionBarProps>(({ onHistory, onSettings, onRefine, projectPath }, ref) => {
  const t = useT();
  const prompt = useCardStore((s) => s.prompt);
  const treeId = useCardStore((s) => s.treeId);
  const cards = useCardStore((s) => s.cards);
  const { undo, redo, pastStates, futureStates } = useTemporalStore();
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;
  const [available, setAvailable] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/prompt/providers', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => setAvailable(data as Record<string, boolean>))
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') setAvailable({});
      });
    return () => ac.abort();
  }, []);

  const saveHistory = useCallback(() => {
    if (!prompt || !treeId) return;
    // fire-and-forget — 복사/실행 성공은 저장 결과와 무관
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        treeId,
        prompt,
        situation: cards.find((c) => c.id === 'goal')?.value ?? '',
        answers: Object.fromEntries(cards.map((c) => [c.id, c.value])),
      }),
    }).catch(() => {});
  }, [prompt, treeId, cards]);

  const copy = useCallback(async () => {
    if (!prompt) {
      toast.warning(t('web.actionBar.noCopyPrompt'));
      return;
    }
    await navigator.clipboard.writeText(prompt);
    toast.success(t('web.actionBar.copied'));
    saveHistory();
  }, [prompt, saveHistory, t]);

  const run = useCallback(
    async (target: RunTarget) => {
      if (!prompt) {
        toast.warning(t('web.actionBar.noRunPrompt'));
        return;
      }
      if (!projectPath) {
        toast.warning(t('web.actionBar.noProjectPath'));
        return;
      }
      try {
        await navigator.clipboard.writeText(prompt);
        const res = await fetch('/api/prompt/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target, cwd: projectPath }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string; bin?: string };
          if (res.status === 409) throw new Error(t('web.actionBar.notInstalled', { bin: body.bin ?? PROVIDERS[target].bin }));
          if (body.error === 'invalid_cwd') throw new Error(t('web.actionBar.invalidCwd'));
          throw new Error(`HTTP ${res.status}`);
        }
        toast.success(t('web.actionBar.runSuccess', { label: PROVIDERS[target].label }));
        saveHistory();
      } catch (err) {
        toast.error(t('web.actionBar.runFailed', { message: (err as Error).message }));
      }
    },
    [prompt, projectPath, saveHistory, t]
  );

  const runDefault = useCallback(() => run(DEFAULT_TARGET), [run]);

  useImperativeHandle(ref, () => ({ copy, runDefault }), [copy, runDefault]);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-ui-id={UI_IDS.WORK_ACTIONBAR_UNDO}
            disabled={!canUndo}
            onClick={() => undo()}
            aria-label={t('web.actionBar.undoLabel')}
            className="size-8"
          >
            <Undo2 size={15} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('web.actionBar.undoTooltip')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-ui-id={UI_IDS.WORK_ACTIONBAR_REDO}
            disabled={!canRedo}
            onClick={() => redo()}
            aria-label={t('web.actionBar.redoLabel')}
            className="size-8"
          >
            <Redo2 size={15} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('web.actionBar.redoTooltip')}</TooltipContent>
      </Tooltip>

      <div className="h-5 w-px bg-border mx-1" aria-hidden />

      {onHistory && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-ui-id={UI_IDS.WORK_ACTIONBAR_HISTORY}
              onClick={onHistory}
              aria-label={t('web.actionBar.historyLabel')}
              className="size-8"
            >
              <History size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('web.actionBar.historyTooltip')}</TooltipContent>
        </Tooltip>
      )}

      {onSettings && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-ui-id={UI_IDS.WORK_ACTIONBAR_SETTINGS}
              onClick={onSettings}
              aria-label={t('web.actionBar.settingsLabel')}
              className="size-8"
            >
              <Settings size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('web.actionBar.settingsTooltip')}</TooltipContent>
        </Tooltip>
      )}

      {onRefine && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-ui-id={UI_IDS.WORK_ACTIONBAR_REFINE}
              onClick={onRefine}
              aria-label={t('web.refine.actionLabel')}
              className="size-8"
            >
              <Sparkles size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('web.refine.tooltip')}</TooltipContent>
        </Tooltip>
      )}

      <Button type="button" variant="outline" size="sm" data-ui-id={UI_IDS.WORK_ACTIONBAR_COPY} onClick={copy} disabled={!prompt} className="h-8 gap-2">
        <Copy size={14} />
        {t('web.actionBar.copy')}
        <kbd className="ml-1 text-[10px] font-code text-muted-foreground">⌘↵</kbd>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="default" size="sm" data-ui-id={UI_IDS.WORK_ACTIONBAR_RUN} disabled={!prompt} className="h-8 gap-1.5">
            <Play size={13} />
            Run as
            <ChevronDown size={13} className="opacity-80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuLabel className="text-[10.5px] font-code uppercase tracking-[0.07em] text-muted-foreground">
            {t('web.actionBar.selectTarget')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {RUN_TARGETS.map((target) => {
            const installed = available[target] !== false;
            return (
              <DropdownMenuItem key={target} disabled={!installed} onSelect={() => run(target)} className="flex items-center justify-between gap-4">
                <span>{PROVIDERS[target].label}</span>
                <span className="text-[11px] font-code text-muted-foreground">
                  {installed ? PROVIDERS[target].launch.join(' ') : t('web.actionBar.notInstalledShort')}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

ActionBar.displayName = 'ActionBar';
