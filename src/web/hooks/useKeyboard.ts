import { useEffect } from 'react';
import { useTemporalStore } from '@/store/cardStore.js';

interface KeyboardOptions {
  onCopy?: () => void;
  onRunDefault?: () => void;
}

export function useKeyboard({ onCopy, onRunDefault }: KeyboardOptions = {}) {
  const { undo, redo } = useTemporalStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) onRunDefault?.();
        else onCopy?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, onCopy, onRunDefault]);
}
