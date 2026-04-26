import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf-8')) as { version: string };

export default defineConfig({
  root: path.join(__dirname, 'src/web'),
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      '@core': path.join(__dirname, 'src/core'),
      '@': path.join(__dirname, 'src/web'),
    },
  },
  build: {
    outDir: path.join(__dirname, 'dist/web'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
