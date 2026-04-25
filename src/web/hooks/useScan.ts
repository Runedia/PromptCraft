import type { DomainOverlay } from '@core/builder/domain-overlay.js';
import type { ScanResult } from '@core/types.js';
import { useState } from 'react';
import { useCardStore } from '@/store/cardStore.js';

export interface ScanApiResponse extends ScanResult {
  elapsedMs: number;
  domainOverlay: DomainOverlay | null;
}

export function useScan() {
  const [error, setError] = useState<string | null>(null);
  const [domainOverlay, setDomainOverlay] = useState<DomainOverlay | null>(null);
  const { setIsScanLoading, setScanResult, cards, updateCardValue: storeUpdate } = useCardStore();
  const isScanLoading = useCardStore((s) => s.isScanLoading);

  const scan = async (scanPath: string): Promise<ScanApiResponse | null> => {
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
        throw new Error(msg ?? '스캔 실패');
      }
      const response: ScanApiResponse = await res.json();
      setScanResult(response);
      setDomainOverlay(response.domainOverlay ?? null);

      // stack-environment 카드에 스캔 결과 자동 채움
      const stackCard = cards.find((c) => c.id === 'stack-environment');
      if (stackCard && !stackCard.value) {
        const parts: string[] = [];
        if (response.languages.length > 0) parts.push(`언어: ${response.languages.map((l) => l.name).join(', ')}`);
        if (response.frameworks.length > 0) parts.push(`프레임워크: ${response.frameworks.map((f) => f.name).join(', ')}`);
        if (response.packageManager) parts.push(`패키지 매니저: ${response.packageManager}`);
        storeUpdate('stack-environment', parts.join('\n'));
      }
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : '스캔 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsScanLoading(false);
    }
  };

  return { scan, isScanLoading, error, domainOverlay };
}
