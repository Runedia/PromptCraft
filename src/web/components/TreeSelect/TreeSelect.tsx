import type { TreeConfig } from '@core/types/card.js';
import { BookOpen, Bug, FolderOpen, GitPullRequest, X, Zap } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FolderBrowser } from '@/components/FolderBrowser/FolderBrowser.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { cn } from '@/lib/utils.js';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

interface TreeSelectProps {
  onSelect: (treeId: string, projectPath: string) => void;
}

const CARD_STYLES: Record<
  string,
  {
    icon: React.ReactNode;
    borderColor: string;
    iconBg: string;
    iconColor: string;
    hoverBorder: string;
  }
> = {
  'error-solving': {
    icon: <Bug size={20} />,
    borderColor: 'border-t-destructive',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    hoverBorder: 'hover:border-destructive',
  },
  'feature-impl': {
    icon: <Zap size={20} />,
    borderColor: 'border-t-success',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    hoverBorder: 'hover:border-success',
  },
  'code-review': {
    icon: <GitPullRequest size={20} />,
    borderColor: 'border-t-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    hoverBorder: 'hover:border-primary',
  },
  'concept-learn': {
    icon: <BookOpen size={20} />,
    borderColor: 'border-t-warning',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    hoverBorder: 'hover:border-warning',
  },
};

const DEFAULT_CARD_STYLE = {
  icon: <Zap size={20} />,
  borderColor: 'border-t-primary',
  iconBg: 'bg-primary/10',
  iconColor: 'text-primary',
  hoverBorder: 'hover:border-primary',
};

/**
 * @ui-ids TREE_HERO, TREE_PATH_CARD, TREE_PATH_INPUT, TREE_PATH_CLEAR_BTN,
 *   TREE_PATH_BROWSE_BTN, TREE_PATH_ROLE_CHIPS, TREE_CARD_GRID, TREE_CARD
 */
export function TreeSelect({ onSelect }: TreeSelectProps) {
  const SESSION_PATH_KEY = 'promptcraft:projectPath';

  const { setScanResult } = useCardStore();
  const [trees, setTrees] = useState<Pick<TreeConfig, 'id' | 'label' | 'description' | 'icon'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectPath, setProjectPath] = useState(() => sessionStorage.getItem(SESSION_PATH_KEY) ?? '');
  const [showBrowser, setShowBrowser] = useState(false);
  const [isPreScanning, setIsPreScanning] = useState(false);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [scanReady, setScanReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isPathEmpty = projectPath.trim().length === 0;
  const isDisabled = isPathEmpty || isPreScanning || !scanReady;
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    fetch('/api/trees')
      .then((r) => r.json())
      .then(setTrees)
      .finally(() => {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      });
  }, []);

  useEffect(() => {
    setSuggestedRoles([]);
    setScanReady(false);
    if (projectPath.length < 3) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsPreScanning(true);
      let aborted = false;
      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: projectPath }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const result = await res.json();
        setScanResult(result);
        const roles = (result.roleSuggestions as string[] | undefined) ?? [];
        setSuggestedRoles(roles);
      } catch (e) {
        if ((e as Error).name === 'AbortError') aborted = true;
        else setSuggestedRoles([]);
      } finally {
        setIsPreScanning(false);
        if (!aborted) setScanReady(true);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
      setIsPreScanning(false);
    };
  }, [projectPath, setScanResult]);

  const handleBrowseSelect = useCallback((selected: string) => {
    setProjectPath(selected);
    sessionStorage.setItem(SESSION_PATH_KEY, selected);
    setShowBrowser(false);
    inputRef.current?.focus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-10 bg-background">
      {/* 히어로 섹션 */}
      <div className="flex flex-col items-center gap-3 text-center" data-ui-id={UI_IDS.TREE_HERO}>
        <div className="flex items-center gap-2 mb-1">
          <div className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary tracking-widest uppercase">AI Coding Assistant</span>
          <div className="size-2 rounded-full bg-primary animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-foreground">Prompt</span>
          <span className="text-primary">Craft</span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          상황을 선택하면 입력을 자동으로 구조화해
          <br />단 한 번의 AI 호출로 끝나는 프롬프트를 완성합니다
        </p>
      </div>

      {/* 프로젝트 경로 입력 */}
      <div
        className="w-full mx-10 max-w-[600px] flex flex-col gap-4 p-6 bg-card rounded-2xl border border-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
        data-ui-id={UI_IDS.TREE_PATH_CARD}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
            <FolderOpen size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">대상 프로젝트 경로</p>
            <p className="text-xs text-muted-foreground">경로를 입력하면 프로젝트를 자동 스캔합니다</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className={cn('relative flex-1 rounded-lg transition-shadow', nudge && 'ring-2 ring-warning/60')}>
            <Input
              ref={inputRef}
              type="text"
              data-ui-id={UI_IDS.TREE_PATH_INPUT}
              className="pr-8 font-code"
              value={projectPath}
              onChange={(e) => {
                setProjectPath(e.target.value);
                sessionStorage.setItem(SESSION_PATH_KEY, e.target.value);
              }}
              placeholder="예: C:/my-project  또는  /home/user/project"
              spellCheck={false}
            />
            {projectPath && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                data-ui-id={UI_IDS.TREE_PATH_CLEAR_BTN}
                className="absolute right-1 top-1/2 -translate-y-1/2 size-6 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setProjectPath('');
                  sessionStorage.removeItem(SESSION_PATH_KEY);
                  inputRef.current?.focus();
                }}
                tabIndex={-1}
                aria-label="경로 지우기"
              >
                <X size={13} />
              </Button>
            )}
          </div>
          <Button type="button" variant="secondary" size="sm" data-ui-id={UI_IDS.TREE_PATH_BROWSE_BTN} onClick={() => setShowBrowser(true)}>
            <FolderOpen data-icon="inline-start" size={14} />
            탐색
          </Button>
        </div>

        {/* 역할 제안 칩 */}
        {(isPreScanning || suggestedRoles.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1" data-ui-id={UI_IDS.TREE_PATH_ROLE_CHIPS}>
            {isPreScanning ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-full border border-muted-foreground border-t-transparent animate-spin" />
                분석 중...
              </span>
            ) : (
              <>
                <span className="text-xs text-muted-foreground shrink-0">예상 역할:</span>
                {suggestedRoles.map((role) => (
                  <span key={role} className="text-xs rounded-full px-2 py-0.5 bg-muted border border-border/50 text-muted-foreground">
                    {role}
                  </span>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* 상황 선택 제목 */}
      <div className="flex items-center gap-3 w-full max-w-[600px]">
        <div className="flex-1 h-px bg-border/50" />
        <p className={cn('text-xs font-semibold tracking-widest uppercase whitespace-nowrap', isPathEmpty ? 'text-warning' : 'text-muted-foreground')}>
          {isPathEmpty ? '먼저 프로젝트 경로를 입력하세요' : !scanReady ? '분석 완료 후 활성화됩니다' : '상황을 선택하세요'}
        </p>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* 상황 카드 그리드 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-[600px] -mt-4" data-ui-id={UI_IDS.TREE_CARD_GRID}>
        {trees.map((tree) => {
          const style = CARD_STYLES[tree.id] ?? DEFAULT_CARD_STYLE;
          return (
            <button
              key={tree.id}
              type="button"
              data-ui-id={UI_IDS.TREE_CARD}
              data-ui-tree-id={tree.id}
              aria-disabled={isDisabled}
              title={isPathEmpty ? '프로젝트 경로를 먼저 입력하세요' : isDisabled ? '분석이 완료되면 선택할 수 있습니다' : undefined}
              className={[
                'group flex flex-col items-start gap-4 p-6',
                'bg-card rounded-2xl text-left cursor-pointer',
                'border border-border/50 border-t-[3px]',
                style.borderColor,
                'shadow-[0_2px_12px_rgba(0,0,0,0.4)]',
                'transition-all duration-200',
                'hover:shadow-[0_8px_28px_rgba(0,0,0,0.55)] hover:-translate-y-1',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                'active:translate-y-0',
                'aria-disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:hover:shadow-[0_2px_12px_rgba(0,0,0,0.4)] aria-disabled:hover:translate-y-0',
                style.hoverBorder,
              ].join(' ')}
              onClick={() => {
                if (isDisabled) {
                  if (isPathEmpty) {
                    inputRef.current?.focus();
                    setNudge(true);
                    setTimeout(() => setNudge(false), 800);
                  }
                  return;
                }
                onSelect(tree.id, projectPath.trim());
              }}
            >
              <div
                className={`flex items-center justify-center size-10 rounded-xl ${style.iconBg} ${style.iconColor} transition-transform duration-200 group-hover:scale-110`}
              >
                {style.icon}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-foreground leading-tight">{tree.label}</span>
                <span className="text-xs text-muted-foreground leading-relaxed">{tree.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {showBrowser && <FolderBrowser initialPath={projectPath || undefined} onSelect={handleBrowseSelect} onClose={() => setShowBrowser(false)} />}
    </div>
  );
}
