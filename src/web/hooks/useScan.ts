import type { DomainOverlay } from '@core/builder/domain-overlay.js';
import type { ScanResult } from '@core/types.js';
import { useState } from 'react';
import { toast } from 'sonner';
import { useT } from '@/i18n/useT.js';
import { useCardStore } from '@/store/cardStore.js';

export interface ScanApiResponse extends ScanResult {
  elapsedMs: number;
  domainOverlay: DomainOverlay | null;
}

interface ScanOptions {
  silent?: boolean;
}

type Translator = (key: string, vars?: Record<string, string | number>) => string;

function summarizeScan(result: ScanApiResponse, t: Translator): string {
  const parts: string[] = [];
  const domain = result.domainContext?.primary;
  if (domain) parts.push(domain);
  if (result.languages.length > 0) parts.push(t('web.useScan.langs', { n: result.languages.length }));
  if (result.frameworks.length > 0) parts.push(t('web.useScan.frameworks', { n: result.frameworks.length }));
  return parts.length > 0 ? parts.join(' · ') : t('web.useScan.noDetected');
}

export function useScan() {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [domainOverlay, setDomainOverlay] = useState<DomainOverlay | null>(null);
  const { setIsScanLoading, setScanResult, cards, updateCardValue: storeUpdate } = useCardStore();
  const isScanLoading = useCardStore((s) => s.isScanLoading);

  const scan = async (scanPath: string, opts: ScanOptions = {}): Promise<ScanApiResponse | null> => {
    setError(null);
    setIsScanLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: scanPath }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? t('web.useScan.scanFailed'));
      }
      const response: ScanApiResponse = await res.json();
      setScanResult(response);
      setDomainOverlay(response.domainOverlay ?? null);

      // stack-environment 카드에 스캔 결과 자동 채움
      const stackCard = cards.find((c) => c.id === 'stack-environment');
      if (stackCard && !stackCard.value) {
        const parts: string[] = [];
        if (response.languages.length > 0) parts.push(t('web.useScan.stackLangs', { names: response.languages.map((l) => l.name).join(', ') }));
        if (response.frameworks.length > 0) parts.push(t('web.useScan.stackFrameworks', { names: response.frameworks.map((f) => f.name).join(', ') }));
        if (response.packageManager) parts.push(t('web.useScan.stackPkg', { name: response.packageManager }));
        storeUpdate('stack-environment', parts.join('\n'));
      }

      if (!opts.silent) toast.success(t('web.useScan.scanDone'), { description: summarizeScan(response, t) });
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : t('web.useScan.scanError');
      setError(message);
      if (!opts.silent) toast.error(t('web.useScan.scanFailed'), { description: message });
      return null;
    } finally {
      setIsScanLoading(false);
    }
  };

  return { scan, isScanLoading, error, domainOverlay };
}
