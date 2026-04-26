import type { TreeConfig } from '@core/types/card.js';
import { ChevronRight, FolderOpen, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FolderBrowser } from '@/components/FolderBrowser/FolderBrowser.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { getTreeCardStyle } from '@/lib/treeCardStyles.js';
import { cn } from '@/lib/utils.js';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

interface TreeSelectProps {
  onSelect: (treeId: string, projectPath: string) => void;
}

/**
 * @ui-ids TREE_HERO, TREE_PATH_CARD, TREE_PATH_INPUT, TREE_PATH_CLEAR_BTN,
 *   TREE_PATH_BROWSE_BTN, TREE_PATH_ROLE_CHIPS, TREE_CARD_GRID, TREE_CARD
 */
export function TreeSelect({ onSelect }: TreeSelectProps) {
  const SESSION_PATH_KEY = 'promptcraft:projectPath';

  const { setScanResult } = useCardStore();
  const [trees, setTrees] = useState<Pick<TreeConfig, 'id' | 'label' | 'description'>[]>([]);
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
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* 미니 헤더 바 */}
      <header className="flex items-center justify-between px-6 h-11 border-b border-border/50 shrink-0" data-ui-id={UI_IDS.TREE_HERO}>
        <span className="text-sm font-semibold">
          <span className="text-foreground">Prompt</span>
          <span className="text-primary">Craft</span>
        </span>
        <span className="text-xs text-muted-foreground hidden sm:block">프로젝트 컨텍스트 어시스턴트</span>
      </header>

      {/* 2패널 그리드 */}
      <main className="grid lg:grid-cols-[minmax(340px,40%)_1fr] gap-6 p-6 flex-1 min-h-0 overflow-auto lg:overflow-hidden">
        {/* 좌측: 프로젝트 경로 */}
        <section className="flex flex-col gap-4 bg-card rounded-xl border border-border/50 p-5 shadow-card self-start" data-ui-id={UI_IDS.TREE_PATH_CARD}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">1 · 프로젝트 경로</p>

          <div className="flex gap-2 items-center">
            <div className={cn('relative flex-1 rounded-lg transition-shadow', nudge && 'ring-2 ring-warning/60')}>
              <Input
                ref={inputRef}
                type="text"
                data-ui-id={UI_IDS.TREE_PATH_INPUT}
                className="pr-8 font-code text-sm"
                value={projectPath}
                onChange={(e) => {
                  setProjectPath(e.target.value);
                  sessionStorage.setItem(SESSION_PATH_KEY, e.target.value);
                }}
                placeholder="예: C:/my-project"
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
            <Button type="button" variant="outline" size="sm" data-ui-id={UI_IDS.TREE_PATH_BROWSE_BTN} onClick={() => setShowBrowser(true)}>
              <FolderOpen data-icon="inline-start" size={14} />
              탐색
            </Button>
          </div>

          {/* 스캔 상태 + 역할 칩 */}
          {(isPreScanning || scanReady) && (
            <div className="flex flex-col gap-2">
              {isPreScanning ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block size-3 rounded-full border border-muted-foreground border-t-transparent animate-spin" />
                  분석 중...
                </span>
              ) : (
                <>
                  <span className="text-xs text-success flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-success inline-block" />
                    스캔 완료
                  </span>
                  {suggestedRoles.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5" data-ui-id={UI_IDS.TREE_PATH_ROLE_CHIPS}>
                      <span className="text-xs text-muted-foreground shrink-0">예상 역할:</span>
                      {suggestedRoles.map((role) => (
                        <span key={role} className="text-xs rounded-full px-2 py-0.5 bg-muted border border-border/50 text-muted-foreground">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* 우측: 트리 선택 */}
        <section className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">2 · 어떤 작업을 하시나요?</p>
            {isPathEmpty ? (
              <span className="text-xs text-warning">먼저 경로를 입력하세요</span>
            ) : !scanReady && !isPreScanning ? null : !scanReady ? (
              <span className="text-xs text-muted-foreground">분석 완료 후 활성화</span>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 overflow-auto" data-ui-id={UI_IDS.TREE_CARD_GRID}>
            {trees.map((tree, index) => {
              const style = getTreeCardStyle(tree.id);
              return (
                <button
                  key={tree.id}
                  type="button"
                  data-ui-id={UI_IDS.TREE_CARD}
                  data-ui-tree-id={tree.id}
                  aria-disabled={isDisabled}
                  title={isPathEmpty ? '프로젝트 경로를 먼저 입력하세요' : isDisabled ? '분석이 완료되면 선택할 수 있습니다' : undefined}
                  style={{ animationDelay: `${index * 55}ms` }}
                  className={cn(
                    'group flex items-center gap-3 p-3 pr-4',
                    'bg-card rounded-lg text-left cursor-pointer',
                    'border border-border/50 border-t-[3px]',
                    style.borderColor,
                    'shadow-card',
                    'transition-all duration-200',
                    'hover:shadow-card-hover hover:-translate-y-0.5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    'active:translate-y-0',
                    'aria-disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:hover:shadow-card aria-disabled:hover:translate-y-0',
                    style.hoverBorder
                  )}
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
                    className={cn(
                      'flex items-center justify-center size-9 rounded-lg shrink-0',
                      style.iconBg,
                      style.iconColor,
                      'transition-transform duration-200 group-hover:scale-110'
                    )}
                  >
                    {style.icon(16)}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground leading-tight">{tree.label}</span>
                    <span className="text-xs text-muted-foreground leading-relaxed truncate">{tree.description}</span>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {showBrowser && <FolderBrowser initialPath={projectPath || undefined} onSelect={handleBrowseSelect} onClose={() => setShowBrowser(false)} />}
    </div>
  );
}
