import type { Locale } from '@shared/i18n/types.js';
import { Check, ChevronsUpDown, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.js';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command.js';
import { Input } from '@/components/ui/input.js';
import { Label } from '@/components/ui/label.js';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.js';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet.js';
import { useLocale } from '@/i18n/LocaleContext.js';
import { useT } from '@/i18n/useT.js';
import { cn } from '@/lib/utils';
import { UI_IDS } from '@/ui-ids.js';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

const SHELL_OPTIONS = [
  { value: 'cmd', label: 'Command Prompt (cmd)' },
  { value: 'powershell', label: 'Windows PowerShell' },
  { value: 'pwsh', label: 'PowerShell 7+ (pwsh)' },
] as const;

const LANG_KEY = 'ui.language';
type LangSetting = 'system' | Locale;

/**
 * @ui-ids WORK_SETTINGS_SHEET, WORK_SETTINGS_THEME_GROUP, WORK_SETTINGS_SHELL_GROUP, WORK_SETTINGS_LANG_GROUP, WORK_SETTINGS_REFINE_SECTION, WORK_SETTINGS_REFINE_MODEL, WORK_SETTINGS_REFINE_REFRESH, WORK_SETTINGS_DATA_SECTION, WORK_SETTINGS_DATA_EXPORT, WORK_SETTINGS_DATA_IMPORT
 */
export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const t = useT();
  const { setLang } = useLocale();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [shell, setShell] = useState('cmd');
  const [langSetting, setLangSetting] = useState<LangSetting>('system');
  const [refineBaseUrl, setRefineBaseUrl] = useState('http://localhost:1234/v1');
  const [refineModel, setRefineModel] = useState('');
  const [refineApiKey, setRefineApiKey] = useState('');
  const [refineThreshold, setRefineThreshold] = useState('50');
  const [refineModels, setRefineModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const pendingRef = useRef(false);
  const langPendingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // /api/llm/status는 저장된 config(refine.baseUrl/apiKey) 기준으로 모델을 조회한다.
  // 따라서 새로고침 전에는 현재 입력값을 먼저 저장해야 한다(handleRefreshModels 참고).
  const loadModels = useCallback(async (signal?: AbortSignal): Promise<string[]> => {
    setModelsLoading(true);
    try {
      const r = await fetch('/api/llm/status', signal ? { signal } : {});
      const s = (r.ok ? await r.json() : { models: [] }) as { models?: string[] };
      const models = s.models ?? [];
      setRefineModels(models);
      return models;
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setRefineModels([]);
      return [];
    } finally {
      setModelsLoading(false);
    }
  }, []);

  // THEME_OPTIONS labels resolved inside component via t()
  const themeOptions = [
    { value: 'system', label: t('web.settingsSheet.themeSystem') },
    { value: 'light', label: t('web.settingsSheet.themeLight') },
    { value: 'dark', label: t('web.settingsSheet.themeDark') },
  ] as const;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    fetch('/api/config', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((cfg: Record<string, string>) => {
        setShell(cfg['run.shell'] ?? 'cmd');
        const stored = cfg[LANG_KEY];
        setLangSetting(stored === 'ko' || stored === 'en' ? stored : 'system');
        setRefineBaseUrl(cfg['refine.baseUrl'] ?? 'http://localhost:1234/v1');
        setRefineModel(cfg['refine.model'] ?? '');
        setRefineApiKey(cfg['refine.apiKey'] ?? '');
        setRefineThreshold(cfg['refine.threshold'] ?? '50');
      })
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') toast.error(t('web.settingsSheet.loadError'));
      });
    return () => ac.abort();
  }, [open, t]);

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    void loadModels(ac.signal);
    return () => ac.abort();
  }, [open, loadModels]);

  const saveRefine = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.error(t('web.settingsSheet.saveError'));
    }
  };

  const handleRefreshModels = async () => {
    // /api/llm/status는 저장된 config 기준이므로, 현재 입력한 연결 설정을 먼저 저장한 뒤 재조회한다.
    await saveRefine('refine.baseUrl', refineBaseUrl);
    await saveRefine('refine.apiKey', refineApiKey);
    const models = await loadModels();
    // 기존 선택 모델이 새 목록에 없으면(엔드포인트 변경·모델 삭제 등) 선택을 비운다.
    // 영속화까지 해야 시트 재오픈 시 stale 선택이 부활하지 않는다.
    if (refineModel && !models.includes(refineModel)) {
      setRefineModel('');
      await saveRefine('refine.model', '');
    }
  };

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
      toast.success(t('web.settingsSheet.shellChanged'));
    } catch {
      setShell(prev);
      toast.error(t('web.settingsSheet.saveError'));
    } finally {
      pendingRef.current = false;
    }
  };

  const handleLangChange = async (value: string) => {
    if (langPendingRef.current) return;
    langPendingRef.current = true;
    const next = value as LangSetting;
    const prev = langSetting;
    setLangSetting(next);
    try {
      if (next === 'system') {
        // ui.language 삭제 → 서버가 OS 감지로 복귀. GET /api/locale로 실제 해소값을 받아 즉시 반영.
        const del = await fetch(`/api/config/${LANG_KEY}`, { method: 'DELETE' });
        if (!del.ok) throw new Error(`HTTP ${del.status}`);
        // locale 해소 실패는 catch/rollback으로 보낸다 — setLang 미호출 상태로 success toast가 뜨면
        // RadioGroup(system)과 LocaleContext.lang이 desync된다(I3).
        const loc = await fetch('/api/locale');
        if (!loc.ok) throw new Error(`HTTP ${loc.status}`);
        const { lang } = (await loc.json()) as { lang?: unknown };
        if (lang !== 'ko' && lang !== 'en') throw new Error(`invalid lang: ${String(lang)}`);
        setLang(lang);
      } else {
        const res = await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [LANG_KEY]: next }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setLang(next);
      }
      toast.success(t('web.settingsSheet.langChanged'));
    } catch {
      setLangSetting(prev);
      toast.error(t('web.settingsSheet.saveError'));
    } finally {
      langPendingRef.current = false;
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') ?? '';
      const filename = /filename="([^"]+)"/.exec(cd)?.[1] ?? 'promptcraft-export.json';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('web.settingsData.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택이 가능하도록 리셋
    if (!file) return;
    if (!window.confirm(t('web.settingsData.importConfirm'))) return;
    setImporting(true);
    try {
      const text = await file.text();
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      });
      if (!res.ok) {
        // 400은 JSON { error }, 500은 HTML일 수 있다 — 파싱 실패 시 상태 코드로 폴백
        const msg = await res.json().then(
          (b) => (b as { error?: string }).error,
          () => undefined
        );
        throw new Error(msg ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { historyAdded?: number; historySkipped?: number; warnings?: string[] };
      toast.success(t('web.settingsData.importSuccess', { added: body.historyAdded ?? 0, skipped: body.historySkipped ?? 0 }));
      for (const w of body.warnings ?? []) toast.warning(w);
    } catch (err) {
      toast.error(`${t('web.settingsData.importError')}: ${(err as Error).message}`);
    } finally {
      setImporting(false);
    }
  };

  const langOptions = [
    { value: 'system', label: t('web.settingsSheet.langSystem') },
    { value: 'ko', label: t('web.settingsSheet.langKo') },
    { value: 'en', label: t('web.settingsSheet.langEn') },
  ] as const;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" data-ui-id={UI_IDS.WORK_SETTINGS_SHEET} className="w-[420px] sm:max-w-[420px] p-0 flex flex-col gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border text-left">
          <SheetTitle className="text-sm">{t('web.settingsSheet.title')}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 모양 */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-code uppercase tracking-[0.07em] text-muted-foreground">{t('web.settingsSheet.appearance')}</h3>
            <div className="space-y-2">
              <Label id="settings-theme-label" className="text-[13px]">
                {t('web.settingsSheet.theme')}
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
                  {themeOptions.map((opt) => (
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

          {/* 언어 */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-code uppercase tracking-[0.07em] text-muted-foreground">{t('web.settingsSheet.language')}</h3>
            <div className="space-y-2">
              <Label id="settings-lang-label" className="text-[13px]">
                {t('web.settingsSheet.languageLabel')}
              </Label>
              <RadioGroup
                value={langSetting}
                onValueChange={handleLangChange}
                aria-labelledby="settings-lang-label"
                data-ui-id={UI_IDS.WORK_SETTINGS_LANG_GROUP}
                className="gap-2"
              >
                {langOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`lang-${opt.value}`} />
                    <Label htmlFor={`lang-${opt.value}`} className="text-[13px] font-normal cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-[11px] text-muted-foreground">{t('web.settingsSheet.langHint')}</p>
            </div>
          </section>

          {/* 실행 */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-code uppercase tracking-[0.07em] text-muted-foreground">{t('web.settingsSheet.run')}</h3>
            <div className="space-y-2">
              <Label id="settings-shell-label" className="text-[13px]">
                {t('web.settingsSheet.defaultShell')}
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
              <p className="text-[11px] text-muted-foreground">{t('web.settingsSheet.shellHint')}</p>
            </div>
          </section>

          {/* AI 다듬기 */}
          <section className="space-y-3" data-ui-id={UI_IDS.WORK_SETTINGS_REFINE_SECTION}>
            <h3 className="text-[11px] font-code uppercase tracking-[0.07em] text-muted-foreground">{t('web.settingsRefine.section')}</h3>
            <div className="space-y-2">
              <Label htmlFor="refine-baseurl" className="text-[13px]">
                {t('web.settingsRefine.baseUrl')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="refine-baseurl"
                  value={refineBaseUrl}
                  onChange={(e) => setRefineBaseUrl(e.target.value)}
                  onBlur={() => saveRefine('refine.baseUrl', refineBaseUrl)}
                  className="h-8 text-[13px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleRefreshModels}
                  disabled={modelsLoading}
                  title={t('web.settingsRefine.refresh')}
                  aria-label={t('web.settingsRefine.refresh')}
                  data-ui-id={UI_IDS.WORK_SETTINGS_REFINE_REFRESH}
                >
                  <RefreshCw className={cn('h-4 w-4', modelsLoading && 'animate-spin')} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refine-model" className="text-[13px]">
                {t('web.settingsRefine.model')}
              </Label>
              {/* 네이티브 datalist는 Radix 모달 Dialog의 focus-trap에 막혀 선택이 커밋되지 않는다.
                  Popover+Command combobox로 대체하고, Dialog 안에서 동작하도록 Popover에 modal을 켠다. */}
              <Popover open={modelOpen} onOpenChange={setModelOpen} modal>
                <PopoverTrigger asChild>
                  <Button
                    id="refine-model"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={modelOpen}
                    aria-controls="refine-model-listbox"
                    className="h-8 w-full justify-between text-[13px] font-normal"
                    data-ui-id={UI_IDS.WORK_SETTINGS_REFINE_MODEL}
                  >
                    <span className={cn('truncate', !refineModel && 'text-muted-foreground')}>{refineModel || t('web.settingsRefine.modelPlaceholder')}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t('web.settingsRefine.modelSearch')} className="h-8 text-[13px]" />
                    <CommandList id="refine-model-listbox">
                      <CommandEmpty>{t('web.settingsRefine.modelEmpty')}</CommandEmpty>
                      <CommandGroup>
                        {refineModels.map((m) => (
                          <CommandItem
                            key={m}
                            value={m}
                            onSelect={() => {
                              setRefineModel(m);
                              saveRefine('refine.model', m);
                              setModelOpen(false);
                            }}
                            className="text-[13px]"
                          >
                            <Check className={cn('h-4 w-4', refineModel === m ? 'opacity-100' : 'opacity-0')} />
                            {m}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refine-apikey" className="text-[13px]">
                {t('web.settingsRefine.apiKey')}
              </Label>
              <Input
                id="refine-apikey"
                type="password"
                value={refineApiKey}
                onChange={(e) => setRefineApiKey(e.target.value)}
                onBlur={() => saveRefine('refine.apiKey', refineApiKey)}
                className="h-8 text-[13px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refine-threshold" className="text-[13px]">
                {t('web.settingsRefine.threshold')}
              </Label>
              <Input
                id="refine-threshold"
                type="number"
                min={0}
                max={100}
                value={refineThreshold}
                onChange={(e) => setRefineThreshold(e.target.value)}
                onBlur={() => {
                  const clamped = String(Math.min(100, Math.max(0, Number(refineThreshold) || 0)));
                  setRefineThreshold(clamped);
                  saveRefine('refine.threshold', clamped);
                }}
                step={1}
                className="h-8 text-[13px] w-24"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">{t('web.settingsRefine.hint')}</p>
          </section>

          {/* 데이터 */}
          <section className="space-y-3" data-ui-id={UI_IDS.WORK_SETTINGS_DATA_SECTION}>
            <h3 className="text-[11px] font-code uppercase tracking-[0.07em] text-muted-foreground">{t('web.settingsData.section')}</h3>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={exporting} data-ui-id={UI_IDS.WORK_SETTINGS_DATA_EXPORT}>
                {t('web.settingsData.export')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                data-ui-id={UI_IDS.WORK_SETTINGS_DATA_IMPORT}
              >
                {t('web.settingsData.import')}
              </Button>
              <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
            </div>
            <p className="text-[11px] text-muted-foreground">{t('web.settingsData.hint')}</p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
