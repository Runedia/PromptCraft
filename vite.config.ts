import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(__dirname, 'src/web'),
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      // core 모듈을 웹에서도 직접 임포트할 수 있도록
      '../../core': path.join(__dirname, 'src/core'),
      '../../../core': path.join(__dirname, 'src/core'),
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
