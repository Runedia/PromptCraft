import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.js';
import { useT } from '@/i18n/useT.js';
import { UI_IDS } from '@/ui-ids.js';

export function ThemeToggle() {
  const t = useT();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-ui-id={UI_IDS.THEME_TOGGLE}
      aria-label={isDark ? t('web.themeToggle.toLightMode') : t('web.themeToggle.toDarkMode')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Moon size={16} /> : <Sun size={16} />}
    </Button>
  );
}
