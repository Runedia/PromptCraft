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
import './styles/design-system.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

createRoot(root).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
