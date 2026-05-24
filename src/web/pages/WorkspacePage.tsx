import type { RoleMappings } from '@core/builder/role-resolver.js';
import type { CardDefinition, TreeConfig } from '@core/types/card.js';
import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActionBarHandle } from '@/components/ActionBar/ActionBar.js';
import { CardPoolSidebar } from '@/components/CardPool/CardPoolSidebar.js';
import { HistorySheet } from '@/components/HistorySheet/HistorySheet.js';
import { PromptPreview } from '@/components/PromptPreview/PromptPreview.js';
import { PINNED_CARD_IDS, SectionCard } from '@/components/SectionCard/SectionCard.js';
import { SettingsSheet } from '@/components/SettingsSheet/SettingsSheet.js';
import { TopBar } from '@/components/TopBar/TopBar.js';
import { Button } from '@/components/ui/button.js';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog.js';
import { useCardSession } from '@/hooks/useCardSession.js';
import { useKeyboard } from '@/hooks/useKeyboard.js';
import { useScan } from '@/hooks/useScan.js';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

interface WorkspacePageProps {
  treeId: string;
  projectPath?: string;
  onBack: () => void;
}

/**
 * @ui-ids WORK_RESTORE_DIALOG, WORK_SECTION_LIST, WORK_RIGHT_PANEL
 */
export function WorkspacePage({ treeId, projectPath = '', onBack }: WorkspacePageProps) {
  const { activeCards, reorderCards, scanResult } = useCardStore();
  const { initSession, getSavedSession, restoreSession, clearSavedSession } = useCardSession();
  const { scan, isScanLoading } = useScan();
  const actionBarRef = useRef<ActionBarHandle | null>(null);

  const [treeConfig, setTreeConfig] = useState<TreeConfig | null>(null);
  const [roleMappings, setRoleMappings] = useState<RoleMappings | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<ReturnType<typeof getSavedSession>>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once when treeId changes
  useEffect(() => {
    fetch(`/api/trees/${treeId}`)
      .then((r) => r.json())
      .then(async ({ tree, cardDefs, roleMappings: rm }: { tree: TreeConfig; cardDefs: Record<string, CardDefinition>; roleMappings?: RoleMappings }) => {
        setTreeConfig(tree);
        if (rm) setRoleMappings(rm);
        const normalizePath = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '');
        const saved = getSavedSession(treeId);
        const savedPathMatches = saved?.projectPath === undefined || normalizePath(saved.projectPath) === normalizePath(projectPath);
        if (saved && savedPathMatches) {
          setPendingRestore(saved);
          setShowRestorePrompt(true);
        } else {
          const existingScan = useCardStore.getState().scanResult;
          const scanMatchesPath = existingScan?.path === projectPath;
          initSession(tree, cardDefs, scanMatchesPath ? existingScan : null, undefined, rm ?? null);
          if (projectPath && !scanMatchesPath) await scan(projectPath, { silent: true });
        }
      });
  }, [treeId]);

  const handleRestoreYes = useCallback(() => {
    if (pendingRestore) restoreSession(pendingRestore);
    setShowRestorePrompt(false);
  }, [pendingRestore, restoreSession]);

  const handleRestoreNo = useCallback(() => {
    if (treeConfig) {
      fetch('/api/cards')
        .then((r) => r.json())
        .then((cardDefs: Record<string, CardDefinition>) => {
          const existingScan = useCardStore.getState().scanResult;
          const scanMatchesPath = existingScan?.path === projectPath;
          initSession(treeConfig, cardDefs, scanMatchesPath ? existingScan : null, undefined, roleMappings);
          clearSavedSession(treeId);
        });
    }
    setShowRestorePrompt(false);
  }, [treeConfig, treeId, projectPath, initSession, clearSavedSession, roleMappings]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const activeId = active.id as string;
      const overId = over.id as string;
      if (PINNED_CARD_IDS.has(activeId) || PINNED_CARD_IDS.has(overId)) return;
      const active_ids = activeCards().map((c) => c.id);
      const oldIdx = active_ids.indexOf(activeId);
      const newIdx = active_ids.indexOf(overId);
      const reordered = [...active_ids];
      reordered.splice(oldIdx, 1);
      reordered.splice(newIdx, 0, activeId);
      reorderCards(reordered);
    },
    [activeCards, reorderCards]
  );

  useKeyboard({
    onCopy: () => actionBarRef.current?.copy(),
    onRunDefault: () => actionBarRef.current?.runDefault(),
  });

  const active = activeCards();
  const emptyCount = active.filter((c) => !c.value).length;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* 이전 작업 복원 다이얼로그 */}
      <Dialog open={showRestorePrompt}>
        <DialogContent
          data-ui-id={UI_IDS.WORK_RESTORE_DIALOG}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-sm text-center"
        >
          <DialogTitle>이전 작업을 이어서 할까요?</DialogTitle>
          <DialogDescription>저장된 세션이 있습니다.</DialogDescription>
          <div className="flex gap-3 justify-center pt-2">
            <Button onClick={handleRestoreYes}>이어서 하기</Button>
            <Button variant="outline" onClick={handleRestoreNo}>
              새로 시작
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 상단 44px TopBar */}
      <TopBar
        treeConfig={treeConfig}
        projectPath={scanResult?.path ?? projectPath}
        scanResult={scanResult}
        isScanLoading={isScanLoading}
        onBack={onBack}
        onRescan={(p) => scan(p)}
        onHistory={() => setShowHistory(true)}
        onSettings={() => setShowSettings(true)}
        actionBarRef={actionBarRef}
      />

      {/* 3열 본문 */}
      <div className="flex-1 flex min-h-0">
        <CardPoolSidebar treeConfig={treeConfig} scanResult={scanResult} />

        {/* 중앙 에디터 */}
        <main className="flex-1 min-w-0 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-baseline gap-2 mb-1">
              <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-foreground">프롬프트 작성</h1>
              <span className="text-[11.5px] font-code text-muted-foreground">
                {active.length} active · {emptyCount} empty
              </span>
            </div>
            {treeConfig && <p className="text-[12.5px] text-secondary-foreground max-w-prose mb-5">{treeConfig.description}</p>}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={active.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2" data-ui-id={UI_IDS.WORK_SECTION_LIST}>
                  {active.map((card) => (
                    <SectionCard key={card.id} card={card} variant="filled" scanRoot={scanResult?.path} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </main>

        {/* 우측 440px Preview */}
        <aside className="w-[440px] shrink-0 border-l border-border bg-muted flex flex-col min-h-0" data-ui-id={UI_IDS.WORK_RIGHT_PANEL}>
          <PromptPreview />
        </aside>
      </div>

      <HistorySheet open={showHistory} onClose={() => setShowHistory(false)} currentTreeId={treeId} />
      <SettingsSheet open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
