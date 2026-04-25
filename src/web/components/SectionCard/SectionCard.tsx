import type { SectionCard as SectionCardType } from '@core/types/card.js';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge.js';
import { Button } from '@/components/ui/button.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js';
import { cn } from '@/lib/utils';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';
import { CardInput } from './CardInput.js';

interface SectionCardProps {
  card: SectionCardType;
  scanRoot?: string;
}

/**
 * @ui-ids WORK_SECTION_CARD, WORK_SECTION_CARD_DRAG_BTN, WORK_SECTION_CARD_REMOVE_BTN
 */
export function SectionCard({ card, scanRoot }: SectionCardProps) {
  const { updateCardValue, deactivateCard } = useCardStore();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 100 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-ui-id={UI_IDS.WORK_SECTION_CARD}
      data-ui-card-id={card.id}
      className={cn(
        'border rounded-xl p-5 transition-[border-color,box-shadow] duration-150',
        'hover:border-border',
        isDragging ? 'bg-accent shadow-[var(--shadow-drag)] border-primary ring-2 ring-primary/30' : 'bg-card border-border/50 shadow-[var(--shadow-card)]'
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          data-ui-id={UI_IDS.WORK_SECTION_CARD_DRAG_BTN}
          className="text-muted-foreground p-1 rounded-md flex items-center transition-colors hover:text-secondary-foreground cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="드래그로 순서 변경"
        >
          <GripVertical size={16} />
        </button>
        <span className="text-lg font-semibold text-foreground flex-1">{card.label}</span>
        {card.required && (
          <Badge variant="secondary" className="gap-1">
            <Lock size={12} />
            필수
          </Badge>
        )}
        {!card.required && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                data-ui-id={UI_IDS.WORK_SECTION_CARD_REMOVE_BTN}
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => deactivateCard(card.id)}
                aria-label="카드 제거"
              >
                <X size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>제거</TooltipContent>
          </Tooltip>
        )}
      </div>
      <CardInput
        type={card.inputType}
        value={card.value}
        hint={card.hint}
        examples={card.examples}
        options={card.options}
        onChange={(value) => updateCardValue(card.id, value)}
        scanRoot={scanRoot}
      />
    </div>
  );
}
