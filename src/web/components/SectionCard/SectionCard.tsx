import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionCard as SectionCardType } from '../../../core/types/card.js';
import { useCardStore } from '../../store/cardStore.js';
import { CardInput } from './CardInput.js';

interface SectionCardProps {
  card: SectionCardType;
  scanRoot?: string;
}

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
      className={cn(
        'border rounded-xl p-5 transition-[border-color,box-shadow] duration-150',
        'hover:border-border',
        isDragging ? 'bg-card-drag shadow-[var(--shadow-drag)] border-accent-primary' : 'bg-card-active border-border-subtle shadow-[var(--shadow-card)]'
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          className="text-text-muted p-1 rounded-md flex items-center transition-colors hover:text-text-secondary cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="드래그로 순서 변경"
        >
          <GripVertical size={16} />
        </button>
        <span className="text-lg font-semibold text-text-primary flex-1">{card.label}</span>
        {card.required && (
          <span className="inline-flex items-center px-2 py-1 bg-[rgba(59,130,246,0.12)] rounded-md text-accent-primary text-xs" title="필수 카드">
            <Lock size={12} />
          </span>
        )}
        {!card.required && (
          <button
            type="button"
            className="text-text-muted p-1 rounded-md flex items-center transition-colors hover:text-accent-danger hover:bg-[rgba(239,68,68,0.1)]"
            onClick={() => deactivateCard(card.id)}
            aria-label="카드 제거"
          >
            <X size={16} />
          </button>
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
