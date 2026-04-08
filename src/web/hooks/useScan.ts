import { useState } from 'react';
import { useCardStore } from '../store/cardStore.js';
import type { ScanResult } from '../../core/types.js';

export function useScan() {
  const [error, setError] = useState<string | null>(null);
  const { setIsScanLoading, setScanResult, cards, updateCardValue: storeUpdate } = useCardStore();
  const isScanLoading = useCardStore((s) => s.isScanLoading);

  const scan = async (scanPath: string): Promise<ScanResult | null> => {
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
      const result: ScanResult = await res.json();
      setScanResult(result);

      // stack-environment 카드에 스캔 결과 자동 채움
      const stackCard = cards.find((c) => c.id === 'stack-environment');
      if (stackCard && !stackCard.value) {
        const parts: string[] = [];
        if (result.languages.length > 0) parts.push(`언어: ${result.languages.map((l) => l.name).join(', ')}`);
        if (result.frameworks.length > 0) parts.push(`프레임워크: ${result.frameworks.map((f) => f.name).join(', ')}`);
        if (result.packageManager) parts.push(`패키지 매니저: ${result.packageManager}`);
        storeUpdate('stack-environment', parts.join('\n'));
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '스캔 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsScanLoading(false);
    }
  };

  return { scan, isScanLoading, error };
}
