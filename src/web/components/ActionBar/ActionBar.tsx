import { BookmarkPlus, ChevronDown, Copy, Play, Redo2, Undo2 } from 'lucide-react';
import { forwardRef, useCallback, useImperativeHandle } from 'react';
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

export type RunTarget = 'claude-code' | 'gemini' | 'copilot' | 'codex';

const TARGETS: { id: RunTarget; label: string; cmd: string }[] = [
  { id: 'claude-code', label: 'Claude Code', cmd: 'claude' },
  { id: 'gemini', label: 'Gemini', cmd: 'gemini' },
  { id: 'copilot', label: 'GitHub Copilot', cmd: 'gh copilot' },
  { id: 'codex', label: 'Codex', cmd: 'codex' },
];

const DEFAULT_TARGET: RunTarget = 'claude-code';

interface ActionBarProps {
  onSave?: () => void;
}

export interface ActionBarHandle {
  copy: () => Promise<void>;
  runDefault: () => Promise<void>;
}

/**
 * @ui-ids WORK_ACTIONBAR_UNDO, WORK_ACTIONBAR_REDO, WORK_ACTIONBAR_SAVE,
 *   WORK_ACTIONBAR_COPY, WORK_ACTIONBAR_RUN
 */
export const ActionBar = forwardRef<ActionBarHandle, ActionBarProps>(({ onSave }, ref) => {
  const prompt = useCardStore((s) => s.prompt);
  const { undo, redo, pastStates, futureStates } = useTemporalStore();
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const copy = useCallback(async () => {
    if (!prompt) {
      toast.warning('복사할 프롬프트가 없습니다.');
      return;
    }
    await navigator.clipboard.writeText(prompt);
    toast.success('Copied to clipboard');
  }, [prompt]);

  const run = useCallback(
    async (target: RunTarget) => {
      if (!prompt) {
        toast.warning('실행할 프롬프트가 없습니다.');
        return;
      }
      try {
        const res = await fetch('/api/prompt/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, target }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { runId } = (await res.json()) as { runId?: string };
        const label = TARGETS.find((t) => t.id === target)?.label ?? target;
        toast.success(`${label} run started${runId ? ` · ${runId.slice(0, 4)}` : ''}`);
      } catch (err) {
        toast.error(`실행 실패: ${(err as Error).message}`);
      }
    },
    [prompt]
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

      {onSave && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-ui-id={UI_IDS.WORK_ACTIONBAR_SAVE}
              onClick={onSave}
              aria-label="템플릿 저장"
              className="size-8"
            >
              <BookmarkPlus size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>템플릿 저장 (⌘S)</TooltipContent>
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
          {TARGETS.map((t) => (
            <DropdownMenuItem key={t.id} onSelect={() => run(t.id)} className="flex items-center justify-between gap-4">
              <span>{t.label}</span>
              <span className="text-[11px] font-code text-muted-foreground">{t.cmd}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

ActionBar.displayName = 'ActionBar';
