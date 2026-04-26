import type { TreeConfig } from '@core/types/card.js';
import { Check } from 'lucide-react';
import { getTreeCardStyle } from '@/lib/treeCardStyles.js';
import { cn } from '@/lib/utils.js';
import { UI_IDS } from '@/ui-ids.js';

type TreeMeta = Pick<TreeConfig, 'id' | 'label' | 'description'> & { cardCount?: number };

interface TreeGridProps {
  trees: TreeMeta[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function TreeGrid({ trees, selectedId, onSelect, disabled = false }: TreeGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5" data-ui-id={UI_IDS.TREE_CARD_GRID}>
      {trees.map((tree) => {
        const style = getTreeCardStyle(tree.id);
        const isSelected = tree.id === selectedId;
        return (
          <button
            key={tree.id}
            type="button"
            data-ui-id={UI_IDS.TREE_CARD}
            data-ui-tree-id={tree.id}
            disabled={disabled}
            onClick={() => onSelect(tree.id)}
            className={cn(
              'group relative flex flex-col items-start gap-2 min-h-[142px] p-3.5 rounded-md border text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              isSelected ? 'border-foreground bg-muted ring-[3px] ring-muted' : 'border-border bg-card hover:bg-muted/40 hover:border-border'
            )}
          >
            {isSelected && (
              <span className="absolute top-2.5 right-2.5 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check size={10} strokeWidth={2.5} />
              </span>
            )}
            <div
              className={cn(
                'flex items-center justify-center size-7 rounded-md transition-colors',
                isSelected ? 'bg-foreground text-background' : `${style.iconBg} ${style.iconColor}`
              )}
            >
              {style.icon(14)}
            </div>
            <span className="text-[13px] font-semibold text-foreground leading-tight">{tree.label}</span>
            <span className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{tree.description}</span>
            {tree.cardCount !== undefined && (
              <span className="mt-auto text-[10px] font-code uppercase tracking-[0.06em] text-muted-foreground/80">{tree.cardCount} cards</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
