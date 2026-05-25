import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button.js';
import { useT } from '@/i18n/useT.js';
import { UI_IDS } from '@/ui-ids.js';

interface CTARowProps {
  canContinue: boolean;
  hint?: string;
  onCancel: () => void;
  onContinue: () => void;
}

export function CTARow({ canContinue, hint, onCancel, onContinue }: CTARowProps) {
  const t = useT();

  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      {hint && !canContinue && <span className="text-xs text-muted-foreground mr-auto">{hint}</span>}
      <Button type="button" variant="ghost" data-ui-id={UI_IDS.TREE_CTA_CANCEL} onClick={onCancel}>
        {t('web.ctaRow.cancel')}
      </Button>
      <Button type="button" size="lg" data-ui-id={UI_IDS.TREE_CTA_CONTINUE} disabled={!canContinue} onClick={onContinue}>
        {t('web.ctaRow.continue')}
        <ArrowRight size={14} className="ml-0.5" />
      </Button>
    </div>
  );
}
