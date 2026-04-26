import type { TreeConfig } from '@core/types/card.js';
import type { ScanResult } from '@core/types.js';
import { getTreeCardStyle } from '@/lib/treeCardStyles.js';
import { UI_IDS } from '@/ui-ids.js';
import { CardPool } from './CardPool.js';

interface CardPoolSidebarProps {
  treeConfig: TreeConfig | null;
  scanResult: ScanResult | null;
}

/**
 * @ui-ids WORK_LEFT_PANEL, WORK_TREE_HEADER, WORK_PROJECT_INFO
 */
export function CardPoolSidebar({ treeConfig, scanResult }: CardPoolSidebarProps) {
  const treeStyle = treeConfig ? getTreeCardStyle(treeConfig.id) : null;
  const totalFiles = scanResult?.languages.reduce((sum, l) => sum + l.count, 0) ?? 0;
  const framework = scanResult?.frameworks[0]?.name;

  return (
    <aside data-ui-id={UI_IDS.WORK_LEFT_PANEL} className="w-60 shrink-0 border-r border-border bg-muted flex flex-col overflow-y-auto">
      {/* 트리 + 프로젝트 정보 */}
      <div className="p-3.5" data-ui-id={UI_IDS.WORK_TREE_HEADER}>
        {treeConfig && treeStyle && (
          <div className="flex items-center gap-2 mb-3">
            <span className={`flex items-center justify-center size-6 rounded-md ${treeStyle.iconBg} ${treeStyle.iconColor} shrink-0`}>
              {treeStyle.icon(13)}
            </span>
            <span className="text-[13px] font-semibold text-foreground truncate">{treeConfig.label}</span>
          </div>
        )}
        {scanResult && (
          <div data-ui-id={UI_IDS.WORK_PROJECT_INFO} className="space-y-1">
            <span className="block text-[10.5px] font-code uppercase tracking-[0.07em] text-muted-foreground">Project</span>
            <span className="block font-code text-[11.5px] text-foreground break-all leading-snug">{scanResult.path}</span>
            <span className="block text-[11px] text-muted-foreground">
              {framework ? `${framework} · ` : ''}
              {totalFiles.toLocaleString()} files
            </span>
          </div>
        )}
      </div>

      {/* 카드 풀 */}
      <div className="border-t border-border p-3.5 flex-1">
        <CardPool variant="sidebar" />
      </div>
    </aside>
  );
}
