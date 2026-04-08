import { Plus } from 'lucide-react';
import { useCardStore } from '../../store/cardStore.js';

export function CardPool() {
  const { activateCard, inactiveCards } = useCardStore();
  const inactive = inactiveCards();

  if (inactive.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 pt-4 border-t border-border-subtle">
      <span className="text-sm text-text-muted font-medium">카드 추가</span>
      <div className="flex flex-wrap gap-2">
        {inactive.map((card) => (
          <button
            key={card.id}
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary border border-dashed border-border rounded-lg px-3 py-2 bg-transparent transition-all hover:border-solid hover:border-accent-primary hover:text-text-primary hover:bg-bg-tertiary"
            onClick={() => activateCard(card.id)}
            title={card.hint}
          >
            <Plus size={14} />
            {card.label}
          </button>
        ))}
      </div>
    </div>
  );
}
