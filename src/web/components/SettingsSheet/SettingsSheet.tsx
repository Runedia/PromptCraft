import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label.js';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet.js';
import { UI_IDS } from '@/ui-ids.js';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS = [
  { value: 'system', label: '시스템 설정 따름' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
] as const;

const SHELL_OPTIONS = [
  { value: 'cmd', label: 'Command Prompt (cmd)' },
  { value: 'powershell', label: 'Windows PowerShell' },
  { value: 'pwsh', label: 'PowerShell 7+ (pwsh)' },
] as const;

/**
 * @ui-ids WORK_SETTINGS_SHEET, WORK_SETTINGS_THEME_GROUP, WORK_SETTINGS_SHELL_GROUP
 */
export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [shell, setShell] = useState('cmd');
  const pendingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    fetch('/api/config', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((cfg: Record<string, string>) => setShell(cfg['run.shell'] ?? 'cmd'))
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') toast.error('설정을 불러오지 못했습니다.');
      });
    return () => ac.abort();
  }, [open]);

  const handleShellChange = async (value: string) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    const prev = shell;
    setShell(value);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'run.shell': value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('기본 셸이 변경되었습니다.');
    } catch {
      setShell(prev);
      toast.error('설정 저장에 실패했습니다.');
    } finally {
      pendingRef.current = false;
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" data-ui-id={UI_IDS.WORK_SETTINGS_SHEET} className="w-[420px] sm:max-w-[420px] p-0 flex flex-col gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border text-left">
          <SheetTitle className="text-sm">설정</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 모양 */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-code uppercase tracking-[0.07em] text-muted-foreground">모양</h3>
            <div className="space-y-2">
              <Label id="settings-theme-label" className="text-[13px]">
                테마
              </Label>
              {/* mounted 가드는 load-bearing: theme이 undefined일 때 RadioGroup value에 전달되면 전체 미선택됨 — 제거 금지 */}
              {mounted && (
                <RadioGroup
                  value={theme}
                  onValueChange={setTheme}
                  aria-labelledby="settings-theme-label"
                  data-ui-id={UI_IDS.WORK_SETTINGS_THEME_GROUP}
                  className="gap-2"
                >
                  {THEME_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`theme-${opt.value}`} />
                      <Label htmlFor={`theme-${opt.value}`} className="text-[13px] font-normal cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          </section>

          {/* 실행 */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-code uppercase tracking-[0.07em] text-muted-foreground">실행</h3>
            <div className="space-y-2">
              <Label id="settings-shell-label" className="text-[13px]">
                기본 셸 (Run as)
              </Label>
              <RadioGroup
                value={shell}
                onValueChange={handleShellChange}
                aria-labelledby="settings-shell-label"
                data-ui-id={UI_IDS.WORK_SETTINGS_SHELL_GROUP}
                className="gap-2"
              >
                {SHELL_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`shell-${opt.value}`} />
                    <Label htmlFor={`shell-${opt.value}`} className="text-[13px] font-normal cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-[11px] text-muted-foreground">새 터미널 창에서 provider CLI를 실행할 셸입니다.</p>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
