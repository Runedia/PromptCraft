# preprompt vs PromptCraft 비교 분석 보고서

**작성일**: 2026-05-12
**대상 저장소**: [yashdeeptehlan/preprompt](https://github.com/yashdeeptehlan/preprompt) (v0.1.8, MIT)
**기준 저장소**: PromptCraft (v0.0.1, MIT, 로컬 master 기준)
**클론 위치**: `temp/preprompt/`

---

## 1. 두 프로젝트의 본질적 차이

| 축 | preprompt | PromptCraft |
|---|---|---|
| **포지셔닝** | "런타임 프롬프트 인터셉터" — Claude Code/Cursor의 `UserPromptSubmit` 훅을 가로채 LLM에 도달하기 전 프롬프트를 자동 재작성 | "사전 프롬프트 빌더" — 사용자가 코드베이스 스캔 결과를 보며 카드 단위 양식을 채워 고품질 프롬프트를 생성 |
| **개입 시점** | 프롬프트 전송 직전 (지연 < 1ms 또는 Haiku 호출 ~$0.001) | 프롬프트 작성 단계 (작성 자체를 도와줌) |
| **LLM 의존성** | 분류기는 무비용·무지연이지만, 실제 재작성에는 `claude-haiku-4-5-20251001` API 호출 필수 | LLM 호출 0건 — 모든 가공은 결정론적 룰/JSON 데이터 기반 |
| **사용자 인터페이스** | CLI + 터미널 라이브 피드(`preprompt-watch`) + 정적 대시보드 (HTML) | Express+React+shadcn/ui 기반 풀 SPA (3-컬럼 워크스페이스) |
| **결과 산출물** | 재작성된 단일 prompt 문자열 + sidecar(score/reason) | 스택 환경·역할·시나리오·인수 기준이 합성된 마크다운 프롬프트 |
| **러닝 시스템** | "stack memory" — 세션 간 사용자의 언어/프레임워크 시그널을 SQLite에 누적 학습 | 카드 정의·트리·도메인 오버레이를 사람이 큐레이션한 JSON으로 외부화 |
| **저장 위치** | `~/.preprompt/history.db` (SQLite, prompt_history + stack_memory + sessions) | `~/.promptcraft/` (히스토리·설정 SQLite + 글로벌 config.json) |

요약: **preprompt는 AI가 사용자의 빈약한 프롬프트를 자동 보완하는 시스템**이고, **PromptCraft는 사용자가 처음부터 풍부한 프롬프트를 짜도록 돕는 시스템**이다. 두 도구는 경쟁이 아니라 워크플로의 다른 단계를 담당한다.

---

## 2. 정량 비교

### 2.1 코드 규모

| 항목 | preprompt | PromptCraft | 비율 |
|---|---:|---:|---:|
| 주 언어 | Python 3.11+ | TypeScript / Bun 1.3+ | — |
| 소스 LOC (전체 `.py/.md/.toml` 포함) | **3,839** | — | — |
| 소스 LOC (`.py`만) | 약 **2,800** | — | — |
| 소스 LOC (`.ts/.tsx`만) | — | **6,249** | × 약 2.2 |
| 소스 파일 수 | 29 (`.py`) | 130+ (`.ts`/`.tsx`) | × 약 4.5 |
| 테스트 파일 수 | **3** (`test_classifier`, `test_optimizer`, `test_integration`) | **27** | × 9.0 |
| 데이터 자산 (JSON) | 0 (코드 내 상수 사전) | **41** (카드 정의 1 + 트리 5 + 도메인 7 + 템플릿 프리셋 25 + 매핑 등) | — |
| README 분량 | 7.1KB (단일) | ≈1.1KB + `docs/` 별도 | — |
| PRD/스펙 문서 | 없음 (README + skill.md) | `docs/PRD/PRD_1.0~2.4.md`, UI Redesign, TDD 등 9개 | — |

### 2.2 핵심 모듈별 LOC (preprompt)

| 모듈 | LOC | 책임 |
|---|---:|---|
| `mcp_server/classifier.py` | **241** | 휴리스틱 점수화·라우팅 (pass/enrich/clarify) |
| `mcp_server/optimizer.py` | 114 | Haiku 호출, 시스템 프롬프트, 폴백 |
| `mcp_server/extractor.py` | 110 | 스택 시그널(언어·프레임워크·DB·스타일) 추출 |
| `mcp_server/tools.py` | 137 | MCP 도구 등록 (FastMCP) |
| `mcp_server/server.py` | 63 | stdio/SSE 트랜스포트 |
| `mcp_server/config.py` | 14 | pydantic-settings 환경변수 로더 |
| `storage/db.py` | **421** | SQLite 스키마/세션/스택 메모리 |
| `cli/commands.py` | **656** | history/stats/memory/optimize/clip 등 7개 서브커맨드 구현 |
| `cli/watch.py` | 101 | 실시간 활동 피드 (tail-like) |
| `.claude/hooks/pre_prompt.py` | 250 | UserPromptSubmit 훅 진입점 |
| `backend/main.py` | 208 | FastAPI 백엔드 (Railway 배포용) |
| `dashboard/server.py` | 113 | 정적 HTML 대시보드 호스팅 |

### 2.3 핵심 모듈별 LOC (PromptCraft, 일부)

| 모듈 | LOC | 책임 |
|---|---:|---|
| `core/builder/promptBuilder.ts` | ~50 | active 카드 → 마크다운 프롬프트 조립, `@경로` 멘션 링크 변환 |
| `core/builder/cardSession.ts` | ~120 | 트리+카드 정의+스캔결과+도메인 오버레이를 합성한 세션 생성 |
| `core/builder/domain-overlay.ts` | ~70 | 3계층 카드 정의 병합 (base → tree → domain) + 카드풀 재정렬 |
| `core/builder/role-resolver.ts` | ~80 | 도메인×트리×프레임워크 조합 역할 추천 |
| `core/builder/mentionParser.ts` | ~80 | `@path#L10-20` 멘션 파싱·라인 추출·언어 추론 |
| `core/builder/tokenEstimator.ts` | 12 | 한국어 2자/토큰, 영문 4자/토큰 근사 |
| `core/scanner/index.ts` | ~120 | 언어 → 프레임워크/구조 병렬 → 도메인 분류 파이프라인 |
| `core/scanner/domain-classifier.ts` | ~90 | 가중치 기반 도메인 분류 (high/medium/low confidence) |
| `web/components/ActionBar/ActionBar.tsx` | 171 | UI 컴포넌트 |
| `web/components/inputs/MentionInput.tsx` | 253 | UI 컴포넌트 |
| `web/components/TreeSelect/TreeSelect.tsx` | 190 | UI 컴포넌트 |

### 2.4 의존성 비교

| 카테고리 | preprompt | PromptCraft |
|---|---|---|
| 런타임 | `mcp>=1.0`, `anthropic>=0.40`, `pydantic-settings`, `fastapi`, `uvicorn`, `python-dotenv` (총 6개) | `express`, `better-sqlite3`, `react`, `react-dom`, `@radix-ui/*`, `@dnd-kit/*`, `commander`, `glob`, `dotenv`, `open` 등 (20+ 개) |
| 개발 | `pytest`, `pytest-asyncio`, `pytest-mock` | `vitest`/`bun test`, `vite`, `tailwindcss`, `biome`, `husky`, `commitlint`, `concurrently` 등 |
| 외부 API | Anthropic Claude API (Haiku) | 없음 |
| 빌드 | hatchling | bun + tsc + vite |

### 2.5 테스트 커버리지 비교

| 항목 | preprompt | PromptCraft |
|---|---:|---:|
| 단위 테스트 파일 | 3 | 21 |
| 통합 테스트 파일 | 1 | 6 (server/routes) |
| 벤치마크 | 없음 | `tests/scan-benchmark-runner.ts` + `scan-benchmark-smoke.test.ts` |
| 픽스처 프로젝트 | 없음 | `tests/fixtures/` (gitignore-project, sample-project, scanner/cargo-wasm 등 6 패턴) |

PromptCraft의 테스트 자산이 압도적으로 많고, 특히 스캐너 영역에 대한 픽스처와 벤치마크가 정교하다.

---

## 3. preprompt 아키텍처 핵심

### 3.1 라우팅: `pass` / `enrich` / `clarify`

`mcp_server/classifier.py:route_prompt`는 점수만 보지 않고 3-way 라우팅을 한다.

- **clarify** — 4단어 미만 + 점수 임계 이상 + 기술 명사 없음 / 또는 사전 등록된 모호 구문 (`make it better`, `fix this`) → 메타 질문 1개 반환
- **enrich** — 점수 ≥ 38 → Haiku로 재작성
- **pass** — 그 외 → 원본 그대로

이는 **"바로 답하지 말고 한 번 되묻는다"** 라는 단계를 시스템에 강제로 넣은 것이다. 단순한 "최적화 / 미최적화" 이진 분기보다 정교하다.

### 3.2 분류기 점수 가중치 (skill.md 기준)

```
+ 모호 동사 ("handle", "manage", "improve", "refactor", "clean up"): +8/회, 최대 +25
+ 다중 요건 ("X and also Y and handle Z"): +12/추가 요건, 최대 +30
+ 깊은 대화 턴 (turn > 2): +5/턴, 최대 +15
+ 코드 작업인데 출력 형식 힌트 없음:                   +15
- 짧은 프롬프트 (< 8단어):                            -20
- 룩업 질문 ("what is/are/does"):                    -15
- 이미 구조화 (번호 목록·코드블록):                    -15
- 캐주얼 오프너 ("hey", "can you", "please"):         -25
임계: 38
```

### 3.3 옵티마이저의 하드 제약 (시스템 프롬프트 발췌)

```
1. 작업 범위를 확장하지 말 것 ("fix the bug" → "refactor the system" 금지)
2. 요청되지 않은 기능/라이브러리/아키텍처 변경 금지
3. 작업 종류를 바꾸지 말 것 (fix는 fix로, question은 question으로)
4. history나 stack memory에 없는 파일/컴포넌트/프레임워크를 가정 금지
5. 버그 수정 프롬프트는 기본적으로 "smallest safe fix" 제약 추가
6. 버그 수정 프롬프트는 "do not change unrelated files" 제약 추가
```

이 제약은 LLM 기반 자동 재작성의 가장 큰 위험인 "스코프 폭주" 와 "의도 왜곡" 을 명시적으로 차단한다. PromptCraft가 향후 LLM 재작성 기능을 도입한다면 이 제약 사전을 그대로 차용해도 좋다.

### 3.4 스택 메모리 학습

`storage/db.py:upsert_stack_memory`는 동일 키·값에 대해 confidence 를 점진적 증가(`+0.03`, 상한 `0.99`)시키고, 키 일치하나 값 다를 때는 `0.6`으로 리셋한다. 이는 사용자 환경 변화(예: Vue → React 이주)에 점진적으로 적응한다.

스키마 (3개 테이블):
```sql
prompt_history(id, timestamp, original, optimized, score, was_intercepted, turn, session_id, user_kept)
stack_memory(id, updated_at, key UNIQUE, value, confidence REAL, source_count)
sessions(session_id, started_at, last_seen_at, hostname, pid)
```

### 3.5 Claude Code 통합 방식

`.claude/settings.json` 에 `UserPromptSubmit` 훅 한 줄로 모든 프롬프트를 가로챈다.

```json
{
  "mcpServers": { "preprompt": { "command": "python", "args": ["-m", "mcp_server.server"] } },
  "hooks": {
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "python .claude/hooks/pre_prompt.py" }] }]
  }
}
```

훅 자체는 250 LOC이며 stdin으로 들어온 프롬프트를 읽고, 분류·옵티마이즈 후 stdout으로 다시 내보낸다.

### 3.6 풍부한 CLI

`pyproject.toml`의 `[project.scripts]` 항목으로 9개의 별도 진입점을 노출한다.

```
preprompt                    MCP 서버
preprompt-install            대화형 셋업 (API 키 + 훅)
preprompt-history            세션·전체 히스토리
preprompt-stats              누적 통계 (총량/가로채기/평균 점수)
preprompt-memory             학습된 스택 표시
preprompt-test-classifier    벤치마크 6개 프롬프트 실행
preprompt-feedback           최근 최적화 평가 → user_kept 컬럼
preprompt-watch              tail -f 형태 실시간 피드
preprompt-clip               OS 클립보드 → 최적화 → OS 클립보드
preprompt-optimize "..."     단발 최적화
```

### 3.7 우회용 스킬 마크다운

`preprompt.skill.md`는 MCP 미지원 환경(ChatGPT, Gemini, Zed without MCP)에서 사람이 직접 룰을 적용하도록 설계된 단일 파일이다. **"코어 알고리즘을 LLM-readable 자연어로 외부화"** 한 패턴이 인상적이다.

---

## 4. PromptCraft 아키텍처 핵심 (대조)

### 4.1 카드·트리·도메인 3계층 합성

```
카드 정의 (card-definitions.json, base)
   ▼  applyDomainOverrides
트리 오버라이드 (data/trees/<tree>.json#cardOverrides, 트리별)
   ▼
도메인 오버레이 (data/domains/<domain>.json#cardOverrides, 도메인별, 최우선)
   ▼  reorderCardPool (cardRelevance high/medium/low)
세션 카드 (active + pool)
```

이 합성은 모두 **순수 함수**이며 LLM 호출이 없다. 사용자가 트리(기능 구현/리팩터링/오류 해결/코드 리뷰/개념 학습)를 선택하면 즉시 도메인 인지된 폼이 생성된다.

### 4.2 가중치 기반 도메인 분류

`scanner/domain-classifier.ts`는 프레임워크별 `weight` 합계를 도메인별로 누적하고, 1.0/0.5 임계로 high/medium/low confidence를 부여한다. 두 도메인이 0.5 이상 비율로 근접하면 secondary까지 함께 노출한다. preprompt의 `_TECH_KEYWORDS` 단순 매핑보다 정교한 신호 처리이다.

### 4.3 멘션 파서

```
@src/foo/bar.ts        → [@bar.ts](@src/foo/bar.ts)
@src/foo/bar.ts#L10-20 → [@bar.ts#L10-20](@src/foo/bar.ts#L10-20)
@"path with spaces"    → 따옴표 경로 지원
```

서버 측에서 멘션을 파싱해 실제 파일 라인 범위까지 첨부한다. preprompt에는 없는 기능이다.

### 4.4 토큰 추정

한국어 2자/토큰, 영문 4자/토큰 근사식. preprompt는 토큰 측정 자체가 없다.

---

## 5. PromptCraft가 참고할 만한 부분 (우선순위 순)

### 5.1 Quality Gate — 3갈래 도입 전략 (사용자 검토 결과 반영, 2026-05-12)

**배경 — 단일 휴리스틱 도입은 부적절하다는 결정**

초안에서는 preprompt의 휴리스틱 점수화 모델을 그대로 도입하는 안을 ★★★ 즉시 도입으로 권고했으나, 사용자 검토 결과 다음 두 가지 이유로 단일 휴리스틱 도입은 부적절함을 확인:

1. PromptCraft는 카드별로 입력이 분리된 정형 입력 시스템이고, preprompt는 자연어 한 줄을 받는 비정형 입력 시스템이다. 컨텍스트가 달라 같은 알고리즘을 그대로 옮기기 어렵다.
2. preprompt의 모호 동사 사전은 영문 substring match 기반이라 한국어 어미·존댓말 변형에서 노이즈가 크다.

대신 다음 3갈래 전략으로 분기하여 도입한다.

#### 5.1-A ★★★ 객관적 완성도 체크리스트 (즉시 도입)

**무엇을** — 점수가 아닌 **결정론적 사실 기반 체크리스트**. 사용자가 "프롬프트 생성" 시 다음 항목을 신호등(녹/노/적)으로 표시:

| 측정 | 신호 | 임계 |
|---|---|---|
| 필수 카드(트리의 `defaultActiveCards`) 채움 비율 | objective | 100% 미만 = 노란불, 50% 미만 = 빨간불 |
| 각 활성 카드 최소 길이 | objective | 카드별 권장 길이의 50% 미만 |
| placeholder 잔존 (`_입력 대기 중_`) | objective | 1건이라도 있으면 알림 |
| 멘션(`@경로`) 사용 횟수 | objective | `target-code`/`related-code` 카드에서 0건이면 노란불 |
| 토큰 추정 분포 | objective | 50토큰 미만 = 빨간불 |

**왜** — 객관적 사실은 사용자가 즉시 이해할 수 있다("이 카드가 비었어서 빨간색"). 휴리스틱 점수처럼 "왜 이번엔 65점인지" 설명할 필요가 없다. PromptCraft의 결정론적 도구 정체성과 정합한다.

**어떻게** — `core/builder/qualityChecklist.ts` 신설:
```ts
export interface QualityChecklist {
  level: 'red' | 'yellow' | 'green';
  items: Array<{
    id: string;        // 'required-cards', 'min-length', etc.
    pass: boolean;
    detail: string;    // 'goal 카드가 비어있습니다'
  }>;
}
export function checkQuality(cards: SectionCard[], tree: TreeConfig): QualityChecklist;
```
- ActionBar의 "프롬프트 생성" 버튼 옆에 신호등 배지
- 빨간불에서 클릭 시 확인 다이얼로그 ("핵심 카드 2개가 비어있습니다. 그래도 진행하시겠습니까?")

#### 5.1-B ★★★ 임베딩 기반 examples 유사도 평가 (즉시 도입)

**무엇을** — `card-definitions.json` 의 각 카드 `examples` 배열은 이미 큐레이션된 양질의 예시이다. 사용자가 입력한 카드 값과 그 카드의 examples 간 **코사인 유사도**를 측정하여, 임계 미만이면 "이 카드는 일반적인 좋은 예시와 거리가 큽니다" 라고 안내.

**왜** — 휴리스틱이 못 잡는 의미론적 신호를 잡으면서도, 생성형 LLM의 환각·비결정성·지연 문제가 없다. 임베딩 모델은 단일 forward pass라 CPU에서 30~50ms로 인터랙티브 가능. PromptCraft가 이미 갖고 있는 examples 자산을 재활용한다.

**어떻게** — `core/builder/exampleSimilarity.ts` 신설:
- 모델 후보: `multilingual-e5-small` (~470MB), `BGE-M3-small` (~500MB) — 100+ 언어 지원
- 통합 라이브러리: `@huggingface/transformers` (전 transformers.js, Bun 호환)
- 빌드 타임에 모든 카드의 examples 임베딩을 사전 계산 → JSON으로 dist에 포함
- 런타임은 사용자 입력만 임베딩 (CPU 30~50ms) → 사전 계산된 벡터와 코사인 유사도
- 임계: 평균 유사도 < 0.4 → 노란불 신호

**리스크와 한계**
- 첫 실행 시 모델 다운로드 470MB (Ollama 류 별도 설치는 불필요, transformers.js 가 자동 처리)
- 디스크 캐시는 `~/.promptcraft/models/` 에 저장
- 환각 없음, 결정론적 (양자화 차이 외)

#### 5.1-C ★★ 로컬 LLM HTTP API 평가 (검증 후 도입)

**무엇을** — 사용자가 Ollama / LM Studio / vLLM 중 하나를 별도 실행 중일 때, 환경 설정에서 엔드포인트 URL과 모델명을 입력하면 **자연어 피드백** 평가 활성화. 한 번 클릭으로 다중 카드 정합성을 평가하고 "어떤 카드를 어떻게 보강하면 좋을지" 자연어로 안내.

**왜** — 5.1-A·B로 잡히지 않는 **다중 카드 의미 정합성**(예: `goal`과 `acceptance-criteria`의 정합, `target-code`와 `modification-scope`의 일관성)은 결정론적 룰이나 단일 임베딩으로 잡기 어렵다. Gemma 4 4B 같은 한국어 우수 모델이 등장하여 이런 주관 태스크의 가성비가 개선되고 있다.

**왜 PromptCraft 측 부담이 작은가** — 모든 백엔드(Ollama/LM Studio/vLLM)가 OpenAI-compatible HTTP API를 제공한다. PromptCraft는 `fetch` 만 사용하면 되며, GGUF 로딩·양자화·메모리 관리는 전부 백엔드가 담당한다. 통합 코드는 100 LOC 미만으로 추정.

**Phase 0 — 검증 단계 (도입 전 필수)**

이 경로는 본질적으로 비결정론적이고 LLM이 "자신감 있게 틀리는" 위험이 있다. 따라서 도입 전 검증 벤치마크를 먼저 통과해야 한다:

```
scripts/llm-scoring-benchmark.ts
  - 사전 큐레이션된 20개 카드 세션 (좋은 예 10 + 나쁜 예 10)
  - Ollama 엔드포인트로 대상 모델 호출, 각 세션을 5회 반복 평가
  - 측정 지표:
    a) 인간 평가와의 상관계수 (Spearman ρ ≥ 0.6)
    b) 동일 입력 5회 반복 시 점수 표준편차 (σ ≤ 5점)
    c) 평균 응답 시간 (≤ 5초, 사용자 하드웨어 베이스라인 명시)
  - 통과 → 5.1-C 도입, 미통과 → 5.1-A·B 만으로 운영
```

**도입 시 가드레일**
- 기본 OFF — 사용자가 환경 설정에서 명시적으로 활성화
- 평가는 "프롬프트 생성" 버튼 클릭 시 1회 (실시간 키스트로크 평가 안 함)
- 결과는 신호등이 아닌 **자연어 제안 + 수용/거부 버튼** 형태 (점수 노출 안 함, 비결정성 가시화 회피)
- 옵티마이저의 하드 제약 6개(스코프 폭주 금지 등, 보고서 3.3 참조) 시스템 프롬프트에 강제 포함

**참고 파일**: `temp/preprompt/mcp_server/classifier.py:1-241`, `temp/preprompt/mcp_server/optimizer.py:1-114`

### 5.2 ★★★ Stack Memory (세션 간 학습)

**무엇을** — 사용자가 채운 `role`, `tech-preference`, `stack-environment` 값을 `~/.promptcraft/`의 SQLite에 confidence와 함께 누적하고, 다음 세션에서 자동 채우거나 추천 상위로 띄움.

**왜** — 현재는 매번 스캔 결과만 prefill 한다. 사용자가 매번 "Bun 1.3.10 환경, biome 단일 인용", "한국어 응답 선호" 같은 같은 컨텍스트를 다시 입력해야 한다.

**어떻게** — `core/db/repositories/stackMemory.ts` 신설:
```sql
CREATE TABLE stack_memory (
  key          TEXT PRIMARY KEY,   -- e.g. 'preferred_role', 'response_lang'
  value        TEXT,
  confidence   REAL,                -- 0.0 ~ 0.99
  source_count INTEGER,
  updated_at   TEXT
);
```
- preprompt의 갱신 알고리즘 그대로(`+0.03/회`, 상한 `0.99`, 값 변경 시 `0.6` 리셋) 도입
- `cardSession.createCardSession`에 stackMemory를 주입하여 prefill 우선순위:
  `prefill > stackMemory(confidence ≥ 0.7) > scanResult > defaultValue`

**참고 파일**: `temp/preprompt/storage/db.py:upsert_stack_memory`, `temp/preprompt/mcp_server/extractor.py`

### 5.3 ★★ Optimizer 하드 제약 사전화

**무엇을** — preprompt 옵티마이저의 6개 하드 제약을 그대로 PromptCraft 카드 시스템에 매핑된 **검증 룰**로 전환.

**왜** — PromptCraft는 LLM을 호출하진 않지만, 사용자가 자유 입력을 제공하므로 동일한 함정(스코프 폭주, 의도 왜곡, 가정된 파일명)이 발생한다.

**어떻게** — `core/builder/promptValidator.ts` 신설:
- `goal` 카드 값에 "refactor + bug fix" 가 동시에 들어가면 경고
- `target-code` 카드와 `modification-scope` 카드의 정합성 검사 (예: target은 한 파일인데 scope가 "전체 모듈"이면 알림)
- "smallest safe fix" 같은 카드 템플릿 자체에 **기본 제약 문구를 미리 박아두기** (`error-solving` 트리의 카드 hint 보강)

**참고 파일**: `temp/preprompt/mcp_server/optimizer.py:_SYSTEM`

### 5.4 ★★ "Clarify" 라우팅: 사전 질문 카드

**무엇을** — 사용자가 시작할 때 매우 짧은 한 줄 입력(예: "성능 개선해줘")만 했을 경우, **카드를 채우라고 강요하기 전에 1~2개의 메타 질문**을 먼저 띄움.

**왜** — 현재 PromptCraft는 트리 선택 → 풀 카드 폼 노출이라 신규 사용자에게 진입 장벽이 있다. preprompt의 `clarify` 라우팅처럼 짧은 질문으로 시작점을 고를 수 있게 한다.

**어떻게** — TopBar에 "한 줄로 상황을 적어보세요" 입력란 + 매핑 룰:
- `_VAGUE_ACTION_VERBS` 만 있고 명사 없음 → "어느 영역(UI/성능/품질/보안/접근성)을 개선?" 옵션 4개
- 매핑 결과로 트리 자동 선택 + 첫 카드 prefill

**참고 파일**: `temp/preprompt/mcp_server/tools.py:_CLARIFY_TEMPLATES`, `mcp_server/classifier.py:_check_clarify`

### 5.5 ★★ `promptcraft-watch` 풍 라이브 피드 + 스탯 CLI

**무엇을** — `promptcraft history`, `promptcraft stats`, `promptcraft watch` 서브커맨드를 추가해 GUI 없이도 워크플로 관찰 가능.

**왜** — 현재 CLI는 `serve` 한 개뿐이다. `~/.promptcraft/` 의 SQLite를 이미 갖고 있으므로 추가 비용 거의 0. 사용자가 "지난 일주일 동안 어떤 트리를 가장 많이 썼지?" 같은 메타 분석을 할 수 있다.

**어떻게** — `src/cli/commands/{history,stats,watch}.ts` 추가:
```
promptcraft history --limit 20            최근 20건
promptcraft stats                         트리별/도메인별 사용 빈도, 평균 토큰, 평균 카드 수
promptcraft watch                         tail -f 형태 (개발 중 다른 창에서)
```

**참고 파일**: `temp/preprompt/cli/commands.py:1-656`, `temp/preprompt/cli/watch.py`

### 5.6 ★★ "Skill 마크다운" 외부화 패턴

**무엇을** — PromptCraft 룰셋 (카드 정의, 트리 → 도메인 매핑, 점수화)을 **단일 마크다운 스킬 파일**로 export 해, MCP 미지원 환경에서도 LLM이 따라 할 수 있게 함.

**왜** — 현재 PromptCraft는 로컬 GUI에 락인되어 있다. ChatGPT 사용자에게도 "이 스킬을 컨텍스트에 붙여넣으면 같은 흐름을 흉내낼 수 있다" 라는 진입로를 제공하면 도구의 영향력이 확대된다.

**어떻게** — `bun scripts/export-skill.ts` 추가:
- `data/cards/card-definitions.json`, `data/trees/*.json`, `data/domains/*.json`을 합성
- 출력: `dist/promptcraft.skill.md` (Claude Skill 포맷)
- `bun run build` 파이프라인에 합류

**참고 파일**: `temp/preprompt/preprompt.skill.md` (50줄, 매우 컴팩트)

### 5.7 ★ Feedback 루프 (`user_kept` 컬럼)

**무엇을** — 프롬프트 생성 후 사용자가 "이 프롬프트 그대로 사용함" / "수정 후 사용함" / "버림" 을 1-탭으로 기록.

**왜** — 향후 카드 정의·도메인 룰 개선의 정량적 근거가 됨. preprompt도 v0.1.8에서 `prompt_history` 테이블에 `user_kept INTEGER` 컬럼을 ALTER TABLE로 추가했다.

**어떻게** — `history` 테이블에 `kept INTEGER DEFAULT NULL` 컬럼 추가, `PromptPreview`에 👍/👎 버튼.

**참고 파일**: `temp/preprompt/storage/db.py:_ensure_schema` (ALTER TABLE 패턴)

### 5.8 ★ Test Classifier 형태의 골든셋

**무엇을** — `bun run test:prompts` — 6~10개의 대표 프롬프트(좋은 예/나쁜 예)를 입력해 PromptCraft가 어떤 트리·도메인·역할·카드를 추천하는지 표로 출력.

**왜** — 현재 단위 테스트는 함수 단위지만, 사용자가 보는 "전체 흐름의 품질"을 측정하지 않는다.

**어떻게** — `tests/golden-prompts.test.ts` 신설:
```ts
const fixtures = [
  { input: 'React 컴포넌트 리팩터링', expectedTree: 'refactoring', expectedDomain: 'web-frontend' },
  { input: 'FastAPI에 OAuth 추가', expectedTree: 'feature-impl', expectedDomain: 'web-backend' },
  ...
];
```

**참고 파일**: `temp/preprompt/cli/commands.py:test_classifier_cmd`

### 5.9 (참고만) Anthropic Haiku 옵셔널 통합

**무엇을** — 사용자가 ANTHROPIC_API_KEY를 설정한 경우에 한해, "프롬프트 다듬기" 버튼이 활성화되어 빌드된 마크다운을 Haiku로 한 번 더 다듬는 옵션.

**판단** — PromptCraft의 "LLM 비용 제로" 가치명제와 충돌하므로 **기본 OFF + 명시적 활성화 필수**. 도입한다면 옵티마이저의 하드 제약 6개를 그대로 사용해야 함. 5.1-C(로컬 LLM HTTP) 가 먼저 도입되면 클라우드 경로는 같은 인터페이스로 추가만 하면 되므로 별도 항목으로 다루지 않아도 됨.

**참고 파일**: `temp/preprompt/mcp_server/optimizer.py`

---

## 6. preprompt에서 *참고하지 말아야 할* 부분

| 항목 | 이유 |
|---|---|
| `backend/main.py` (FastAPI Railway 배포) | preprompt가 자체 SaaS 백엔드를 두는 구조 — PromptCraft의 "로컬 설치형" 가치명제와 정면 충돌 |
| `dashboard/server.py` + 정적 HTML | PromptCraft는 이미 풀 React SPA가 있어 중복 |
| 스택 시그널 사전이 영문 코드 키워드 위주 | 한국어/다국어 환경 고려 부족. PromptCraft의 가중치 기반 프레임워크 분류가 더 견고함 |
| `cli/commands.py` 단일 파일 656 LOC | 단일 파일 비대화. PromptCraft는 `src/cli/commands/<cmd>.ts` 분리 패턴이 이미 더 깔끔 |
| Ruff/black 미사용, 타입 힌트 부분적 | PromptCraft의 biome+TypeScript 엄격 모드가 더 우수한 품질 게이트 |

---

## 7. 두 프로젝트 합산 시너지 시나리오

```
[입력] 사용자가 "새 기능 추가하고 싶어" 라고 ChatGPT/Cursor에 입력
   │
   ▼ preprompt 가 가로챔 (turn 1, 짧음 + 모호)
   │  → clarify 라우팅 → "어떤 기능? 어느 영역?" 질문
   │
   ▼ 사용자가 "FastAPI에 JWT 인증 추가" 답변
   │
   ▼ preprompt 가 enrich 라우팅 → Haiku 재작성
   │
   ▼ ─── 여기서 PromptCraft 가 인계 받는다 ───
   │
   ▼ promptcraft serve 실행
   │  - 스캐너가 FastAPI/Python 감지 → web-backend 도메인
   │  - feature-impl 트리 자동 추천
   │  - role 옵션에 "FastAPI 백엔드 엔지니어" 등 추천
   │  - 카드 prefill: stack-environment = "Python 3.11, FastAPI 0.110, uvicorn"
   │
   ▼ 사용자가 acceptance-criteria, target-code 멘션 추가
   │
   ▼ buildPrompt → 풍부한 마크다운 출력 → 다시 LLM에 입력
```

이 시나리오에서 preprompt는 **저비용 진입점**(짧은 자연어 → 구조화), PromptCraft는 **고품질 빌더**(구조화 → 풍부한 컨텍스트 부착) 역할로 깔끔히 분담된다. 두 도구를 모두 설치한 사용자에게 가치가 곱셈으로 늘어난다.

---

## 8. 결론

### 8.1 정량 결론

PromptCraft는 preprompt 대비:
- **소스 코드 약 2.2배** (TS 6,249 LOC vs Py 약 2,800 LOC)
- **테스트 9배** (27개 vs 3개)
- **외부화된 데이터 자산 41개 vs 0개**
- **PRD/스펙 문서 9개 vs 0개**
- **외부 API 의존성 0개 vs 1개 (Anthropic)**

규모·테스트·문서화·결정론적 설계 측면에서 PromptCraft가 **더 성숙한 엔지니어링** 을 보여준다.

### 8.2 정성 결론

preprompt가 PromptCraft 대비 우수한 영역:
1. **점수화된 품질 게이트** — 결정론 룰로 "이 프롬프트는 부족하다"를 정량화
2. **세션 간 학습** — confidence 기반 stack memory
3. **풍부한 CLI/관찰 도구** — watch/stats/history/feedback 등 9개 진입점
4. **단일 스킬 마크다운으로 외부화** — 도구 미설치 환경에서도 룰 활용 가능
5. **명시적 안전 제약 사전** — LLM 재작성의 스코프 폭주 방지

위 5가지는 모두 PromptCraft의 "로컬 설치형, LLM 무비용" 철학과 충돌하지 않으며 단계적으로 흡수 가능하다. 5.1·5.2·5.5를 우선 도입하면 가장 큰 사용자 가치 향상이 예상된다.

### 8.3 도입 우선순위 요약 (사용자 검토 반영, 2026-05-12)

| 우선순위 | 항목 | 예상 변경 규모 | 사용자 가치 |
|---|---|---|---|
| 즉시 | **5.1-A** 객관적 완성도 체크리스트 | 신규 파일 1, UI 신호등 1 | 높음 |
| 즉시 | **5.1-B** 임베딩 기반 examples 유사도 | 신규 파일 1, 모델 470MB 자동 다운로드 | 높음 |
| 즉시 | 5.2 Stack Memory | 신규 테이블 1, repository 1 | 높음 |
| 단기 | 5.5 CLI watch/stats/history | 신규 파일 3 | 중간 |
| 중기 | 5.4 Clarify 사전 질문 | UI 신규 컴포넌트 1 | 중간 |
| 중기 | 5.6 Skill 마크다운 export | 신규 스크립트 1 | 중간 (전파력) |
| 중기 | 5.7 Feedback 루프 | 컬럼 1, UI 버튼 1 | 데이터 수집 |
| 검증 후 | **5.1-C** 로컬 LLM HTTP API 평가 | 신규 파일 1 (~100 LOC) + 벤치마크 스크립트 | 검증 결과에 따라 가변 |
| 장기 | 5.8 골든 프롬프트 셋 | 신규 테스트 1 | 회귀 방지 |
| 흡수 | 5.9 클라우드 LLM 통합 | 5.1-C와 동일 인터페이스로 흡수 | 분기점 |

---

## 부록 A: preprompt 디렉토리 구조

```
preprompt/
├── .claude/hooks/pre_prompt.py         # UserPromptSubmit 훅 (250 LOC)
├── .claude/settings.json               # MCP+훅 등록
├── mcp_server/
│   ├── classifier.py                   # 휴리스틱 점수화·라우팅 (241 LOC)
│   ├── optimizer.py                    # Haiku 호출 + 시스템 프롬프트
│   ├── extractor.py                    # 스택 시그널 추출
│   ├── tools.py                        # FastMCP 도구 등록
│   ├── server.py                       # stdio/SSE 트랜스포트
│   └── config.py                       # pydantic-settings
├── storage/db.py                       # SQLite (3 테이블)
├── cli/
│   ├── commands.py                     # 9개 서브커맨드 (656 LOC)
│   ├── watch.py                        # tail -f
│   ├── setup.py                        # 대화형 셋업
│   └── hook.py
├── backend/main.py                     # FastAPI (Railway)
├── dashboard/server.py + static/       # 정적 HTML 대시보드
├── scripts/                            # install_cursor/windsurf/zed
├── tests/                              # 3개 파일
├── preprompt.skill.md                  # MCP 미지원 환경용 스킬
├── pyproject.toml                      # hatchling, MIT, v0.1.8
└── README.md                           # 7.1KB
```

## 부록 B: 분석에 사용된 명령

```bash
git clone https://github.com/yashdeeptehlan/preprompt temp/preprompt
find temp/preprompt -type f -not -path '*/.git/*' | wc -l
find . -type f -name '*.ts' -o -name '*.tsx' | xargs wc -l
find . -name 'test_*.py'   # preprompt
find tests -name '*.test.ts' # PromptCraft
```

## 부록 C: 참조 파일 인덱스

**preprompt 측**
- `temp/preprompt/mcp_server/classifier.py:1-241` — 점수화 알고리즘
- `temp/preprompt/mcp_server/optimizer.py:1-114` — 시스템 프롬프트 + 하드 제약
- `temp/preprompt/mcp_server/extractor.py:1-110` — 스택 시그널 사전
- `temp/preprompt/storage/db.py:1-421` — SQLite 스키마 및 stack memory 갱신 알고리즘
- `temp/preprompt/cli/commands.py:1-656` — 9개 CLI 진입점
- `temp/preprompt/preprompt.skill.md` — 스킬 외부화 예시

**PromptCraft 측 (대조)**
- `src/core/builder/promptBuilder.ts:1-58` — 카드 → 마크다운 조립
- `src/core/builder/cardSession.ts:1-120` — 트리×도메인 합성
- `src/core/builder/domain-overlay.ts:1-70` — 3계층 병합
- `src/core/builder/role-resolver.ts:1-80` — 적응형 역할 추천
- `src/core/scanner/domain-classifier.ts:1-90` — 가중치 기반 도메인 분류
- `src/core/db/repositories/history.ts` — 히스토리 저장소 (참고: stack_memory는 신설 필요)

---

## 재평가 결론 (2026-06-03)

**재평가 기준**: preprompt **v0.1.9**(원 분석본 v0.1.8) vs PromptCraft 현행 master.
**도입할 항목: 0건.** 이 문서는 소임을 다했으며 재탐색 불필요.

### preprompt v0.1.9 델타

v0.1.8→v0.1.9의 23개 커밋 전수 확인 결과 변경은 **전부 상업화/SaaS/마케팅**(demo 백엔드·Railway·SEO·블로그·Supabase 인증·가격·Stripe 결제·웹훅). **코어 엔진(`classifier.py`·`optimizer.py`·`extractor.py`·`storage/db.py`·`cli/`·`skill.md`) diff 0.** 신규 알고리즘 없음. 신규 방향(호스팅 백엔드·결제·인증)은 §6 "참고 금지"의 SaaS 노선 강화 — 로컬 설치형 가치명제와 충돌. **재참고 가치 없음.**

### 항목별 종결 상태

| 항목 | 상태 | 근거 |
|---|---|---|
| 5.1-A 완성도 체크리스트 | **구현 후 비차단 격하** | `structuralScore.ts`+`/api/prompt/structural`. 차단 게이트는 false negative(4카드=48<50 항상 "부족")로 폐기 → 비차단 안내(refine-redefine ADR #2). 차단 신호등 재권고 금지 |
| 5.1-B 임베딩 유사도 | **도입 거부** | "품질 판단은 LLM 일임, 휴리스틱은 보조만" 확정 방향과 배치 + 470MB ML 의존이 경량 로컬 정체성과 충돌. 의미론 판단은 옵션 LLM refine이 담당 |
| 5.1-C 로컬 LLM HTTP | **완료** | P2-10 refine: OpenAI 호환·`openai` SDK·기본 OFF(409)·사용자 트리거·코어 LLM-zero(KPI #6)·409/422/503 분기 |
| 5.9 클라우드 LLM | **완료(흡수)** | 동일 OpenAI 호환 클라이언트에 baseURL+apiKey |
| 5.2 Stack Memory | **보류(낮음)** | preprompt 학습 이유는 스캔 부재. PromptCraft는 결정론적 스캔+`findLatestByTree`로 동기 대부분 소멸. 현재 감산 국면 |
| 5.3 Optimizer 하드 제약 | **도입 불필요** | 정형 입력+트리가 작업종류 고정+"의도/정보 보존"이 이미 차단. 무관파일/smallest-fix는 사용자가 카드로 통제할 다운스트림 지시문이라 자동 주입 시 과잉 제약 |
| 5.4 Clarify 라우팅 | **도입 거부** | P1-15(empty cue) 취소. 질문 행동 교정은 hint/examples로 구현됨. 한국어 substring 매핑은 문서 자신이 노이즈로 지적 |
| 5.5 CLI watch/stats | **생략** | CLI 의도적 최소(`serve`). 토큰/usage 계측은 KPI #3과 함께 삭제(비결정·비인과) |
| 5.6 Skill MD export | **도입 거부** | 스캔+카드 인터랙티브 UX는 마크다운 blob으로 이식 불가 — 별개 제품 표면 |
| 5.7 Feedback(user_kept) | **보류** | refine ADR이 accept/reject 피드백을 LoRA v2 검토 시점으로 이미 연기 |
| 5.8 골든 프롬프트셋 | **한계효용 낮음** | `domain-classifier.weight`·`role-resolver.trees` 테스트+스캐너 픽스처가 사실상 커버. 현 UX는 사용자가 트리 선택 → "입력→expectedTree" 골든셋과 흐름 불일치 |

**요약**: 구현 완료(5.1-A 비차단·5.1-C·5.9) / 프로젝트가 ADR로 거부(5.1-A 차단·5.1-B·5.4) / 가치명제 충돌(5.5·5.6) / 맥락상 중복·무의미(5.3) / 한계효용 낮음(5.2·5.7·5.8).
