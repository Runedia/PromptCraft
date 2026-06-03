import { Check, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button.js';
import { useT } from '@/i18n/useT.js';
import { cn } from '@/lib/utils';
import { useCardStore } from '@/store/cardStore.js';
import { UI_IDS } from '@/ui-ids.js';

interface CardPoolProps {
  variant?: 'inline' | 'sidebar';
}

/**
 * @ui-ids WORK_CARD_POOL, WORK_CARD_POOL_ITEM_BTN
 */
export function CardPool({ variant = 'inline' }: CardPoolProps) {
  const t = useT();
  // 전체 store 구독 대신 cards + 액션만 원자 셀렉터로 구독하고, 파생 목록은 cards 변경 시에만 재계산한다.
  const cards = useCardStore((s) => s.cards);
  const activateCard = useCardStore((s) => s.activateCard);
  const deactivateCard = useCardStore((s) => s.deactivateCard);
  const inactive = useMemo(() => cards.filter((c) => !c.active), [cards]);
  const active = useMemo(() => cards.filter((c) => c.active).sort((a, b) => a.order - b.order), [cards]);

  if (variant === 'sidebar') {
    const all = [...active, ...inactive].sort((a, b) => a.label.localeCompare(b.label, 'ko'));
    if (all.length === 0) return null;
    return (
      <div className="flex flex-col gap-2" data-ui-id={UI_IDS.WORK_CARD_POOL}>
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-code uppercase tracking-[0.07em] text-muted-foreground">Card pool</span>
          <span className="text-[10.5px] font-code text-muted-foreground/70">{inactive.length}</span>
        </div>
        <div className="flex flex-col gap-1">
          {all.map((card) => {
            const inUse = card.active;
            return (
              <button
                key={card.id}
                type="button"
                disabled={inUse && card.required}
                data-ui-id={UI_IDS.WORK_CARD_POOL_ITEM_BTN}
                data-ui-card-id={card.id}
                onClick={() => (inUse ? deactivateCard(card.id) : activateCard(card.id))}
                title={card.hint}
                className={cn(
                  'flex items-center justify-between rounded-sm px-2.5 py-1.5 text-xs border border-dashed transition-colors',
                  inUse
                    ? 'bg-muted/50 text-muted-foreground border-border'
                    : 'bg-transparent text-secondary-foreground border-border/70 hover:bg-accent/40 hover:border-primary/50 cursor-pointer'
                )}
              >
                <span className="truncate">{card.label}</span>
                {inUse ? <Check size={11} className="shrink-0" /> : <Plus size={11} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (inactive.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 pt-4 border-t border-border/50" data-ui-id={UI_IDS.WORK_CARD_POOL}>
      <span className="text-sm text-muted-foreground font-medium">{t('web.cardPool.addCard')}</span>
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
