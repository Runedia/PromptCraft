import type { TreeConfig } from '@core/types/card.js';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FolderBrowser } from '@/components/FolderBrowser/FolderBrowser.js';
import { ScanBanner, type ScanStatus } from '@/components/ScanBanner/ScanBanner.js';
import { ThemeToggle } from '@/components/ThemeToggle.js';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';
import { CTARow } from './CTARow.js';
import { PathInputRow } from './PathInputRow.js';
import { SuggestedRoles } from './SuggestedRoles.js';
import { TreeGrid } from './TreeGrid.js';

type TreeMeta = Pick<TreeConfig, 'id' | 'label' | 'description'> & { cardCount?: number };

interface TreeSelectProps {
  onSelect: (treeId: string, projectPath: string) => void;
}

const SESSION_PATH_KEY = 'promptcraft:projectPath';

/**
 * @ui-ids TREE_HERO, TREE_BRAND_BAR, TREE_PATH_INPUT, TREE_PATH_CLEAR_BTN,
 *   TREE_PATH_BROWSE_BTN, TREE_SCAN_BANNER, TREE_CARD_GRID, TREE_CARD,
 *   TREE_PATH_ROLE_CHIPS, TREE_CTA_CANCEL, TREE_CTA_CONTINUE
 */
export function TreeSelect({ onSelect }: TreeSelectProps) {
  const setScanResult = useCardStore((s) => s.setScanResult);
  const scanResult = useCardStore((s) => s.scanResult);

  const [trees, setTrees] = useState<TreeMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectPath, setProjectPath] = useState(() => sessionStorage.getItem(SESSION_PATH_KEY) ?? '');
  const [showBrowser, setShowBrowser] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [host, setHost] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHost(window.location.host);
    fetch('/api/trees')
      .then((r) => r.json())
      .then((data: TreeMeta[]) => setTrees(data))
      .finally(() => {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      });
  }, []);

  useEffect(() => {
    setSuggestedRoles([]);
    if (projectPath.trim().length < 3) {
      setScanStatus('idle');
      return;
    }
    setScanStatus('scanning');
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: projectPath }),
          signal: controller.signal,
        });
        if (!res.ok) {
          setScanStatus('idle');
          return;
        }
        const result = await res.json();
        setScanResult(result);
        const roles = (result.roleSuggestions as string[] | undefined) ?? [];
        setSuggestedRoles(roles);
        setScanStatus('scanned');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setScanStatus('idle');
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [projectPath, setScanResult]);

  const handlePathChange = (v: string) => {
    setProjectPath(v);
    sessionStorage.setItem(SESSION_PATH_KEY, v);
  };

  const handleClearPath = () => {
    setProjectPath('');
    sessionStorage.removeItem(SESSION_PATH_KEY);
    inputRef.current?.focus();
  };

  const handleBrowseSelect = (selected: string) => {
    handlePathChange(selected);
    setShowBrowser(false);
    inputRef.current?.focus();
  };

  const canContinue = scanStatus === 'scanned' && !!selectedTreeId && projectPath.trim().length > 0;
  const handleContinue = () => {
    if (canContinue && selectedTreeId) onSelect(selectedTreeId, projectPath.trim());
  };

  const selectedTreeLabel = trees.find((t) => t.id === selectedTreeId)?.label ?? null;
  const domain = scanResult?.domainContext?.primary ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Brand bar 44px */}
      <header data-ui-id={UI_IDS.TREE_BRAND_BAR} className="h-11 px-4 border-b border-border flex items-center gap-2.5 shrink-0">
        <div className="size-[18px] rounded-[4px] bg-foreground text-background flex items-center justify-center">
          <Sparkles size={11} />
        </div>
        <span className="text-[13px] font-semibold">PromptCraft</span>
        <span className="text-[11px] font-code text-muted-foreground">
          v{__APP_VERSION__}
          {host && ` · ${host}`}
        </span>
        <div className="flex-1" />
        <ThemeToggle />
      </header>

      {/* Body */}
      <main className="flex-1 flex flex-col items-center px-14 py-10 overflow-y-auto" data-ui-id={UI_IDS.TREE_HERO}>
        <div className="w-full max-w-[880px] flex flex-col">
          {/* Eyebrow */}
          <span className="text-[11.5px] font-code uppercase tracking-[0.06em] text-muted-foreground mb-2">step 01 · new prompt</span>

          {/* H1 (sans 36px / 600 / -0.8) */}
          <h1 className="text-[36px] leading-[1.1] font-semibold tracking-[-0.025em] text-foreground mb-2">어떤 작업을 도와드릴까요?</h1>

          {/* Description */}
          <p className="text-sm text-secondary-foreground max-w-[580px] mb-8">
            상황 유형을 고르면 그에 맞는 카드 구성과 도메인 적응형 역할 후보가 자동으로 준비됩니다.
          </p>

          {/* Path label + input + scan banner */}
          <div className="flex flex-col gap-2.5 mb-7">
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-semibold text-secondary-foreground">프로젝트 경로</span>
              <span className="text-[10.5px] font-code text-muted-foreground">· 입력 후 800ms 자동 스캔</span>
            </div>
            <PathInputRow ref={inputRef} value={projectPath} onChange={handlePathChange} onBrowse={() => setShowBrowser(true)} onClear={handleClearPath} />
            <ScanBanner status={scanStatus} result={scanResult} />
          </div>

          {/* Tree grid */}
          <div className="flex flex-col gap-2.5 mb-7">
            <span className="text-[11.5px] font-semibold text-secondary-foreground">상황 유형 선택</span>
            <TreeGrid trees={trees} selectedId={selectedTreeId} onSelect={setSelectedTreeId} disabled={scanStatus !== 'scanned'} />
          </div>

          {/* Suggested roles */}
          {scanStatus === 'scanned' && suggestedRoles.length > 0 && (
            <div className="mb-6">
              <SuggestedRoles roles={suggestedRoles} domain={domain} treeLabel={selectedTreeLabel} />
            </div>
          )}

          {/* CTA */}
          <CTARow
            canContinue={canContinue}
            hint={scanStatus !== 'scanned' ? '경로 입력 후 스캔이 완료되면 활성화됩니다.' : !selectedTreeId ? '트리를 선택하세요.' : undefined}
            onCancel={handleClearPath}
            onContinue={handleContinue}
          />
        </div>
      </main>

      {showBrowser && <FolderBrowser initialPath={projectPath || undefined} onSelect={handleBrowseSelect} onClose={() => setShowBrowser(false)} />}
    </div>
  );
}
