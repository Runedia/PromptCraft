import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { ClipboardCopy, Save, History, Undo2, Redo2 } from 'lucide-react';
import { useCardStore, useTemporalStore } from '../../store/cardStore.js';
import { useKeyboard } from '../../hooks/useKeyboard.js';

interface PromptPreviewProps {
  onSave?: () => void;
  onHistory?: () => void;
}

export function PromptPreview({ onSave, onHistory }: PromptPreviewProps) {
  const { prompt, preview, tokenEstimate } = useCardStore();
  const { undo, redo } = useTemporalStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [prompt]);

  useKeyboard({ onCopy: handleCopy, onSave });

  return (
    <div className="flex flex-col h-full bg-bg-secondary overflow-hidden">
      {/* 헤더 */}
      <div className="flex-none flex items-center justify-between px-5 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text-primary">미리보기</span>
          <div className="flex gap-0.5">
            <button
              type="button"
              className="inline-flex items-center justify-center text-text-muted w-7 h-7 rounded-md transition-colors hover:text-text-primary hover:bg-bg-tertiary"
              onClick={undo}
              title="실행 취소 (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center text-text-muted w-7 h-7 rounded-md transition-colors hover:text-text-primary hover:bg-bg-tertiary"
              onClick={redo}
              title="다시 실행 (Ctrl+Shift+Z)"
            >
              <Redo2 size={14} />
            </button>
          </div>
        </div>
        <span className="font-code text-xs text-text-muted bg-bg-primary px-2 py-1 rounded-md border border-border-subtle">
          ~{tokenEstimate.toLocaleString()} tok
        </span>
      </div>

      {/* 미리보기 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-text-primary prose-preview">
        {preview ? (
          <ReactMarkdown>{preview}</ReactMarkdown>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-text-muted text-sm">카드를 채우면 프롬프트가 표시됩니다.</p>
          </div>
        )}
      </div>

      {/* 액션 바 */}
      <div className="flex-none flex gap-2 px-5 py-3 border-t border-border-subtle">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-4 py-2 transition-all bg-accent-primary text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleCopy}
          disabled={!prompt}
          title="클립보드 복사 (Ctrl+Enter)"
        >
          <ClipboardCopy size={15} />
          {copied ? '복사됨!' : '복사'}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-2 transition-all border border-border bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          onClick={onSave}
          title="템플릿 저장 (Ctrl+S)"
        >
          <Save size={15} />
          저장
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-2 transition-all border border-border bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary ml-auto"
          onClick={onHistory}
        >
          <History size={15} />
          히스토리
        </button>
      </div>
    </div>
  );
}
