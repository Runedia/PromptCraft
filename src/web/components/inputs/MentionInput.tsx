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

interface FilePreview {
  path: string;
  content: string;
  totalLines: number;
  language: string;
}

export function MentionInput({ value, hint, onChange, scanRoot }: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (selectedIdx < 0 || !listRef.current) return;
    const item = listRef.current.children[selectedIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  // 파일 선택 시 미리보기 fetch
  useEffect(() => {
    if (selectedIdx < 0 || suggestions.length === 0 || !scanRoot) {
      setPreview(null);
      return;
    }
    const s = suggestions[selectedIdx];
    if (!s || s.isDir) {
      setPreview(null);
      return;
    }

    clearTimeout(previewDebounceRef.current ?? undefined);
    previewDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/mention/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: s.path, scanRoot }),
        });
        if (res.ok) {
          const data = await res.json();
          setPreview({ path: s.path, content: data.content, totalLines: data.totalLines, language: data.language });
        }
      } catch {
        setPreview(null);
      }
    }, 200);
  }, [selectedIdx, suggestions, scanRoot]);

  const closeSuggestions = useCallback(() => {
    setSuggestions([]);
    setMentionStart(-1);
    setSelectedIdx(-1);
    setPreview(null);
  }, []);

  const fetchSuggestions = useCallback(
    async (partial: string) => {
      if (!scanRoot) return;
      try {
        const pathPart = partial.split('#')[0];
        const res = await fetch(`/api/mention/suggest?root=${encodeURIComponent(scanRoot)}&partial=${encodeURIComponent(pathPart)}`);
        if (res.ok) {
          const { suggestions: s } = await res.json();
          setSuggestions(s);
          setSelectedIdx(-1);
        }
      } catch {
        setSuggestions([]);
      }
    },
    [scanRoot]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      onChange(newVal);

      const cursor = e.target.selectionStart;
      const textBefore = newVal.slice(0, cursor);
      // 따옴표 모드: @"partial (닫히지 않은 따옴표) — 공백 포함 경로 입력 중
      // 일반 모드:  @partial/path — 공백 없는 경로
      const atMatch = textBefore.match(/@(?:"([^"]*)|([[\w./-]*(?:#L\d*(?:-\d*)?)?))$/);

      if (atMatch && scanRoot) {
        setMentionStart(cursor - atMatch[0].length);
        clearTimeout(debounceRef.current ?? undefined);
        debounceRef.current = setTimeout(() => {
          // 따옴표 모드면 group1, 일반 모드면 group2; #L 이후는 제거
          const pathPart = (atMatch[1] ?? atMatch[2] ?? '').split('#')[0];
          fetchSuggestions(pathPart);
        }, 150);
      } else {
        closeSuggestions();
      }
    },
    [onChange, scanRoot, closeSuggestions, fetchSuggestions]
  );

  const insertMention = useCallback(
    (filePath: string, isDir: boolean) => {
      if (!ref.current || mentionStart === -1) return;

      const before = value.slice(0, mentionStart);
      const after = value.slice(ref.current.selectionStart);
      // 공백 포함 경로는 따옴표로 감싸서 파서가 경계를 명확히 인식하게 함
      const quoted = filePath.includes(' ') ? `"${filePath}"` : filePath;
      onChange(`${before}@${quoted}${after}`);
      setPreview(null);

      if (isDir) {
        setSelectedIdx(-1);
        const savedMentionStart = mentionStart;
        setTimeout(() => {
          if (ref.current) {
            const pos = savedMentionStart + 1 + quoted.length;
            ref.current.setSelectionRange(pos, pos);
            fetchSuggestions(filePath);
          }
        }, 0);
      } else {
        closeSuggestions();
      }
    },
    [value, mentionStart, onChange, closeSuggestions, fetchSuggestions]
  );

  const insertMentionWithLineRange = useCallback(
    (filePath: string) => {
      if (!ref.current || mentionStart === -1) return;
      const before = value.slice(0, mentionStart);
      const after = value.slice(ref.current.selectionStart);
      const quoted = filePath.includes(' ') ? `"${filePath}"` : filePath;
      onChange(`${before}@${quoted}#L${after}`);
      closeSuggestions();
      setTimeout(() => {
        if (ref.current) {
          const pos = mentionStart + 1 + quoted.length + 2; // @quoted#L
          ref.current.setSelectionRange(pos, pos);
          ref.current.focus();
        }
      }, 0);
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
      } else if (e.key === 'Enter' && !e.shiftKey) {
        const idx = selectedIdx >= 0 ? selectedIdx : 0;
        e.preventDefault();
        insertMention(suggestions[idx].path, suggestions[idx].isDir);
      } else if (e.key === 'Enter' && e.shiftKey) {
        // Shift+Enter: 파일 선택 후 라인 범위 모드
        const idx = selectedIdx >= 0 ? selectedIdx : 0;
        if (!suggestions[idx].isDir) {
          e.preventDefault();
          insertMentionWithLineRange(suggestions[idx].path);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const idx = selectedIdx >= 0 ? selectedIdx : 0;
        insertMention(suggestions[idx].path, suggestions[idx].isDir);
      } else if (e.key === 'Escape') {
        closeSuggestions();
      }
    },
    [suggestions, selectedIdx, insertMention, insertMentionWithLineRange, closeSuggestions]
  );

  const previewLines = preview ? preview.content.split('\n').slice(0, 15) : [];

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
        <div className="absolute top-full left-0 right-0 bg-bg-secondary border border-border rounded-lg z-50 shadow-lg overflow-hidden">
          <ul ref={listRef} className="list-none max-h-[200px] overflow-y-auto">
            {suggestions.map((s, i) => (
              <li key={s.path}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 text-text-primary text-sm font-code ${i === selectedIdx ? 'bg-bg-tertiary' : 'hover:bg-bg-tertiary'}`}
                  onClick={() => insertMention(s.path, s.isDir)}
                >
                  {s.display}
                </button>
              </li>
            ))}
          </ul>
          {preview && (
            <div className="border-t border-border">
              <div className="px-3 pt-2 flex items-center justify-between">
                <span className="text-xs font-code text-text-muted truncate">{preview.path}</span>
                <span className="text-xs text-text-muted ml-2 shrink-0">{preview.totalLines}줄</span>
              </div>
              <pre className="mx-3 my-1 text-xs font-code text-text-primary bg-bg-tertiary rounded p-2 max-h-[120px] overflow-y-auto">
                {previewLines.map((line, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 정적 파일 미리보기, 재정렬 없음
                  <span key={i} className="block">
                    <span className="text-text-muted select-none inline-block w-7 text-right mr-2">{i + 1}</span>
                    {line || ' '}
                  </span>
                ))}
                {preview.totalLines > 15 && <span className="text-text-muted block mt-1">... ({preview.totalLines - 15}줄 더)</span>}
              </pre>
              <div className="flex gap-2 px-3 pb-2">
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded bg-accent-primary text-white hover:opacity-90"
                  onClick={() => insertMention(preview.path, false)}
                >
                  전체 파일
                </button>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded border border-border text-text-primary hover:bg-bg-tertiary"
                  onClick={() => insertMentionWithLineRange(preview.path)}
                >
                  라인 범위 지정
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
