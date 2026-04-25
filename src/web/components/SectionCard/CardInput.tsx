import type { InputType, SelectOption } from '@core/types/card.js';
import { MentionInput } from '@/components/inputs/MentionInput.js';
import { MultilineInput } from '@/components/inputs/MultilineInput.js';
import { SelectOrTextInput } from '@/components/inputs/SelectOrTextInput.js';
import { TextInput } from '@/components/inputs/TextInput.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js';

interface CardInputProps {
  type: InputType;
  value: string;
  hint?: string;
  examples?: string[];
  options?: SelectOption[];
  onChange: (value: string) => void;
  scanRoot?: string;
}

export function CardInput({ type, value, hint, examples, options, onChange, scanRoot }: CardInputProps) {
  switch (type) {
    case 'text':
      return <TextInput value={value} hint={hint} examples={examples} onChange={onChange} />;
    case 'multiline':
      return <MultilineInput value={value} hint={hint} onChange={onChange} />;
    case 'select':
      return (
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="선택하세요..." />
          </SelectTrigger>
          <SelectContent>
            {options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'select-or-text':
      return <SelectOrTextInput value={value} options={options} hint={hint} onChange={onChange} />;
    case 'multiline-mention':
      return <MentionInput value={value} hint={hint} onChange={onChange} scanRoot={scanRoot} />;
  }
}
