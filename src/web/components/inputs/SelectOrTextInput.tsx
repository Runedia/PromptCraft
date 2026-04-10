import { useState } from 'react';
import { Input } from '@/components/ui/input.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js';
import type { SelectOption } from '../../../core/types/card.js';

interface SelectOrTextInputProps {
  value: string;
  options?: SelectOption[];
  hint?: string;
  onChange: (value: string) => void;
}

export function SelectOrTextInput({ value, options, hint, onChange }: SelectOrTextInputProps) {
  const [isCustom, setIsCustom] = useState(!!value && !options?.some((o) => o.value === value));

  const handleValueChange = (val: string) => {
    if (val === '__custom__') {
      setIsCustom(true);
      onChange('');
    } else {
      setIsCustom(false);
      onChange(val);
    }
  };

  if (isCustom) {
    return (
      <div className="flex flex-col gap-2">
        <Input value={value} placeholder={hint} onChange={(e) => onChange(e.target.value)} autoFocus />
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground text-left transition-colors"
          onClick={() => {
            setIsCustom(false);
            onChange('');
          }}
        >
          ← 목록에서 선택
        </button>
      </div>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="선택하세요..." />
      </SelectTrigger>
      <SelectContent>
        {options?.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
        <SelectItem value="__custom__">직접 입력...</SelectItem>
      </SelectContent>
    </Select>
  );
}
