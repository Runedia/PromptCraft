import type { RoleMappings } from '@core/builder/role-resolver.js';
import type { CardDefinition } from '@core/types/card.js';
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
import { useCardSession } from '@/hooks/useCardSession.js';
import { useKeyboard } from '@/hooks/useKeyboard.js';
import { useScan } from '@/hooks/useScan.js';
import { useLocale } from '@/i18n/LocaleContext.js';
import { useT } from '@/i18n/useT.js';
import { useCardStore } from '@/store/cardStore.js';
import type { ResolvedTree } from '@/types/tree.js';
import { UI_IDS } from '@/ui-ids.js';

interface WorkspacePageProps {
  treeId: string;
  projectPath?: string;
  onBack: () => void;
}

/**
 * @ui-ids WORK_SECTION_LIST, WORK_RIGHT_PANEL
 */
export function WorkspacePage({ treeId, projectPath = '', onBack }: WorkspacePageProps) {
  const t = useT();
  const { lang } = useLocale();
  const { activeCards, reorderCards, scanResult } = useCardStore();
  const { initSession, reresolveCardsForLang } = useCardSession();
  const { scan, isScanLoading } = useScan();
  const actionBarRef = useRef<ActionBarHandle | null>(null);

  const [treeConfig, setTreeConfig] = useState<ResolvedTree | null>(null);
  const [cardDefs, setCardDefs] = useState<Record<string, CardDefinition> | null>(null);
  const [roleMappings, setRoleMappings] = useState<RoleMappings | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // 언어 전환 effect의 첫 실행(마운트 또는 새 tree 적재 직후) 스킵 가드. treeId effect에서 재설정한다.
  const skipFirstLangEffect = useRef(true);

  // treeId 변경 시에만 1회 실행해 tree/cardDefs/roleMappings를 적재하고 초기 세션을 해소한다.
  // initSession은 lang에 의존하지만 lang 변경 시 이 effect를 재호출하지 않는다 — 언어 전환 시
  // 카드 재해소는 아래 별도 lang effect(reresolveCardsForLang)가 담당한다(value 보존).
  // biome-ignore lint/correctness/useExhaustiveDependencies: 위 의도대로 treeId만 의존(lang 포함 나머지는 의도적 omit)
  useEffect(() => {
    // 새 tree로 초기 세션을 해소하므로 그 lang은 이미 반영됨 → 새 tree의 첫 lang effect는 스킵한다.
    // (treeId in-place 재사용 시 stale skip 플래그로 인한 잠재 버그 방어 — I1)
    skipFirstLangEffect.current = true;
    fetch(`/api/trees/${treeId}`)
      .then((r) => r.json())
      .then(
        async ({ tree, cardDefs: defs, roleMappings: rm }: { tree: ResolvedTree; cardDefs: Record<string, CardDefinition>; roleMappings?: RoleMappings }) => {
          setTreeConfig(tree);
          setCardDefs(defs);
          if (rm) setRoleMappings(rm);
          const existingScan = useCardStore.getState().scanResult;
          const scanMatchesPath = existingScan?.path === projectPath;
          initSession(tree, defs, scanMatchesPath ? existingScan : null, undefined, rm ?? null);
          if (projectPath && !scanMatchesPath) await scan(projectPath, { silent: true });
        }
      );
  }, [treeId]);

  // 언어 전환 시 카드 정의(label/template/options/hint)를 새 lang으로 재해소하되 사용자 입력(value)은
  // 보존한다(reresolveCardsForLang → store.reresolveCards). 마운트/새 tree 적재 직후 lang은 이미
  // 초기 세션에 반영돼 있으므로 첫 실행(또는 세션 미적재 상태)은 건너뛴다.
  // biome-ignore lint/correctness/useExhaustiveDependencies: lang 변경에만 반응. treeConfig/cardDefs/roleMappings는 트리거가 아닌 최신값 참조용으로 ref가 아닌 deps에 포함하면 mount 직후 중복 재해소가 발생함
  useEffect(() => {
    if (skipFirstLangEffect.current) {
      skipFirstLangEffect.current = false;
      return;
    }
    // 세션이 아직 없거나(카드 0개) 정의 미적재면 재해소 불가 — 마운트 effect가 처리.
    if (!treeConfig || !cardDefs || useCardStore.getState().cards.length === 0) return;
    reresolveCardsForLang(treeConfig, cardDefs, roleMappings, lang);
  }, [lang]);

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
              <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-foreground">{t('web.workspacePage.pageTitle')}</h1>
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
