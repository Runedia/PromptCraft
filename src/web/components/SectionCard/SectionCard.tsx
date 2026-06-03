import type { SectionCard as SectionCardType } from '@core/types/card.js';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock, Pin, X } from 'lucide-react';
import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge.js';
import { Button } from '@/components/ui/button.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js';
import { useT } from '@/i18n/useT.js';
import { cn } from '@/lib/utils';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';
import { CardInput } from './CardInput.js';

export const PINNED_CARD_IDS: ReadonlySet<string> = new Set(['role', 'goal']);

interface SectionCardProps {
  card: SectionCardType;
  scanRoot?: string;
  variant?: 'outlined' | 'filled';
}

/**
 * @ui-ids WORK_SECTION_CARD, WORK_SECTION_CARD_DRAG_BTN, WORK_SECTION_CARD_REMOVE_BTN
 */
export const SectionCard = memo(function SectionCard({ card, scanRoot, variant = 'outlined' }: SectionCardProps) {
  const t = useT();
  // 액션은 원자 셀렉터로 구독한다(함수 참조는 store 생성 시 안정 → store 변경에 리렌더되지 않음).
  // memo와 결합해, 값이 바뀐 카드 1개의 SectionCard만 리렌더되고 나머지 카드는 격리된다.
  const updateCardValue = useCardStore((s) => s.updateCardValue);
  const deactivateCard = useCardStore((s) => s.deactivateCard);
  const isPinned = PINNED_CARD_IDS.has(card.id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: isPinned,
  });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.85 : 1,
      zIndex: isDragging ? 100 : undefined,
    }),
    [transform, transition, isDragging]
  );

  const baseClasses = variant === 'filled' ? 'bg-muted/60 border border-transparent' : 'bg-card border border-border/50 shadow-[var(--shadow-card)]';

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-ui-id={UI_IDS.WORK_SECTION_CARD}
      data-ui-card-id={card.id}
      className={cn(
        'rounded-xl p-5 transition-[border-color,box-shadow,background-color] duration-150',
        'focus-within:ring-2 focus-within:ring-ring focus-within:border-ring',
        isDragging ? 'bg-accent shadow-[var(--shadow-drag)] border-primary ring-2 ring-primary/30' : baseClasses
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        {isPinned ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled
                data-ui-id={UI_IDS.WORK_SECTION_CARD_DRAG_BTN}
                className="text-muted-foreground/60 p-1 rounded-md flex items-center cursor-not-allowed"
                aria-label={t('web.sectionCard.pinnedLabel')}
              >
                <Pin size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t('web.sectionCard.pinnedTooltip')}</TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            data-ui-id={UI_IDS.WORK_SECTION_CARD_DRAG_BTN}
            className="text-muted-foreground p-1 rounded-md flex items-center transition-colors hover:text-secondary-foreground cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label={t('web.sectionCard.dragLabel')}
          >
            <GripVertical size={16} />
          </button>
        )}
        <span className="text-lg font-semibold text-foreground flex-1">{card.label}</span>
        {card.required && (
          <Badge variant="secondary" className="gap-1">
            <Lock size={12} />
            {t('web.sectionCard.required')}
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
                aria-label={t('web.sectionCard.removeLabel')}
              >
                <X size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('web.sectionCard.removeTooltip')}</TooltipContent>
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
});
