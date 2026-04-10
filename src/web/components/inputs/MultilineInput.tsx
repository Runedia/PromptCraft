import { useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea.js';

interface MultilineInputProps {
  value: string;
  hint?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MultilineInput({ value, hint, onChange, placeholder }: MultilineInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: value triggers textarea auto-resize
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value]);

  return <Textarea ref={ref} className="resize-none" value={value} placeholder={placeholder ?? hint} rows={3} onChange={(e) => onChange(e.target.value)} />;
}
