import type { RoleMappings } from '@core/builder/role-resolver.js';
import type { CardDefinition, TreeConfig } from '@core/types/card.js';
import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Scan } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CardPool } from '@/components/CardPool/CardPool.js';
import { PromptPreview } from '@/components/PromptPreview/PromptPreview.js';
import { SectionCard } from '@/components/SectionCard/SectionCard.js';
import { Button } from '@/components/ui/button.js';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog.js';
import { Input } from '@/components/ui/input.js';
import { useCardSession } from '@/hooks/useCardSession.js';
import { useScan } from '@/hooks/useScan.js';
import { getTreeCardStyle } from '@/lib/treeCardStyles.js';
import { cn } from '@/lib/utils.js';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

interface WorkspacePageProps {
  treeId: string;
  projectPath?: string;
  onBack: () => void;
}

/**
 * @ui-ids WORK_RESTORE_DIALOG, WORK_LEFT_PANEL, WORK_LEFT_HEADER, WORK_LEFT_BACK_BTN,
 *   WORK_LEFT_SCAN_BTN, WORK_SCAN_INPUT, WORK_SCAN_EXECUTE_BTN, WORK_SECTION_LIST,
 *   WORK_RIGHT_PANEL
 */
export function WorkspacePage({ treeId, projectPath = '', onBack }: WorkspacePageProps) {
  const { activeCards, reorderCards, scanResult } = useCardStore();
  const { initSession, getSavedSession, restoreSession, clearSavedSession } = useCardSession();
  const { scan, isScanLoading } = useScan();

  const [treeConfig, setTreeConfig] = useState<TreeConfig | null>(null);
  const treeCardStyle = treeConfig ? getTreeCardStyle(treeConfig.id) : null;
  const [roleMappings, setRoleMappings] = useState<RoleMappings | null>(null);
  const [scanPath, setScanPath] = useState(projectPath);
  const [showScanInput, setShowScanInput] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<ReturnType<typeof getSavedSession>>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

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
          if (projectPath && !scanMatchesPath) await scan(projectPath);
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
      const active_ids = activeCards().map((c) => c.id);
      const oldIdx = active_ids.indexOf(active.id as string);
      const newIdx = active_ids.indexOf(over.id as string);
      const reordered = [...active_ids];
      reordered.splice(oldIdx, 1);
      reordered.splice(newIdx, 0, active.id as string);
      reorderCards(reordered);
    },
    [activeCards, reorderCards]
  );

  const handleScan = useCallback(async () => {
    if (scanPath) await scan(scanPath);
    setShowScanInput(false);
  }, [scan, scanPath]);

  const active = activeCards();

  return (
    <div className="grid grid-cols-[3fr_2fr] h-screen overflow-hidden">
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

      {/* 좌측 패널 */}
      <div className="flex flex-col border-r border-border/50 overflow-hidden" data-ui-id={UI_IDS.WORK_LEFT_PANEL}>
        {/* 고정 헤더 */}
        <div className="flex-none px-5 py-3 border-b border-border/50 bg-background" data-ui-id={UI_IDS.WORK_LEFT_HEADER}>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" data-ui-id={UI_IDS.WORK_LEFT_BACK_BTN} onClick={onBack}>
              ← 뒤로
            </Button>
            {treeConfig && treeCardStyle && (
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className={cn('flex items-center justify-center size-6 rounded-md', treeCardStyle.iconBg, treeCardStyle.iconColor)}>
                  {treeCardStyle.icon(14)}
                </span>
                {treeConfig.label}
              </span>
            )}
            <div className="ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ui-id={UI_IDS.WORK_LEFT_SCAN_BTN}
                className={showScanInput ? 'border-primary text-primary bg-primary/10' : ''}
                onClick={() => setShowScanInput(!showScanInput)}
                title="프로젝트 스캔"
              >
                <Scan data-icon="inline-start" size={13} />
                {scanResult ? '재스캔' : '스캔'}
              </Button>
            </div>
          </div>

          {/* 스캔 입력 (토글) */}
          {showScanInput && (
            <div className="mt-3 flex gap-2 items-center">
              <Input
                type="text"
                data-ui-id={UI_IDS.WORK_SCAN_INPUT}
                className="flex-1 font-code text-sm"
                value={scanPath}
                onChange={(e) => setScanPath(e.target.value)}
                placeholder="프로젝트 경로 (예: C:/my-project)"
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
              <Button
                type="button"
                variant="default"
                size="sm"
                data-ui-id={UI_IDS.WORK_SCAN_EXECUTE_BTN}
                onClick={handleScan}
                disabled={isScanLoading}
                className="shrink-0"
              >
                {isScanLoading ? '스캔 중...' : '실행'}
              </Button>
            </div>
          )}
        </div>

        {/* 스크롤 가능한 카드 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={active.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-4" data-ui-id={UI_IDS.WORK_SECTION_LIST}>
                {active.map((card) => (
                  <SectionCard key={card.id} card={card} scanRoot={scanResult?.path} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <CardPool />
        </div>
      </div>

      {/* 우측 패널 */}
      <div className="flex flex-col overflow-hidden" data-ui-id={UI_IDS.WORK_RIGHT_PANEL}>
        <PromptPreview onSave={() => setShowSaveModal(true)} />
      </div>

      {showSaveModal && <SaveTemplateModal treeId={treeId} onClose={() => setShowSaveModal(false)} />}
    </div>
  );
}

/**
 * @ui-ids WORK_SAVE_TEMPLATE_MODAL, WORK_SAVE_TEMPLATE_INPUT,
 *   WORK_SAVE_TEMPLATE_SAVE_BTN, WORK_SAVE_TEMPLATE_CANCEL_BTN
 */
function SaveTemplateModal({ treeId, onClose }: { treeId: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const { cards } = useCardStore();

  const handleSave = async () => {
    if (!name.trim()) return;
    await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        treeId,
        answers: Object.fromEntries(cards.map((c) => [c.id, c.value])),
      }),
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-ui-id={UI_IDS.WORK_SAVE_TEMPLATE_MODAL} className="w-[400px]">
        <DialogTitle>템플릿 저장</DialogTitle>
        <Input
          type="text"
          data-ui-id={UI_IDS.WORK_SAVE_TEMPLATE_INPUT}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="템플릿 이름"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="default" data-ui-id={UI_IDS.WORK_SAVE_TEMPLATE_SAVE_BTN} onClick={handleSave} disabled={!name.trim()}>
            저장
          </Button>
          <Button type="button" variant="outline" data-ui-id={UI_IDS.WORK_SAVE_TEMPLATE_CANCEL_BTN} onClick={onClose}>
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
