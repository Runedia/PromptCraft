import type { ScanResult } from '@core/types.js';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UI_IDS } from '@/ui-ids.js';

export type ScanStatus = 'idle' | 'scanning' | 'scanned';

interface ScanBannerProps {
  status: ScanStatus;
  result: ScanResult | null;
  className?: string;
}

interface Chip {
  key: string;
  value: string;
  highlight?: boolean;
}

function buildChips(result: ScanResult): Chip[] {
  const chips: Chip[] = [];
  if (result.languages[0]) chips.push({ key: 'lang', value: result.languages[0].name });
  if (result.frameworks[0]) chips.push({ key: 'framework', value: result.frameworks[0].name });
  if (result.domainContext?.primary) chips.push({ key: 'domain', value: result.domainContext.primary, highlight: true });
  if (result.packageManager) chips.push({ key: 'pkg', value: result.packageManager });
  return chips;
}

/**
 * @ui-ids TREE_SCAN_BANNER
 */
export function ScanBanner({ status, result, className }: ScanBannerProps) {
  const fileCount = result?.languages.reduce((sum, l) => sum + l.count, 0);

  return (
    <div
      data-ui-id={UI_IDS.TREE_SCAN_BANNER}
      className={cn('bg-muted/50 border border-border rounded-md px-3.5 py-2.5 text-xs flex items-center gap-3.5 flex-wrap', className)}
    >
      {status === 'idle' && <span className="text-muted-foreground">경로를 입력하면 자동 스캔됩니다.</span>}

      {status === 'scanning' && (
        <>
          <Loader2 size={12} className="animate-spin text-primary shrink-0" />
          <span className="text-secondary-foreground">스캔 중…</span>
          {fileCount !== undefined && fileCount > 0 && (
            <span className="font-code text-[11px] text-muted-foreground">분석: {fileCount.toLocaleString()} files</span>
          )}
        </>
      )}

      {status === 'scanned' && result && (
        <>
          <span className="size-2 rounded-full bg-success shrink-0" aria-hidden />
          <span className="text-foreground font-medium">스캔 완료</span>
          <span className="text-muted-foreground/60">·</span>
          {buildChips(result).map((c) => (
            <span key={c.key} className="font-code text-[11px] text-muted-foreground">
              {c.key}: <span className={c.highlight ? 'text-primary' : 'text-foreground'}>{c.value}</span>
            </span>
          ))}
        </>
      )}
    </div>
  );
}
