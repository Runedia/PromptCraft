import type { TreeConfig } from '@core/types/card.js';
import type { ScanResult } from '@core/types.js';
import { ChevronLeft, Scan, Sparkles } from 'lucide-react';
import { type RefObject, useState } from 'react';
import { ActionBar, type ActionBarHandle } from '@/components/ActionBar/ActionBar.js';
import { ThemeToggle } from '@/components/ThemeToggle.js';
import { Badge } from '@/components/ui/badge.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js';
import { getTreeCardStyle } from '@/lib/treeCardStyles.js';
import { UI_IDS } from '@/ui-ids.js';

interface TopBarProps {
  treeConfig: TreeConfig | null;
  projectPath: string;
  scanResult: ScanResult | null;
  isScanLoading: boolean;
  onBack: () => void;
  onRescan: (path: string) => void;
  onSave: () => void;
  actionBarRef: RefObject<ActionBarHandle | null>;
}

/**
 * @ui-ids WORK_TOPBAR, WORK_TOPBAR_BREADCRUMB, WORK_TOPBAR_DOMAIN, WORK_TOPBAR_RESCAN, WORK_LEFT_BACK_BTN
 */
export function TopBar({ treeConfig, projectPath, scanResult, isScanLoading, onBack, onRescan, onSave, actionBarRef }: TopBarProps) {
  const treeStyle = treeConfig ? getTreeCardStyle(treeConfig.id) : null;
  const [scanInput, setScanInput] = useState(projectPath);
  const [scanOpen, setScanOpen] = useState(false);

  const handleRescan = () => {
    if (scanInput.trim()) {
      onRescan(scanInput.trim());
      setScanOpen(false);
    }
  };

  return (
    <header data-ui-id={UI_IDS.WORK_TOPBAR} className="h-11 px-4 border-b border-border flex items-center gap-3 shrink-0 bg-background">
      {/* 좌측: 뒤로 + 로고 + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-ui-id={UI_IDS.WORK_LEFT_BACK_BTN}
              onClick={onBack}
              className="size-7"
              aria-label="진입 화면으로"
            >
              <ChevronLeft size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>진입 화면으로</TooltipContent>
        </Tooltip>

        <div className="size-[18px] rounded-[4px] bg-foreground text-background flex items-center justify-center shrink-0">
          <Sparkles size={11} />
        </div>
        <span className="text-[13px] font-semibold shrink-0">PromptCraft</span>

        {treeConfig && treeStyle && (
          <>
            <span className="text-muted-foreground/40 shrink-0">·</span>
            <div data-ui-id={UI_IDS.WORK_TOPBAR_BREADCRUMB} className="flex items-center gap-1.5 min-w-0">
              <span className={`flex items-center justify-center size-5 rounded ${treeStyle.iconBg} ${treeStyle.iconColor} shrink-0`}>
                {treeStyle.icon(11)}
              </span>
              <span className="text-xs font-medium shrink-0">{treeConfig.label}</span>
              {projectPath && (
                <span className="font-code text-[11px] text-muted-foreground truncate max-w-[280px]" title={projectPath}>
                  {projectPath}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* 우측: domain badge + rescan + ActionBar + ThemeToggle */}
      <div className="flex items-center gap-2 shrink-0">
        {scanResult?.domainContext?.primary && (
          <Badge variant="outline" data-ui-id={UI_IDS.WORK_TOPBAR_DOMAIN} className="text-[10.5px] uppercase tracking-wider font-code">
            {scanResult.domainContext.primary}
          </Badge>
        )}

        <Popover open={scanOpen} onOpenChange={setScanOpen}>
          <PopoverTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-ui-id={UI_IDS.WORK_TOPBAR_RESCAN}
                  className="size-8"
                  onClick={() => setScanInput(projectPath)}
                  aria-label="재스캔"
                >
                  <Scan size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>경로 재스캔</TooltipContent>
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[360px] p-3 space-y-2">
            <span className="text-[10.5px] font-code uppercase tracking-[0.07em] text-muted-foreground">스캔 경로</span>
            <Input
              data-ui-id={UI_IDS.WORK_SCAN_INPUT}
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRescan()}
              className="font-code text-sm"
              placeholder="C:/my-project"
              spellCheck={false}
            />
            <div className="flex justify-end">
              <Button type="button" size="sm" data-ui-id={UI_IDS.WORK_SCAN_EXECUTE_BTN} onClick={handleRescan} disabled={isScanLoading || !scanInput.trim()}>
                {isScanLoading ? '스캔 중...' : '실행'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <ActionBar ref={actionBarRef} onSave={onSave} />

        <ThemeToggle />
      </div>
    </header>
  );
}
