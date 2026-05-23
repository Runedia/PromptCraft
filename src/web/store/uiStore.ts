import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PreviewMode = 'raw' | 'rendered';

interface UIStore {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      previewMode: 'raw',
      setPreviewMode: (mode) => set({ previewMode: mode }),
    }),
    {
      name: 'promptcraft-preview-mode',
      partialize: (state) => ({ previewMode: state.previewMode }),
    }
  )
);
