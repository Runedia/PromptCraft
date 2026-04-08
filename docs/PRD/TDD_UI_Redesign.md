# TDD — PromptCraft UI/UX 개편 기술 설계

**버전:** 1.0  
**연관 문서:** PRD_UI_Redesign.md, PRD 2.2, UI_UX.md  
**범위:** SectionCard 모델, Dual-Pane 웹 UI, 로컬 웹 서버 아키텍처

---

## 1. 아키텍처 개요

### 1.1 시스템 구조

```
promptcraft serve
        │
        ▼
┌───────────────────────────────────────────┐
│  Express Server (src/server/)             │
│  - localhost:3000 (충돌 시 자동 탐색)      │
│  - /api/* REST 엔드포인트                  │
│  - Vite 정적 파일 서빙 (프로덕션)           │
│  - Vite dev proxy (개발)                  │
└──────────┬──────────────────┬─────────────┘
           │ REST             │ 파일시스템
           ▼                  ▼
┌─────────────────┐  ┌────────────────────────┐
│  React App      │  │  ~/.promptcraft/        │
│  (src/web/)     │  │  ├─ promptcraft.db      │
│                 │  │  ├─ last-scan.json      │
│  Dual-Pane UI   │  │  └─ config.json         │
│  SectionCard    │  └────────────────────────┘
│  State Manager  │
└─────────────────┘
```

### 1.2 디렉토리 구조

```
src/
├── cli/                  # 기존 CLI (유지)
│   ├── index.ts
│   ├── commands/
│   └── ink/              # Ink 위자드 (레거시)
├── server/               # 신규
│   ├── index.ts          # Express 앱 진입점
│   ├── routes/
│   │   ├── scan.ts
│   │   ├── history.ts
│   │   ├── config.ts
│   │   ├── template.ts
│   │   └── prompt.ts
│   └── middleware/
│       └── errorHandler.ts
├── web/                  # 신규 (React)
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── TreeSelect/
│   │   ├── PresetSelect/
│   │   ├── SectionCard/
│   │   ├── CardPool/
│   │   ├── PromptPreview/
│   │   └── inputs/
│   │       ├── TextInput.tsx
│   │       ├── MultilineInput.tsx
│   │       ├── SelectInput.tsx
│   │       ├── SelectOrTextInput.tsx
│   │       └── MentionInput.tsx
│   ├── hooks/
│   │   ├── useCardSession.ts
│   │   ├── usePromptBuilder.ts
│   │   └── useScan.ts
│   └── store/
│       └── cardStore.ts  # Zustand
├── core/                 # 기존 로직 (유지 및 재활용)
│   ├── scanner/
│   ├── builder/
│   │   ├── promptBuilder.ts   # 변경: SectionCard 기반으로 재작성
│   │   └── tokenEstimator.ts  # 신규
│   └── db/
data/
├── trees/                # 스키마 변경
│   ├── error-solving.json
│   ├── feature-impl.json
│   ├── code-review.json
│   └── concept-learn.json
├── cards/                # 신규: 공통 카드 메타데이터
│   └── card-definitions.json
└── template-presets/     # 기존 유지
```

---

## 2. 핵심 데이터 모델

### 2.1 SectionCard 인터페이스

```typescript
// src/core/types/card.ts

export type InputType =
  | 'text'
  | 'multiline'
  | 'select'
  | 'select-or-text'
  | 'multiline-mention';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SectionCard {
  id: string;
  label: string;
  required: boolean;        // true: 카드 풀로 제거 불가
  active: boolean;          // false: 카드 풀에 위치
  order: number;            // 프롬프트 섹션 출력 순서 (1-indexed)
  inputType: InputType;
  value: string;
  template: string;         // '## Error Evidence\n{{value}}'
  hint?: string;
  examples?: string[];
  options?: SelectOption[]; // select / select-or-text 타입 전용
  scanSuggested?: boolean;  // 스캔 결과 기반 자동 활성화 여부
}

export interface CardSession {
  treeId: string;
  cards: SectionCard[];     // active + inactive 전체 포함
  scanResult: ScanResult | null;
  createdAt: Date;
}
```

### 2.2 트리 JSON 스키마 (변경)

**기존 스키마** — 질문 흐름(분기 트리) 정의  
**변경 스키마** — 카드 구성 선언 + 카드 메타데이터

```typescript
// data/trees/error-solving.json (변경 후)
{
  "id": "error-solving",
  "label": "에러 해결",
  "description": "런타임/빌드/네트워크 에러 디버깅",
  "icon": "🔴",
  "defaultActiveCards": [
    "role",
    "goal",
    "stack-environment",
    "error-evidence",
    "tried-methods"
  ],
  "cardPool": [
    "current-situation",
    "constraints",
    "build-log",
    "request-log",
    "profiling-data",
    "baseline-metric"
  ],
  "cardOverrides": {
    // 이 트리에서만 다른 hint/examples를 쓰고 싶을 때
    "error-evidence": {
      "hint": "에러 메시지 전체와 스택 트레이스를 붙여넣으세요."
    }
  }
}
```

```typescript
// data/cards/card-definitions.json
// 공통 카드 메타데이터 — 모든 트리에서 공유
{
  "role": {
    "label": "역할",
    "required": true,
    "inputType": "select-or-text",
    "template": "## Role\n{{value}}",
    "hint": "AI에게 부여할 전문가 역할을 선택하거나 직접 입력하세요.",
    "examples": ["TypeScript 개발자", "백엔드 엔지니어", "풀스택 개발자"]
  },
  "goal": {
    "label": "목표",
    "required": true,
    "inputType": "text",
    "template": "## Goal\n{{value}}",
    "hint": "달성하려는 목표를 한 문장으로 작성하세요."
  },
  "stack-environment": {
    "label": "스택 & 환경",
    "required": false,
    "inputType": "multiline",
    "template": "## Stack & Environment\n{{value}}",
    "hint": "프레임워크, 언어, 패키지 매니저 등 환경 정보",
    "scanSuggested": true
  },
  "error-evidence": {
    "label": "에러 증거",
    "required": false,
    "inputType": "multiline-mention",
    "template": "## Error Evidence\n{{value}}",
    "hint": "에러 메시지, 스택 트레이스를 붙여넣으세요. @파일경로로 파일 참조 가능."
  },
  "current-situation": {
    "label": "현재 상황",
    "required": false,
    "inputType": "multiline",
    "template": "## Current Situation\n{{value}}"
  },
  "constraints": {
    "label": "제약 조건",
    "required": false,
    "inputType": "multiline",
    "template": "## Constraints\n{{value}}"
  }
  // ... 나머지 카드 정의
}
```

### 2.3 프롬프트 빌드 로직

```typescript
// src/core/builder/promptBuilder.ts

/**
 * active이고 value가 비어있지 않은 카드만 order 순으로 조립.
 * Handlebars 의존성 제거 — 단순 문자열 치환으로 대체.
 */
export function buildPrompt(cards: SectionCard[]): string {
  return cards
    .filter((c) => c.active && c.value.trim() !== '')
    .sort((a, b) => a.order - b.order)
    .map((c) => c.template.replace('{{value}}', c.value.trim()))
    .join('\n\n');
}

/**
 * GPT-4 계열 기준 대략적 토큰 추정 (cl100k_base 근사).
 * 정밀도보다 실시간 피드백용이므로 단순 근사로 충분.
 */
export function estimateTokens(text: string): number {
  // 영문: ~4자/토큰, 한국어: ~2자/토큰 혼합 근사
  const koreanChars = (text.match(/[가-힣]/g) ?? []).length;
  const otherChars = text.length - koreanChars;
  return Math.ceil(koreanChars / 2 + otherChars / 4);
}
```

---

## 3. 카드 세션 초기화 로직

### 3.1 세션 생성

```typescript
// src/core/builder/cardSession.ts

import cardDefs from '../../data/cards/card-definitions.json';
import treeConfigs from '../../data/trees/';

export function createCardSession(
  treeId: string,
  scanResult: ScanResult | null,
  prefill?: Record<string, string>
): CardSession {
  const tree = treeConfigs[treeId];
  const allCardIds = [...tree.defaultActiveCards, ...tree.cardPool];

  const cards: SectionCard[] = allCardIds.map((id, idx) => {
    const def = cardDefs[id];
    const override = tree.cardOverrides?.[id] ?? {};
    const isActive = tree.defaultActiveCards.includes(id);

    let value = prefill?.[id] ?? '';

    // 스캔 결과 자동 주입
    if (id === 'stack-environment' && scanResult && !value) {
      value = formatScanToStackEnv(scanResult);
    }

    // select-or-text: role 카드에 스캔 기반 옵션 주입
    const options =
      id === 'role' && scanResult
        ? buildRoleOptions(scanResult)
        : def.options;

    return {
      id,
      label: def.label,
      required: def.required ?? false,
      active: isActive,
      order: isActive ? tree.defaultActiveCards.indexOf(id) + 1 : 0,
      inputType: def.inputType,
      value,
      template: def.template,
      hint: override.hint ?? def.hint,
      examples: override.examples ?? def.examples,
      options,
      scanSuggested: def.scanSuggested ?? false,
    };
  });

  return { treeId, cards, scanResult, createdAt: new Date() };
}

function formatScanToStackEnv(scan: ScanResult): string {
  const parts: string[] = [];
  if (scan.languages.length > 0)
    parts.push(`언어: ${scan.languages.map((l) => l.name).join(', ')}`);
  if (scan.frameworks.length > 0)
    parts.push(`프레임워크: ${scan.frameworks.join(', ')}`);
  if (scan.packageManager)
    parts.push(`패키지 매니저: ${scan.packageManager}`);
  return parts.join('\n');
}
```

### 3.2 카드 풀 조작

```typescript
// 카드 활성화 (풀 → active 영역)
export function activateCard(
  cards: SectionCard[],
  cardId: string
): SectionCard[] {
  const maxOrder = Math.max(...cards.filter((c) => c.active).map((c) => c.order), 0);
  return cards.map((c) =>
    c.id === cardId ? { ...c, active: true, order: maxOrder + 1 } : c
  );
}

// 카드 비활성화 (active 영역 → 풀)
export function deactivateCard(
  cards: SectionCard[],
  cardId: string
): SectionCard[] {
  if (cards.find((c) => c.id === cardId)?.required) return cards; // 필수 카드 보호
  return cards.map((c) =>
    c.id === cardId ? { ...c, active: false, order: 0 } : c
  );
}

// 순서 변경 (드래그 앤 드롭 결과 적용)
export function reorderCards(
  cards: SectionCard[],
  orderedActiveIds: string[]
): SectionCard[] {
  return cards.map((c) => {
    const newOrder = orderedActiveIds.indexOf(c.id);
    return newOrder !== -1 ? { ...c, order: newOrder + 1 } : c;
  });
}
```

---

## 4. Express API 설계

### 4.1 엔드포인트 목록

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/trees` | 트리 목록 반환 |
| GET | `/api/trees/:treeId` | 트리 상세 + 카드 정의 반환 |
| GET | `/api/cards` | 전체 카드 정의 반환 |
| POST | `/api/scan` | 스캔 실행 |
| GET | `/api/scan/last` | 마지막 스캔 결과 반환 |
| POST | `/api/prompt/build` | 프롬프트 빌드 (서버 사이드 조립) |
| GET | `/api/history` | 히스토리 목록 |
| GET | `/api/history/:id` | 히스토리 상세 |
| DELETE | `/api/history/:id` | 히스토리 삭제 |
| GET | `/api/templates` | 저장 템플릿 목록 |
| POST | `/api/templates` | 템플릿 저장 |
| GET | `/api/config` | 설정 조회 |
| PUT | `/api/config` | 설정 변경 |

> 프롬프트 빌드(`/api/prompt/build`)는 클라이언트 사이드에서도 동일 로직으로 실행 가능하다.  
> 서버 사이드 엔드포인트는 히스토리 저장 및 파일 쓰기가 필요할 때만 호출한다.

### 4.2 주요 요청/응답 스키마

```typescript
// POST /api/scan
// Request
{ path: string }

// Response
{
  languages: { name: string; percentage: number }[];
  frameworks: string[];
  packageManager: string | null;
  directoryTree: string;
  envExists: boolean;
  scanPath: string;
  elapsedMs: number;
}

// POST /api/prompt/build
// Request
{
  cards: SectionCard[];
  treeId: string;
  saveToHistory: boolean;
}

// Response
{
  prompt: string;
  tokenEstimate: number;
  historyId?: number;
}
```

---

## 5. React 상태 관리

### 5.1 Zustand Store

```typescript
// src/web/store/cardStore.ts
import { create } from 'zustand';

interface CardStore {
  // 상태
  treeId: string | null;
  cards: SectionCard[];
  scanResult: ScanResult | null;
  prompt: string;
  tokenEstimate: number;
  isScanLoading: boolean;

  // 액션
  setTree: (treeId: string, cards: SectionCard[]) => void;
  setScanResult: (result: ScanResult) => void;
  updateCardValue: (cardId: string, value: string) => void;
  activateCard: (cardId: string) => void;
  deactivateCard: (cardId: string) => void;
  reorderCards: (orderedActiveIds: string[]) => void;

  // 파생 계산 (selector)
  activeCards: () => SectionCard[];
  inactiveCards: () => SectionCard[];
}

export const useCardStore = create<CardStore>((set, get) => ({
  treeId: null,
  cards: [],
  scanResult: null,
  prompt: '',
  tokenEstimate: 0,
  isScanLoading: false,

  setTree: (treeId, cards) => {
    const prompt = buildPrompt(cards);
    set({ treeId, cards, prompt, tokenEstimate: estimateTokens(prompt) });
  },

  updateCardValue: (cardId, value) => {
    const cards = get().cards.map((c) =>
      c.id === cardId ? { ...c, value } : c
    );
    const prompt = buildPrompt(cards);
    set({ cards, prompt, tokenEstimate: estimateTokens(prompt) });
  },

  activateCard: (cardId) => {
    const cards = activateCard(get().cards, cardId);
    set({ cards });
  },

  deactivateCard: (cardId) => {
    const cards = deactivateCard(get().cards, cardId);
    const prompt = buildPrompt(cards);
    set({ cards, prompt, tokenEstimate: estimateTokens(prompt) });
  },

  reorderCards: (orderedActiveIds) => {
    const cards = reorderCards(get().cards, orderedActiveIds);
    const prompt = buildPrompt(cards);
    set({ cards, prompt, tokenEstimate: estimateTokens(prompt) });
  },

  activeCards: () => get().cards.filter((c) => c.active).sort((a, b) => a.order - b.order),
  inactiveCards: () => get().cards.filter((c) => !c.active),
}));
```

### 5.2 프리뷰 갱신 전략

프롬프트 빌드는 **클라이언트 사이드에서 동기적으로 실행**한다.  
`updateCardValue` 호출마다 즉시 `buildPrompt`를 재실행한다.  
텍스트 입력의 경우 `onChange` 이벤트에 debounce를 적용하지 않는다 — 입력 즉시 반영이 핵심 UX다.  
단, `multiline-mention`의 파일 읽기가 포함된 경우만 150ms debounce 적용.

---

## 6. 컴포넌트 설계

### 6.1 컴포넌트 트리

```
App
├── TreeSelectPage          # 진입 화면: 4개 트리 카드 그리드
├── PresetSelectPage        # 트리별 프리셋 카드 그리드
└── WorkspacePage           # 메인 Dual-Pane
    ├── LeftPane
    │   ├── Breadcrumb      # 트리명 표시
    │   ├── ActiveCardList  # 드래그 앤 드롭 (dnd-kit)
    │   │   └── SectionCard
    │   │       ├── CardHeader (label, required 배지, 제거 버튼)
    │   │       └── CardInput  (inputType에 따라 컴포넌트 분기)
    │   └── CardPool        # 비활성 카드 + 카드 추가 버튼
    └── RightPane
        ├── PromptPreview   # 마크다운 렌더링 (react-markdown)
        ├── TokenBadge      # 토큰 추정 표시
        └── ActionBar       # 복사, 저장, 히스토리
```

### 6.2 SectionCard 컴포넌트

```typescript
// src/web/components/SectionCard/SectionCard.tsx

interface SectionCardProps {
  card: SectionCard;
  onValueChange: (value: string) => void;
  onDeactivate: () => void;
  dragHandleProps?: DragHandleProps; // dnd-kit
}

export function SectionCard({ card, onValueChange, onDeactivate, dragHandleProps }: SectionCardProps) {
  return (
    <div className="section-card">
      <CardHeader
        label={card.label}
        required={card.required}
        onDeactivate={onDeactivate}
        dragHandleProps={dragHandleProps}
      />
      <CardInput
        type={card.inputType}
        value={card.value}
        hint={card.hint}
        examples={card.examples}
        options={card.options}
        onChange={onValueChange}
      />
    </div>
  );
}
```

### 6.3 CardInput 분기

```typescript
// src/web/components/SectionCard/CardInput.tsx

export function CardInput({ type, ...props }: CardInputProps) {
  switch (type) {
    case 'text':             return <TextInput {...props} />;
    case 'multiline':        return <MultilineInput {...props} />;
    case 'select':           return <SelectInput {...props} />;
    case 'select-or-text':   return <SelectOrTextInput {...props} />;
    case 'multiline-mention': return <MentionInput {...props} />;
  }
}
```

### 6.4 PromptPreview 컴포넌트

```typescript
// src/web/components/PromptPreview/PromptPreview.tsx

export function PromptPreview() {
  const { prompt, tokenEstimate, activeCards } = useCardStore();

  // 빈 값의 active 카드를 회색 placeholder로 표시
  const previewText = buildPreviewWithPlaceholders(activeCards());

  return (
    <div className="prompt-preview">
      <ReactMarkdown>{previewText}</ReactMarkdown>
      <div className="preview-footer">
        <TokenBadge count={tokenEstimate} />
        <ActionBar prompt={prompt} />
      </div>
    </div>
  );
}

function buildPreviewWithPlaceholders(activeCards: SectionCard[]): string {
  return activeCards
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const header = c.template.split('\n')[0]; // '## Role' 추출
      const body = c.value.trim() !== '' ? c.value.trim() : '_입력 대기 중..._';
      return `${header}\n${body}`;
    })
    .join('\n\n');
}
```

---

## 7. MentionInput 파일 보안 (기존 로직 이관)

CLI의 `MentionInput` 보안 처리를 웹 컴포넌트로 동일하게 이관한다.

```typescript
// src/web/components/inputs/MentionInput.tsx (보안 규칙)

const BLOCKED_PATTERNS = [/\.env(\..+)?$/, /\.(exe|dll|so|bin|jpg|png|gif|mp4|zip)$/i];
const PATH_TRAVERSAL_PATTERN = /\.\./;

function isPathAllowed(filePath: string, scanRoot: string): boolean {
  if (PATH_TRAVERSAL_PATTERN.test(filePath)) return false;
  if (BLOCKED_PATTERNS.some((p) => p.test(filePath))) return false;
  const resolved = path.resolve(scanRoot, filePath);
  return resolved.startsWith(path.resolve(scanRoot)); // 스캔 루트 이탈 방지
}
```

파일 내용 인라인 삽입은 `/api/mention/read` 엔드포인트를 통해 서버에서 처리한다 (클라이언트에 직접 파일시스템 접근 없음).

---

## 8. `promptcraft serve` CLI 명령

```typescript
// src/cli/commands/serve.ts

import { Command } from 'commander';
import { createServer } from '../../server/index.js';
import open from 'open';

export const serveCommand = new Command('serve')
  .description('웹 UI 실행')
  .option('-p, --port <number>', '포트 지정', '3000')
  .option('--no-open', '브라우저 자동 실행 비활성화')
  .action(async (opts) => {
    const port = await findAvailablePort(Number(opts.port));
    await createServer(port);
    console.log(`PromptCraft UI: http://localhost:${port}`);
    if (opts.open) open(`http://localhost:${port}`);
  });

async function findAvailablePort(start: number): Promise<number> {
  // 포트 사용 중이면 start+1 탐색, 최대 10회
}
```

---

## 9. 개발 환경 구성

### 9.1 추가 의존성

```json
{
  "dependencies": {
    "express": "^4.x",
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^7.x",
    "lucide-react": "^0.x",
    "react-markdown": "^9.x",
    "zustand": "^4.x",
    "zundo": "^2.x",
    "open": "^10.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "concurrently": "^8.x"
  }
}
```

### 9.2 개발 스크립트

```json
{
  "scripts": {
    "dev:server": "tsx watch src/server/index.ts",
    "dev:web": "vite src/web",
    "dev": "concurrently \"pnpm dev:server\" \"pnpm dev:web\"",
    "build:web": "vite build src/web --outDir dist/web",
    "build": "tsc && pnpm build:web"
  }
}
```

---

## 10. 디자인 시스템

### 10.1 색상 토큰

개발자 도구 표준인 Dark Mode + Minimalism 기반으로 설계한다.

```css
:root {
  /* Core Palette */
  --color-bg-primary:    #0F172A;   /* slate-900 — 메인 배경 */
  --color-bg-secondary:  #1E293B;   /* slate-800 — 카드/패널 배경 */
  --color-bg-tertiary:   #334155;   /* slate-700 — hover/active 배경 */
  --color-border:        #475569;   /* slate-600 — 기본 보더 */
  --color-border-subtle: #334155;   /* slate-700 — 약한 보더 */

  /* Text */
  --color-text-primary:   #F8FAFC;  /* slate-50 — 본문 텍스트 */
  --color-text-secondary: #94A3B8;  /* slate-400 — 보조 텍스트 */
  --color-text-muted:     #64748B;  /* slate-500 — 비활성 텍스트 */

  /* Accent */
  --color-accent-primary: #3B82F6;  /* blue-500 — 포커스/링크 */
  --color-accent-success: #22C55E;  /* green-500 — CTA/성공 */
  --color-accent-warning: #F59E0B;  /* amber-500 — 경고 */
  --color-accent-danger:  #EF4444;  /* red-500 — 에러/삭제 */

  /* Card States */
  --color-card-active:    #1E293B;
  --color-card-inactive:  #0F172A;
  --color-card-drag:      #1E3A5F;  /* 드래그 중 하이라이트 */
  --color-card-required:  #3B82F620; /* required 배지 배경 (12% opacity) */
}
```

Light Mode는 P2. Dark Mode를 기본값으로 구현하되, CSS 변수 구조로 향후 전환을 용이하게 한다.

### 10.2 타이포그래피

```css
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --font-ui:   'Fira Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-code: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;

  /* Scale */
  --text-xs:   0.75rem;   /* 12px — 배지, 캡션 */
  --text-sm:   0.875rem;  /* 14px — 보조 텍스트 */
  --text-base: 1rem;      /* 16px — 본문 */
  --text-lg:   1.125rem;  /* 18px — 카드 헤더 */
  --text-xl:   1.25rem;   /* 20px — 섹션 제목 */
  --text-2xl:  1.5rem;    /* 24px — 페이지 제목 */

  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;  /* 프리뷰 본문 */
}
```

| 요소 | 폰트 | 사이즈 | 굵기 |
|---|---|---|---|
| 카드 라벨 | Fira Sans | `--text-lg` | 600 |
| 카드 입력 | Fira Sans | `--text-base` | 400 |
| 프리뷰 헤더 | Fira Sans | `--text-xl` | 700 |
| 프리뷰 본문 | Fira Sans | `--text-base` | 400 |
| 코드 블록 | Fira Code | `--text-sm` | 400 |
| 토큰 배지 | Fira Code | `--text-xs` | 500 |
| 카드 풀 버튼 | Fira Sans | `--text-sm` | 500 |

### 10.3 간격 및 레이아웃 토큰

```css
:root {
  --space-1:  0.25rem;  /* 4px */
  --space-2:  0.5rem;   /* 8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */

  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;   /* 카드 컨테이너 */

  --shadow-card:     0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-drag:     0 8px 24px rgba(0,0,0,0.5);
}
```

### 10.4 컴포넌트 스타일 가이드

**SectionCard:**
```
┌─ radius-xl ──────────────────────────────────────────┐
│ bg: var(--color-card-active)                         │
│ border: 1px solid var(--color-border-subtle)         │
│ padding: var(--space-4)                              │
│ gap: var(--space-3)                                  │
│                                                      │
│ [drag-handle] [label: Fira Sans 600] [required 배지] [×] │
│                                                      │
│ [input area — full width]                            │
│ [hint: text-muted, text-sm]                          │
└──────────────────────────────────────────────────────┘

hover: border-color → var(--color-accent-primary), shadow-card-hover
drag:  bg → var(--color-card-drag), shadow-drag, opacity 0.9
```

**CardPool 버튼:**
```
[+ 라벨]
bg: transparent
border: 1px dashed var(--color-border)
radius: radius-md
padding: space-2 space-3
hover: border-solid, bg var(--color-bg-tertiary)
transition: all 150ms ease
cursor: pointer
```

**ActionBar 버튼:**
```
[Primary CTA — 복사]
bg: var(--color-accent-success)
color: #FFFFFF
radius: radius-md
padding: space-2 space-6
font-weight: 600

[Secondary — 저장/히스토리]
bg: transparent
border: 1px solid var(--color-border)
color: var(--color-text-secondary)
```

### 10.5 아이콘

Lucide Icons (https://lucide.dev) 사용. 일관된 24x24 viewBox, stroke-width 2.

| 용도 | 아이콘 | Lucide 이름 |
|---|---|---|
| 드래그 핸들 | ⠿ | `grip-vertical` |
| 카드 제거 | × | `x` |
| 카드 추가 | + | `plus` |
| 복사 | 📋 | `clipboard-copy` |
| 저장 | 💾 | `save` |
| 필수 배지 | 🔒 | `lock` |
| 스캔 | 🔍 | `scan` |
| 설정 | ⚙ | `settings` |
| 히스토리 | 🕒 | `history` |
| Undo | ↩ | `undo-2` |
| Redo | ↪ | `redo-2` |

---

## 11. 보안 미들웨어

### 11.1 Express 보안 설정

```typescript
// src/server/middleware/security.ts

import type { Request, Response, NextFunction } from 'express';

/**
 * localhost 전용 바인딩이지만, 방어적 보안 계층을 추가한다.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // CSP: 인라인 스크립트 허용 (Vite HMR), 외부 요청 차단
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:;"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
}

export function corsLocalhost(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  // localhost 계열만 허용
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}
```

### 11.2 경로 순회 방지

```typescript
// src/server/middleware/pathGuard.ts

import path from 'node:path';

/**
 * /api/scan, /api/mention/read 등 파일시스템 접근 엔드포인트에 적용.
 * 요청된 경로가 허용 범위를 벗어나지 않도록 검증.
 */
export function validatePath(requestedPath: string, allowedRoot: string): string {
  const resolved = path.resolve(allowedRoot, requestedPath);
  if (!resolved.startsWith(path.resolve(allowedRoot))) {
    throw new Error('Path traversal detected');
  }
  // 추가 차단: .env, 바이너리 파일
  const BLOCKED = [/\.env(\..+)?$/, /\.(exe|dll|so|bin)$/i];
  if (BLOCKED.some((p) => p.test(resolved))) {
    throw new Error('Blocked file type');
  }
  return resolved;
}
```

### 11.3 Graceful Shutdown

```typescript
// src/server/index.ts 내 shutdown 핸들러

function setupGracefulShutdown(server: http.Server, db: Database) {
  const shutdown = () => {
    console.log('\nShutting down...');
    server.close(() => {
      db.close();
      process.exit(0);
    });
    // 강제 종료 타임아웃 (5초)
    setTimeout(() => process.exit(1), 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
```

---

## 12. Undo/Redo 시스템

### 12.1 Zustand Temporal 미들웨어

```typescript
// src/web/store/cardStore.ts

import { create } from 'zustand';
import { temporal } from 'zundo';

interface CardStore {
  // ... 기존 상태/액션 (섹션 5.1과 동일)
}

// zundo: Zustand용 undo/redo 미들웨어
// 10단계 히스토리, 카드 배열 변경만 추적
export const useCardStore = create<CardStore>()(
  temporal(
    (set, get) => ({
      // ... 기존 구현
    }),
    {
      limit: 10,
      // 프롬프트/토큰은 파생값이므로 히스토리에서 제외
      partialize: (state) => ({
        cards: state.cards,
        treeId: state.treeId,
      }),
      // 1초 이내 연속 입력은 하나의 히스토리로 병합
      handleSet: (handleSet) => {
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        return (state) => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            handleSet(state);
          }, 1000);
        };
      },
    }
  )
);

// 컴포넌트에서 사용:
// const { undo, redo, pastStates, futureStates } = useCardStore.temporal.getState();
```

### 12.2 키보드 바인딩

```typescript
// src/web/hooks/useKeyboardShortcuts.ts

import { useEffect } from 'react';
import { useCardStore } from '../store/cardStore.js';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useCardStore.temporal.getState().undo();
      }

      // Redo: Ctrl/Cmd + Shift + Z
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useCardStore.temporal.getState().redo();
      }

      // Copy: Ctrl/Cmd + Enter
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        const prompt = useCardStore.getState().prompt;
        navigator.clipboard.writeText(prompt);
      }

      // Save: Ctrl/Cmd + S
      if (mod && e.key === 's') {
        e.preventDefault();
        // 템플릿 저장 모달 트리거
        document.dispatchEvent(new CustomEvent('promptcraft:save-modal'));
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
```

---

## 13. 세션 복구

### 13.1 자동 저장 로직

```typescript
// src/web/hooks/useSessionPersistence.ts

import { useEffect, useRef } from 'react';
import { useCardStore } from '../store/cardStore.js';

const STORAGE_PREFIX = 'promptcraft:session:';

interface SavedSession {
  treeId: string;
  cards: SectionCard[];
  savedAt: number;
}

export function useSessionPersistence() {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 카드 변경 감지 → localStorage 저장 (1초 debounce)
    const unsubscribe = useCardStore.subscribe((state) => {
      if (!state.treeId) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const session: SavedSession = {
          treeId: state.treeId!,
          cards: state.cards,
          savedAt: Date.now(),
        };
        localStorage.setItem(
          `${STORAGE_PREFIX}${state.treeId}`,
          JSON.stringify(session)
        );
      }, 1000);
    });

    return () => unsubscribe();
  }, []);
}

/**
 * 저장된 세션 확인 (TreeSelect에서 호출).
 * 24시간 초과 세션은 만료로 간주.
 */
export function getSavedSession(treeId: string): SavedSession | null {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${treeId}`);
  if (!raw) return null;

  const session: SavedSession = JSON.parse(raw);
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24시간
  if (Date.now() - session.savedAt > MAX_AGE) {
    localStorage.removeItem(`${STORAGE_PREFIX}${treeId}`);
    return null;
  }
  return session;
}

export function clearSavedSession(treeId: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${treeId}`);
}
```

### 13.2 복구 UX 흐름

```
사용자가 트리 선택 →
  해당 treeId에 저장된 세션 존재?
    ├─ Yes → 복구 다이얼로그 표시
    │        "이전에 작업하던 '{treeLabel}' 세션이 있습니다."
    │        [이어서 작업하기] → 저장된 cards로 Workspace 진입
    │        [새로 시작하기] → clearSavedSession() 후 빈 세션으로 진입
    │
    └─ No → 정상 세션 생성 (createCardSession)
```

---

## 14. 반응형 레이아웃 구현

### 14.1 브레이크포인트 상수

```typescript
// src/web/constants/breakpoints.ts

export const BREAKPOINTS = {
  sm: 768,
  md: 1024,
  lg: 1280,
} as const;
```

### 14.2 레이아웃 전환 전략

```
>= 1280px (lg):
  ┌──────── 60% ────────┬──── 40% ────┐
  │  Left Pane           │  Right Pane  │
  │  (카드 편집 + 풀)     │  (프리뷰)    │
  └─────────────────────┴─────────────┘

1024 ~ 1279px (md):
  ┌──────── 55% ────────┬──── 45% ────┐
  │  Left Pane           │  Right Pane  │
  └─────────────────────┴─────────────┘

768 ~ 1023px (sm):
  ┌─────────── 100% ──────────────────┐
  │  Single Pane (카드 편집 + 풀)       │
  │                                    │
  │  [프리뷰 보기 ↑] ← 하단 토글 버튼   │
  └────────────────────────────────────┘
  토글 시 → 하단 시트(60vh)로 프리뷰 표시

< 768px:
  단일 패널 + floating 프리뷰 버튼 (FAB)
  → 풀스크린 프리뷰 오버레이
```

### 14.3 useBreakpoint 훅

```typescript
// src/web/hooks/useBreakpoint.ts

import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '../constants/breakpoints.js';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(getBreakpoint());

  useEffect(() => {
    const onResize = () => setBp(getBreakpoint());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return bp;
}

function getBreakpoint(): Breakpoint {
  const w = window.innerWidth;
  if (w >= BREAKPOINTS.lg) return 'xl';
  if (w >= BREAKPOINTS.md) return 'lg';
  if (w >= BREAKPOINTS.sm) return 'md';
  return 'sm';
}
```

---

## 15. buildPrompt 안전성 수정

기존 `buildPrompt`의 단순 문자열 치환은 사용자 입력에 `{{value}}`가 포함될 경우 이중 치환 위험이 있다.  
1회 치환임을 명시하고, 플레이스홀더 충돌을 방지한다.

```typescript
// src/core/builder/promptBuilder.ts (수정)

/**
 * active이고 value가 비어있지 않은 카드만 order 순으로 조립.
 * 
 * 치환 전략: template 내 정확히 하나의 '{{value}}' 플레이스홀더를
 * indexOf + slice로 1회만 치환한다. String.replace를 사용하지 않아
 * 사용자 입력값 내 '{{value}}' 문자열이 재치환되는 문제를 방지한다.
 */
export function buildPrompt(cards: SectionCard[]): string {
  return cards
    .filter((c) => c.active && c.value.trim() !== '')
    .sort((a, b) => a.order - b.order)
    .map((c) => substituteOnce(c.template, '{{value}}', c.value.trim()))
    .join('\n\n');
}

function substituteOnce(
  template: string,
  placeholder: string,
  value: string
): string {
  const idx = template.indexOf(placeholder);
  if (idx === -1) return template;
  return template.slice(0, idx) + value + template.slice(idx + placeholder.length);
}
```

---

## 16. 단위 테스트 전략

| 대상 | 테스트 항목 |
|---|---|
| `buildPrompt` | active + 값 있는 카드만 포함 / order 순서 보장 / 빈 값 카드 미포함 |
| `substituteOnce` | 사용자 입력에 `{{value}}` 포함 시 재치환 없음 검증 |
| `estimateTokens` | 한국어/영문 혼합 근사 오차 30% 이내 |
| `createCardSession` | 스캔 결과 주입 정확성 / 필수 카드 required=true 보장 |
| `activateCard` | order 최대값+1 할당 / 중복 활성화 방지 |
| `deactivateCard` | required 카드 보호 / order 0 초기화 |
| `reorderCards` | 전달된 순서 배열 그대로 order 반영 |
| `validatePath` | `../` 경로 순회 차단 / `.env` 차단 / 허용 루트 이탈 차단 |
| `getSavedSession` | 24시간 초과 세션 만료 / 유효 세션 복원 / 존재하지 않는 키 → null |
| Undo/Redo | 카드 제거 후 undo → 복원 / 10단계 초과 시 oldest 제거 |
| API `/api/scan` | 존재하지 않는 경로 → 400 / 성공 → ScanResult 스키마 |
| API `/api/prompt/build` | cards 배열 비어있음 → 빈 문자열 / saveToHistory=true → DB 저장 |
| 보안 헤더 | CSP/CORS 헤더 존재 검증 / non-localhost origin 거부 |

---

## 11. 마이그레이션 순서

단계별 작업으로 CLI와 웹 UI가 병행 가능한 상태를 유지한다.

```
Phase 1: 데이터 모델 분리
  - card-definitions.json 작성
  - 트리 JSON 스키마 변경
  - SectionCard 타입 정의

Phase 2: 코어 로직 재작성
  - promptBuilder.ts → SectionCard 기반
  - createCardSession 구현
  - 카드 조작 함수 (activate/deactivate/reorder)

Phase 3: Express 서버 구축
  - 기존 CLI 명령어 로직을 REST 핸들러로 이관
  - /api/* 엔드포인트 구현
  - 보안 미들웨어 적용 (CSP, CORS, pathGuard)
  - Graceful shutdown 핸들러

Phase 4: React 웹 UI 구현
  - Zustand store + zundo (undo/redo) 미들웨어
  - TreeSelect → WorkspacePage 컴포넌트
  - Dual-Pane 레이아웃 + 반응형 브레이크포인트
  - 키보드 단축키 훅
  - 세션 자동저장/복구 훅
  - 디자인 시스템 CSS 변수 적용

Phase 5: 통합 및 검증
  - 단위 테스트 (보안, undo/redo, 세션 복구 포함)
  - `promptcraft serve` 명령 연결
  - 기존 CLI 레거시 동작 확인
  - 반응형 브레이크포인트별 수동 검증 (1440/1024/768/375px)
```
