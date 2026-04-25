import { ArrowLeft, Check, ChevronRight, FolderOpen, HardDrive } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.js';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet.js';

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

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[520px] max-w-full p-0 flex flex-col">
        <SheetTitle className="sr-only">폴더 탐색</SheetTitle>
        <SheetDescription className="sr-only">폴더를 탐색하고 프로젝트 경로를 선택합니다</SheetDescription>

        {/* 헤더 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => (data?.parent ? navigate(data.parent) : navigate())}
            disabled={loading}
            title="상위 폴더"
          >
            <ArrowLeft size={16} />
          </Button>
          <span className="flex-1 text-xs font-code text-secondary-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {data?.isRoot ? (
              <span className="flex items-center gap-2 font-ui text-sm font-medium text-foreground">
                <HardDrive size={14} /> 드라이브 선택
              </span>
            ) : (
              (data?.current ?? '로딩 중...')
            )}
          </span>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading && <div className="py-4 text-center text-sm text-muted-foreground">로딩 중...</div>}
          {error && <div className="py-4 text-center text-sm text-destructive">{error}</div>}
          {!loading && !error && data?.dirs.length === 0 && <div className="py-4 text-center text-sm text-muted-foreground">하위 폴더가 없습니다.</div>}
          {!loading &&
            !error &&
            data?.dirs.map((dir) => (
              <Button
                key={dir}
                type="button"
                variant="ghost"
                className="flex items-center gap-2 w-full justify-start px-3 py-2 h-auto"
                onClick={() => navigate(dir)}
              >
                <FolderOpen size={15} className="text-primary shrink-0" />
                <span className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap">{data.isRoot ? dir : basename(dir)}</span>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
              </Button>
            ))}
        </div>

        {/* 푸터 */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border/50 bg-muted">
          <span className="flex-1 text-xs font-code text-secondary-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {data?.current && !data.isRoot ? data.current : '—'}
          </span>
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => data?.current && !data.isRoot && onSelect(data.current)}
              disabled={!data?.current || data.isRoot}
            >
              <Check data-icon="inline-start" size={14} />이 폴더 선택
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
