import { ArrowLeft, Check, ChevronRight, FolderOpen, HardDrive } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

interface BrowseResult {
  current: string;
  parent: string | null;
  dirs: string[];
  isRoot: boolean;
}

interface FolderBrowserProps {
  initialPath?: string;
  onSelect: (selectedPath: string) => void;
  onClose: () => void;
}

function basename(p: string): string {
  return (
    p
      .replace(/[/\\]+$/, '')
      .split(/[/\\]/)
      .pop() ?? p
  );
}

export function FolderBrowser({ initialPath, onSelect, onClose }: FolderBrowserProps) {
  const [data, setData] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useCallback(async (targetPath?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = targetPath ? `/api/browse?path=${encodeURIComponent(targetPath)}` : '/api/browse';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '탐색 실패');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    navigate(initialPath || undefined);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop click-away pattern
    <div role="presentation" className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200]" onClick={onClose} onKeyDown={handleKeyDown}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-bg-secondary border border-border rounded-2xl w-[520px] max-h-[70vh] flex flex-col overflow-hidden shadow-[var(--shadow-card-hover)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle bg-bg-tertiary">
          <button
            type="button"
            className="inline-flex items-center justify-center text-text-muted p-1 rounded-md transition-colors hover:text-text-primary hover:bg-bg-hover"
            onClick={() => (data?.parent ? navigate(data.parent) : navigate())}
            disabled={loading}
            title="상위 폴더"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="flex-1 text-xs font-code text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap">
            {data?.isRoot ? (
              <span className="flex items-center gap-2 font-ui text-sm font-medium text-text-primary">
                <HardDrive size={14} /> 드라이브 선택
              </span>
            ) : (
              (data?.current ?? '로딩 중...')
            )}
          </span>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading && <div className="py-4 text-center text-sm text-text-muted">로딩 중...</div>}
          {error && <div className="py-4 text-center text-sm text-accent-danger">{error}</div>}
          {!loading && !error && data?.dirs.length === 0 && <div className="py-4 text-center text-sm text-text-muted">하위 폴더가 없습니다.</div>}
          {!loading &&
            !error &&
            data?.dirs.map((dir) => (
              <button
                key={dir}
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left bg-transparent text-text-primary transition-colors hover:bg-bg-hover"
                onClick={() => navigate(dir)}
              >
                <FolderOpen size={15} className="text-accent-primary shrink-0" />
                <span className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap">{data.isRoot ? dir : basename(dir)}</span>
                <ChevronRight size={14} className="text-text-muted shrink-0" />
              </button>
            ))}
        </div>

        {/* 푸터 */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border-subtle bg-bg-tertiary">
          <span className="flex-1 text-xs font-code text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap">
            {data?.current && !data.isRoot ? data.current : '—'}
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-1 transition-all bg-transparent text-text-secondary hover:text-text-primary"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-1 transition-all bg-accent-success text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => data?.current && !data.isRoot && onSelect(data.current)}
              disabled={!data?.current || data.isRoot}
            >
              <Check size={14} />이 폴더 선택
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
