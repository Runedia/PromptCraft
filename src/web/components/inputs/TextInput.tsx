import { Input } from '@/components/ui/input.js';
import { useT } from '@/i18n/useT.js';

interface TextInputProps {
  value: string;
  hint?: string;
  examples?: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextInput({ value, hint, examples, onChange, placeholder }: TextInputProps) {
  const t = useT();

  return (
    <div>
      <Input value={value} placeholder={placeholder ?? hint} onChange={(e) => onChange(e.target.value)} />
      {examples && examples.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {examples.slice(0, 2).map((ex) => (
            <button
              key={ex}
              type="button"
              className="text-xs text-muted-foreground border border-border/50 rounded-md px-2 py-1 bg-transparent transition-all text-left max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap hover:border-primary hover:text-foreground"
              onClick={() => onChange(ex)}
              title={t('web.textInput.exampleTitle')}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
