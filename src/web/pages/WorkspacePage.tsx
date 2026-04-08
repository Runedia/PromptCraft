import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Scan } from 'lucide-react';
import { useCardStore } from '../store/cardStore.js';
import { useCardSession } from '../hooks/useCardSession.js';
import { useScan } from '../hooks/useScan.js';
import { SectionCard } from '../components/SectionCard/SectionCard.js';
import { CardPool } from '../components/CardPool/CardPool.js';
import { PromptPreview } from '../components/PromptPreview/PromptPreview.js';
import type { TreeConfig, CardDefinition } from '../../core/types/card.js';

interface WorkspacePageProps {
  treeId: string;
  projectPath?: string;
  onBack: () => void;
}

export function WorkspacePage({ treeId, projectPath = '', onBack }: WorkspacePageProps) {
  const { activeCards, reorderCards, scanResult } = useCardStore();
  const { initSession, getSavedSession, restoreSession, clearSavedSession } = useCardSession();
  const { scan, isScanLoading } = useScan();

  const [treeConfig, setTreeConfig] = useState<TreeConfig | null>(null);
  const [scanPath, setScanPath] = useState(projectPath);
  const [showScanInput, setShowScanInput] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<ReturnType<typeof getSavedSession>>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once when treeId changes
  useEffect(() => {
    fetch(`/api/trees/${treeId}`)
      .then((r) => r.json())
      .then(async ({ tree, cardDefs }: { tree: TreeConfig; cardDefs: Record<string, CardDefinition> }) => {
        setTreeConfig(tree);
        const saved = getSavedSession(treeId);
        if (saved) {
          setPendingRestore(saved);
          setShowRestorePrompt(true);
        } else {
          const existingScan = useCardStore.getState().scanResult;
          const scanMatchesPath = existingScan?.path === projectPath;
          initSession(tree, cardDefs, scanMatchesPath ? existingScan : null);
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
          initSession(treeConfig, cardDefs, scanMatchesPath ? existingScan : null);
          clearSavedSession(treeId);
        });
    }
    setShowRestorePrompt(false);
  }, [treeConfig, treeId, projectPath, initSession, clearSavedSession]);

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
      {showRestorePrompt && (
        <div role="presentation" className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200]">
          <div role="dialog" aria-modal="true" className="bg-bg-secondary border border-border rounded-2xl p-8 flex flex-col gap-4 items-center max-w-sm w-full mx-4">
            <div className="text-center">
              <p className="text-text-primary font-semibold mb-1">이전 작업을 이어서 할까요?</p>
              <p className="text-xs text-text-muted">저장된 세션이 있습니다.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-2 bg-accent-primary text-white hover:brightness-110 transition-all"
                onClick={handleRestoreYes}
              >
                이어서 하기
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-2 border border-border bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all"
                onClick={handleRestoreNo}
              >
                새로 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 좌측 패널 */}
      <div className="flex flex-col border-r border-border-subtle overflow-hidden">
        {/* 고정 헤더 */}
        <div className="flex-none px-5 py-3 border-b border-border-subtle bg-bg-primary">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-text-muted text-sm px-2 py-1 rounded-md transition-colors hover:text-text-primary hover:bg-bg-tertiary"
              onClick={onBack}
            >
              ← 뒤로
            </button>
            {treeConfig && (
              <span className="text-sm font-semibold text-text-primary">
                {treeConfig.icon} {treeConfig.label}
              </span>
            )}
            <div className="ml-auto">
              <button
                type="button"
                className={[
                  'inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-all border',
                  showScanInput
                    ? 'border-accent-primary text-accent-primary bg-[rgba(59,130,246,0.08)]'
                    : 'border-border bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                ].join(' ')}
                onClick={() => setShowScanInput(!showScanInput)}
                title="프로젝트 스캔"
              >
                <Scan size={13} />
                {scanResult ? '재스캔' : '스캔'}
              </button>
            </div>
          </div>

          {/* 스캔 입력 (토글) */}
          {showScanInput && (
            <div className="mt-3 flex gap-2 items-center">
              <input
                type="text"
                className="flex-1 bg-bg-tertiary border border-border rounded-lg text-text-primary px-3 py-1.5 text-sm outline-none focus:border-accent-primary placeholder:text-text-muted font-code"
                value={scanPath}
                onChange={(e) => setScanPath(e.target.value)}
                placeholder="프로젝트 경로 (예: C:/my-project)"
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 bg-accent-success text-white hover:brightness-110 transition-all disabled:opacity-40 shrink-0"
                onClick={handleScan}
                disabled={isScanLoading}
              >
                {isScanLoading ? '스캔 중...' : '실행'}
              </button>
            </div>
          )}
        </div>

        {/* 스크롤 가능한 카드 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={active.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-4">
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
      <div className="flex flex-col overflow-hidden">
        <PromptPreview onSave={() => setShowSaveModal(true)} />
      </div>

      {showSaveModal && (
        <SaveTemplateModal treeId={treeId} onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}

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
    // biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop click-away pattern
    <div role="presentation" className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-bg-secondary border border-border rounded-2xl p-8 w-[400px] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-text-primary">템플릿 저장</h3>
        <input
          type="text"
          className="w-full bg-bg-primary border border-border rounded-lg text-text-primary px-3 py-2 text-base transition-colors outline-none focus:border-accent-primary placeholder:text-text-muted"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="템플릿 이름"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-2 bg-accent-success text-white hover:brightness-110 transition-all border border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            저장
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-2 border border-border bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
