import { PROVIDERS, RUN_TARGETS, type RunTarget } from '@core/run/providers.js';
import { ChevronDown, Copy, History, Play, Redo2, Settings, Undo2 } from 'lucide-react';
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
import { useCardStore, useTemporalStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

export type { RunTarget };

const DEFAULT_TARGET: RunTarget = 'claude-code';

interface ActionBarProps {
  onHistory?: () => void;
  onSettings?: () => void;
  projectPath?: string;
}

export interface ActionBarHandle {
  copy: () => Promise<void>;
  runDefault: () => Promise<void>;
}

/**
 * @ui-ids WORK_ACTIONBAR_UNDO, WORK_ACTIONBAR_REDO,
 *   WORK_ACTIONBAR_COPY, WORK_ACTIONBAR_RUN, WORK_ACTIONBAR_HISTORY, WORK_ACTIONBAR_SETTINGS
 */
export const ActionBar = forwardRef<ActionBarHandle, ActionBarProps>(({ onHistory, onSettings, projectPath }, ref) => {
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
      toast.warning('복사할 프롬프트가 없습니다.');
      return;
    }
    await navigator.clipboard.writeText(prompt);
    toast.success('클립보드에 복사됨');
    saveHistory();
  }, [prompt, saveHistory]);

  const run = useCallback(
    async (target: RunTarget) => {
      if (!prompt) {
        toast.warning('실행할 프롬프트가 없습니다.');
        return;
      }
      if (!projectPath) {
        toast.warning('프로젝트 경로가 없습니다.');
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
          if (res.status === 409) throw new Error(`${body.bin ?? PROVIDERS[target].bin}이(가) 설치되어 있지 않습니다`);
          if (body.error === 'invalid_cwd') throw new Error('프로젝트 경로가 올바르지 않습니다');
          throw new Error(`HTTP ${res.status}`);
        }
        toast.success(`${PROVIDERS[target].label} 실행됨 · 프롬프트 복사됨, 새 창에서 Ctrl+V`);
        saveHistory();
      } catch (err) {
        toast.error(`실행 실패: ${(err as Error).message}`);
      }
    },
    [prompt, projectPath, saveHistory]
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
            aria-label="실행 취소"
            className="size-8"
          >
            <Undo2 size={15} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>실행 취소 (⌘Z)</TooltipContent>
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
            aria-label="다시 실행"
            className="size-8"
          >
            <Redo2 size={15} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>다시 실행 (⌘⇧Z)</TooltipContent>
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
              aria-label="히스토리"
              className="size-8"
            >
              <History size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>히스토리</TooltipContent>
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
              aria-label="설정"
              className="size-8"
            >
              <Settings size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>설정</TooltipContent>
        </Tooltip>
      )}

      <Button type="button" variant="outline" size="sm" data-ui-id={UI_IDS.WORK_ACTIONBAR_COPY} onClick={copy} disabled={!prompt} className="h-8 gap-2">
        <Copy size={14} />
        복사
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
          <DropdownMenuLabel className="text-[10.5px] font-code uppercase tracking-[0.07em] text-muted-foreground">대상 선택</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {RUN_TARGETS.map((t) => {
            const installed = available[t] !== false;
            return (
              <DropdownMenuItem key={t} disabled={!installed} onSelect={() => run(t)} className="flex items-center justify-between gap-4">
                <span>{PROVIDERS[t].label}</span>
                <span className="text-[11px] font-code text-muted-foreground">{installed ? PROVIDERS[t].launch.join(' ') : '미설치'}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

ActionBar.displayName = 'ActionBar';
