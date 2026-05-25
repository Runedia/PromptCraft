import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import '@fontsource/geist/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { ThemeProvider } from './components/ThemeProvider.js';
import { LocaleProvider } from './i18n/LocaleContext.js';
import './styles/design-system.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

// LocaleProvider가 navigator.language로 시작해 내부에서 /api/locale을 fetch하므로 한 번만 마운트한다.
createRoot(root).render(
  <ThemeProvider>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </ThemeProvider>
);
