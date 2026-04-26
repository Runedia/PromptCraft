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
