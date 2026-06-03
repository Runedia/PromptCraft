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
      '@shared': path.join(__dirname, 'src/shared'),
      '@': path.join(__dirname, 'src/web'),
    },
  },
  build: {
    outDir: path.join(__dirname, 'dist/web'),
    emptyOutDir: true,
    // 로컬 설치형 도구이므로 구형 브라우저 비대상 — 모던 타깃으로 트랜스파일 산출물을 슬림화한다.
    target: 'es2022',
    rollupOptions: {
      output: {
        // vendor 청크 분리: 앱 코드 변경 시 vendor 재다운로드를 피하고 초기 파싱/평가를 병렬 청크로 분산한다.
        // 마크다운 스택은 PromptPreview의 lazy MarkdownView에서만 참조되므로 전용 청크로 묶여 on-demand 로드된다.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          const n = id.replace(/\\/g, '/');
          if (
            /node_modules\/(react-markdown|remark-|micromark|mdast|hast|unist|unified|vfile|decode-named-character-reference|character-entities|property-information|space-separated-tokens|comma-separated-tokens|trim-lines|html-url-attributes|bail|is-plain-obj|trough|devlop|ccount|markdown-table|zwitch|longest-streak|estree-util|mdurl)/.test(
              n
            )
          ) {
            return 'markdown';
          }
          if (/node_modules\/(react-dom|react|scheduler)\//.test(n)) return 'react-vendor';
          if (n.includes('node_modules/@dnd-kit')) return 'dnd';
          if (/node_modules\/(zustand|zundo|use-sync-external-store)/.test(n)) return 'state';
          // 나머지 UI 의존성(@radix-ui/cmdk/vaul/sonner/lucide 등)과 기타는 단일 vendor 청크로 묶는다.
          // ui-vendor로 별도 분리하면 vendor↔ui-vendor 순환 청크가 발생하므로 통합한다.
          return 'vendor';
        },
      },
    },
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
