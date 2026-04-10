import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface MentionInputProps {
  value: string;
  hint?: string;
  onChange: (value: string) => void;
  scanRoot?: string;
}

interface MentionSuggestion {
  path: string;
  display: string;
  isDir: boolean;
}

export function MentionInput({ value, hint, onChange, scanRoot }: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const ref = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (selectedIdx < 0 || !listRef.current) return;
    const item = listRef.current.children[selectedIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const closeSuggestions = useCallback(() => {
    setSuggestions([]);
    setMentionStart(-1);
    setSelectedIdx(-1);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      onChange(newVal);

      const cursor = e.target.selectionStart;
      const textBefore = newVal.slice(0, cursor);
      const atMatch = textBefore.match(/@([\w.\s/-]*)$/);

      if (atMatch && scanRoot) {
        setMentionStart(cursor - atMatch[0].length);
        clearTimeout(debounceRef.current ?? undefined);
        debounceRef.current = setTimeout(async () => {
          try {
            const res = await fetch(`/api/mention/suggest?root=${encodeURIComponent(scanRoot)}&partial=${encodeURIComponent(atMatch[1])}`);
            if (res.ok) {
              const { suggestions: s } = await res.json();
              setSuggestions(s);
              setSelectedIdx(-1);
            }
          } catch {
            setSuggestions([]);
          }
        }, 150);
      } else {
        closeSuggestions();
      }
    },
    [onChange, scanRoot, closeSuggestions]
  );

  const insertMention = useCallback(
    (filePath: string, isDir: boolean) => {
      if (!ref.current || mentionStart === -1) return;

      const before = value.slice(0, mentionStart);
      const after = value.slice(ref.current.selectionStart);
      onChange(`${before}@${filePath}${after}`);

      if (isDir) {
        // 디렉토리 선택 시 드롭다운 닫지 않고 계속 탐색
        setSuggestions([]);
        setSelectedIdx(-1);
        setTimeout(() => {
          if (ref.current) {
            const pos = mentionStart + 1 + filePath.length;
            ref.current.setSelectionRange(pos, pos);
            ref.current.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 0);
      } else {
        closeSuggestions();
      }
    },
    [value, mentionStart, onChange, closeSuggestions]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      } else if (e.key === 'Enter') {
        const idx = selectedIdx >= 0 ? selectedIdx : 0;
        e.preventDefault();
        insertMention(suggestions[idx].path, suggestions[idx].isDir);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const idx = selectedIdx >= 0 ? selectedIdx : 0;
        insertMention(suggestions[idx].path, suggestions[idx].isDir);
      } else if (e.key === 'Escape') {
        closeSuggestions();
      }
    },
    [suggestions, selectedIdx, insertMention, closeSuggestions]
  );

  return (
    <div className="relative">
      <textarea
        ref={ref}
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        value={value}
        placeholder={hint ?? '@파일경로 로 파일을 첨부할 수 있습니다.'}
        rows={4}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 bg-bg-secondary border border-border rounded-lg list-none z-50 max-h-[200px] overflow-y-auto shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={s.path}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 text-text-primary text-sm font-code ${i === selectedIdx ? 'bg-bg-tertiary' : 'hover:bg-bg-tertiary'}`}
                onClick={() => insertMention(s.path, s.isDir)}
              >
                {s.isDir ? `${s.display}` : s.display}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
