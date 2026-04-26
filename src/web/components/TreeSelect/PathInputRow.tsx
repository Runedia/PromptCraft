import { Folder, FolderOpen, X } from 'lucide-react';
import { forwardRef } from 'react';
import { Button } from '@/components/ui/button.js';
import { cn } from '@/lib/utils.js';
import { UI_IDS } from '@/ui-ids.js';

interface PathInputRowProps {
  value: string;
  onChange: (v: string) => void;
  onBrowse: () => void;
  onClear: () => void;
}

export const PathInputRow = forwardRef<HTMLInputElement, PathInputRowProps>(({ value, onChange, onBrowse, onClear }, ref) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex flex-1 items-center gap-2 h-10 rounded-md border border-input bg-card px-3',
          'focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-shadow'
        )}
      >
        <Folder size={15} className="text-muted-foreground shrink-0" aria-hidden />
        <input
          ref={ref}
          type="text"
          data-ui-id={UI_IDS.TREE_PATH_INPUT}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="예: C:/my-project"
          spellCheck={false}
          className="flex-1 bg-transparent border-0 outline-none font-code text-sm text-foreground placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            data-ui-id={UI_IDS.TREE_PATH_CLEAR_BTN}
            onClick={onClear}
            tabIndex={-1}
            aria-label="경로 지우기"
            className="text-muted-foreground hover:text-foreground p-0.5 rounded"
          >
            <X size={13} />
          </button>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" data-ui-id={UI_IDS.TREE_PATH_BROWSE_BTN} onClick={onBrowse} className="h-10">
        <FolderOpen size={14} />
        폴더 찾기
      </Button>
    </div>
  );
});

PathInputRow.displayName = 'PathInputRow';
