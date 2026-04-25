import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button.js';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

/**
 * @ui-ids WORK_CARD_POOL, WORK_CARD_POOL_ITEM_BTN
 */
export function CardPool() {
  const { activateCard, inactiveCards } = useCardStore();
  const inactive = inactiveCards();

  if (inactive.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 pt-4 border-t border-border/50" data-ui-id={UI_IDS.WORK_CARD_POOL}>
      <span className="text-sm text-muted-foreground font-medium">카드 추가</span>
      <div className="flex flex-wrap gap-2">
        {inactive.map((card) => (
          <Button
            key={card.id}
            type="button"
            variant="outline"
            size="sm"
            data-ui-id={UI_IDS.WORK_CARD_POOL_ITEM_BTN}
            data-ui-card-id={card.id}
            className="border-dashed hover:border-solid hover:border-primary"
            onClick={() => activateCard(card.id)}
            title={card.hint}
          >
            <Plus data-icon="inline-start" size={14} />
            {card.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
