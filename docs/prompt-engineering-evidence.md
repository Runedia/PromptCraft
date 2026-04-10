# 프롬프트 엔지니어링 근거 문서

**PromptCraft 카드 설계의 학술적 기반**

---

## 0. 문서 개요

### 목적

이 문서는 PromptCraft의 카드 기반 프롬프트 빌더가 채택한 각 카드와 워크플로우 설계의 **학술적·실증적 근거**를 명시한다. 25개의 카드와 4개의 워크플로우 트리가 임의로 구성된 것이 아니라, 주요 AI 벤더 3사의 공식 프롬프트 엔지니어링 지침과 동료 심사(peer-reviewed) 연구 논문에서 수렴하는 원칙을 구현한 것임을 보인다.

### 범위

- 카드 25개 (`data/cards/card-definitions.json`)
- 워크플로우 트리 4종: `error-solving`, `feature-impl`, `code-review`, `concept-learn`

### 읽는 방법

이 문서는 **카드별이 아닌 원칙별**로 구성되어 있다. 이 선택은 의도적이다 — 카드가 원칙에서 도출된 것이지, 원칙이 카드를 정당화하기 위해 소급 적용된 것이 아님을 보이기 위함이다. 특정 카드의 근거를 찾고자 한다면 **Section 4의 카드-원칙 역매핑 테이블**을 참조하라.

---

## 1. 근거 출처 목록

### 1.1 AI 벤더 공식 문서

| 벤더 | 문서명 | URL |
|------|--------|-----|
| Anthropic | Claude Prompting Best Practices | https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| OpenAI | Prompt Engineering Guide | https://platform.openai.com/docs/guides/prompt-engineering |
| OpenAI | Prompt Guidance for GPT-5.4 | https://platform.openai.com/docs/guides/prompt-guidance |
| Google | Gemini API Prompt Design Strategies | https://ai.google.dev/gemini-api/docs/prompting-strategies |

세 문서 모두 2024–2025년 기준 최신 모델(Claude 4, GPT-5, Gemini 3)에 대한 공식 가이드로서, 본 문서 작성 시점에 직접 접근하여 내용을 확인하였다.

### 1.2 연구 논문

| 저자 | 연도 | 제목 | 출처 |
|------|------|------|------|
| Brown et al. | 2020 | Language Models are Few-Shot Learners | NeurIPS 2020, arXiv:2005.14165 |
| Wei et al. | 2022 | Chain-of-Thought Prompting Elicits Reasoning in Large Language Models | NeurIPS 2022, arXiv:2201.11903 |
| Kojima et al. | 2022 | Large Language Models are Zero-Shot Reasoners | NeurIPS 2022, arXiv:2205.11916 |
| Wang et al. | 2022 | Self-Consistency Improves Chain of Thought Reasoning in Language Models | ICLR 2023, arXiv:2203.11171 |
| White et al. | 2023 | A Prompt Pattern Catalog to Enhance Prompt Engineering with ChatGPT | arXiv:2302.11382 |

### 1.3 커뮤니티 프레임워크

| 프레임워크 | 구성 요소 | 설명 |
|-----------|-----------|------|
| COSTAR | Context, Objective, Style, Tone, Audience, Response | 구조화된 프롬프트 작성을 위한 6요소 프레임워크. 여러 프롬프트 엔지니어링 커뮤니티에서 널리 채택됨. |

---

## 2. 크로스 벤더 수렴 원칙

아래 표는 세 AI 벤더가 공통적으로 권장하는 프롬프트 엔지니어링 원칙을 정리한 것이다. **세 기관이 독립적으로 동일한 결론에 도달**했다는 사실이 각 원칙의 신뢰성을 높인다.

| 원칙 | Anthropic | OpenAI | Google | 연구 근거 |
|------|-----------|--------|--------|-----------|
| **P1. Persona 설정** | "Give Claude a role — Setting a role in the system prompt focuses Claude's behavior and tone" | Identity 섹션을 developer message의 첫 번째 구성 요소로 권장 | "Place role definitions (persona) in the System Instruction or at the very beginning" | White et al. (2023) Persona Pattern |
| **P2. 명확한 목표 진술** | "Be clear and direct — Claude responds well to clear, explicit instructions" | "Write clear instructions — these models can't read your mind" | "Be precise and direct: State your goal clearly and concisely" | COSTAR: Objective |
| **P3. 구조화된 컨텍스트 제공** | "Structure prompts with XML tags — helps Claude parse complex prompts unambiguously" | Message formatting: Identity → Instructions → Examples → Context 권장 구조 | "Use consistent structure — employ clear delimiters to separate different parts" | COSTAR: Context; White et al. (2023) Context Manager Pattern |
| **P4. Few-Shot 예시 제공** | "Examples are one of the most reliable ways to steer Claude's output format, tone, and structure" | "Few-shot learning lets you steer a large language model toward a new task by including a handful of input/output examples" | "Models like Gemini can often pick up on patterns using a few examples" | Brown et al. (2020) |
| **P5. 출력 형식 지정** | "Be specific about the desired output format and constraints" | Structured Outputs 기능 및 명시적 포맷 지정 권장 | "Define parameters explicitly", output format requirements를 System Instruction에 포함 | COSTAR: Response; White et al. (2023) Template Pattern |
| **P6. 제약 조건 명시** | "Provide instructions as sequential steps using numbered lists or bullet points when the order or completeness of steps matters" | "Lock research and citations to retrieved evidence" (grounding) | "Define parameters: Explicitly explain any ambiguous terms or parameters" | COSTAR: Style, Tone, Audience |
| **P7. 작업 분해** | 프롬프트 체이닝 및 단계별 사고 유도 권장 | "Reasoning models generate an internal chain of thought to analyze the input prompt" | "Break down prompts into components — break down instructions, chain prompts, aggregate responses" | Wei et al. (2022), Kojima et al. (2022), Wang et al. (2022) |

---

## 3. 원칙별 상세 분석

### 3.1 P1 — Persona 설정 (Persona Assignment)

#### 정의

모델에게 특정 역할이나 정체성을 부여하여 응답의 전문성, 어조, 접근 방식을 조율하는 기법.

#### 벤더 공식 근거

**Anthropic** — Claude Prompting Best Practices:
> "Give Claude a role — Setting a role in the system prompt focuses Claude's behavior and tone for your use case. Even a single sentence can make a difference."

**OpenAI** — Prompt Guidance (GPT-5.4):
> "Give the model a clear persona. Specify the channel and emotional register."
> Developer message의 구성 요소 중 **Identity**가 첫 번째로 명시되며, "Describe the purpose, communication style, and high-level goals of the assistant"라고 정의한다.

**Google** — Gemini Prompting Strategies:
> "Prioritize critical instructions: Place essential behavioral constraints, role definitions (persona), and output format requirements in the System Instruction or at the very beginning of the user prompt."

세 벤더 모두 역할 정의를 프롬프트의 **가장 첫 번째 구성 요소**로 배치할 것을 권장한다.

#### 연구 근거

White et al. (2023)의 **Persona Pattern**은 "Act as [role]" 형태의 역할 지정이 도메인 특화 응답 품질을 높이는 가장 효과적인 패턴 중 하나임을 카탈로그화하였다.

#### PromptCraft 구현: `role` 카드

- **입력 방식**: `select-or-text` — 선택지와 자유 입력을 병행 지원
- **모든 트리에 필수(required)**: 역할이 없으면 모델이 일반적 도우미 모드로 동작하여 코딩 전문성이 저하됨
- **트리별 예시 차별화**: `error-solving`은 "시니어 개발자 / SRE", `feature-impl`은 "풀스택 개발자 / 아키텍트", `code-review`는 "코드 리뷰어 / 보안 전문가", `concept-learn`은 "기술 강사 / 멘토"를 제안

---

### 3.2 P2 — 명확한 목표 진술 (Clear Objective Statement)

#### 정의

모델에게 수행할 작업의 목적, 기대 결과, 사용 맥락을 구체적으로 명시하는 기법.

#### 벤더 공식 근거

**Anthropic** — Claude Prompting Best Practices:
> "Be clear and direct — Claude responds well to clear, explicit instructions. Being specific about your desired output can help enhance results."
> "Think of Claude as a brilliant but new employee who lacks context on your norms and workflows. The more precisely you explain what you want, the better the result."

**OpenAI** — Prompt Engineering Guide:
> "Write clear instructions — these models can't read your mind. If outputs are too long, ask for brief replies. If outputs are too simple, ask for expert-level writing. If you dislike the format, demonstrate the format you'd like to see."

**Google** — Gemini Prompting Strategies:
> "Be precise and direct: State your goal clearly and concisely. Avoid unnecessary or overly persuasive language."

#### 연구 근거

COSTAR 프레임워크의 **Objective(O)** 요소. COSTAR는 커뮤니티에서 검증된 프롬프트 구조 프레임워크로, Objective를 전체 프롬프트 품질의 핵심 결정 요인으로 지목한다.

#### PromptCraft 구현: `goal` 카드

- **필수(required)**: `role`과 함께 모든 트리에서 유일한 필수 카드
- **트리별 hint 차별화**: `error-solving`은 "어떤 에러를 해결하고 싶나요?", `code-review`는 기본값 "코드 리뷰"로 pre-fill
- **자유 텍스트 입력**: 목표는 트리마다 완전히 다르므로 select가 아닌 text 입력 제공

---

### 3.3 P3 — 구조화된 컨텍스트 제공 (Structured Context Provision)

#### 정의

모델이 문제를 정확히 이해하는 데 필요한 배경 정보를 구조화된 형태로 제공하는 기법. 할루시네이션(hallucination)을 줄이고 관련성 높은 응답을 유도한다.

#### 벤더 공식 근거

**Anthropic** — Claude Prompting Best Practices:
> "Structure prompts with XML tags — XML tags help Claude parse complex prompts unambiguously, especially when your prompt mixes instructions, context, examples, and variable inputs. Wrapping each type of content in its own tag reduces misinterpretation."

**OpenAI** — Prompt Engineering Guide:
> "Include relevant context information — The technique of adding additional relevant context to the model generation request is sometimes called retrieval-augmented generation (RAG)."
> "Message formatting with Markdown and XML — Markdown headers and lists can be helpful to mark distinct sections of a prompt, and to communicate hierarchy to the model."

**Google** — Gemini Prompting Strategies:
> "Use consistent structure: Employ clear delimiters to separate different parts of your prompt. XML-style tags (e.g., `<context>`, `<task>`) or Markdown headings are effective."
> "Structure for long contexts: When providing large amounts of context (e.g., documents, code), supply all the context first."

#### 연구 근거

White et al. (2023)의 **Context Manager Pattern**: "Within scope X, consider only Y" 형태의 컨텍스트 경계 설정 패턴. 모델이 무관한 학습 데이터 대신 제공된 컨텍스트에 집중하도록 유도한다.

#### PromptCraft 구현

컨텍스트 제공 원칙은 가장 많은 카드에 적용된다. 각 카드가 별도 섹션(`## 섹션명\n{{value}}`)으로 렌더링되어 Markdown 헤더 기반 구조를 자동으로 형성한다.

| 카드 | 컨텍스트 유형 | 적용 트리 |
|------|-------------|-----------|
| `stack-environment` | 기술 스택 및 실행 환경 | error-solving, feature-impl |
| `error-evidence` | 에러 메시지, 스택 트레이스 | error-solving |
| `current-situation` | 현재 코드 상태 및 동작 | error-solving, feature-impl |
| `build-log` | 빌드/컴파일 로그 | error-solving |
| `request-log` | HTTP 요청/응답 로그 | error-solving |
| `profiling-data` | 성능 프로파일링 데이터 | error-solving |
| `baseline-metric` | 기준 성능 지표 | error-solving |
| `review-code` | 리뷰 대상 코드 | code-review |
| `target-code` | 수정 대상 코드 | feature-impl |
| `related-code` | 관련 코드 (참고용) | feature-impl, code-review, concept-learn |
| `security-context` | 보안 요구사항 및 위협 모델 | code-review |
| `concept` | 학습할 기술 개념 | concept-learn |

**`multiline-mention` 입력 타입**은 `@파일경로` 형식의 파일 참조를 지원하여, OpenAI가 권장하는 RAG(Retrieval-Augmented Generation) 패턴을 실제 파일 내용 삽입으로 구현한다.

---

### 3.4 P4 — Few-Shot 예시 제공 (Few-Shot Exemplar Provision)

#### 정의

모델에게 원하는 입력-출력 패턴의 구체적 예시를 제시하여, 미세조정(fine-tuning) 없이도 새로운 태스크를 수행하도록 유도하는 기법.

#### 벤더 공식 근거

**Anthropic** — Claude Prompting Best Practices:
> "Examples are one of the most reliable ways to steer Claude's output format, tone, and structure. A few well-crafted examples (known as few-shot or multishot prompting) can dramatically improve accuracy and consistency."
> "Include 3–5 examples for best results."

**OpenAI** — Prompt Engineering Guide:
> "Few-shot learning lets you steer a large language model toward a new task by including a handful of input/output examples in the prompt, rather than fine-tuning the model. The model implicitly 'picks up' the pattern from those examples and applies it to a prompt."

**Google** — Gemini Prompting Strategies:
> "Models like Gemini can often pick up on patterns using a few examples, though you may need to experiment with the number of examples to provide in the prompt for the best results."

#### 연구 근거

Brown et al. (2020) — **"Language Models are Few-Shot Learners"** (NeurIPS 2020, arXiv:2005.14165):
GPT-3 논문으로, 프롬프트 내 소수의 예시(few-shot)만으로도 파인튜닝에 준하는 성능을 달성할 수 있음을 최초로 체계적으로 입증하였다. 이 논문은 few-shot prompting 분야의 기초 문헌으로, 현재까지 수만 회 인용되었다.

#### PromptCraft 구현

| 카드 | 역할 | 적용 트리 |
|------|------|-----------|
| `example-io` | 입력-출력 쌍 예시 제공 | error-solving, feature-impl, concept-learn |
| `expected-behavior` | 기대 동작 서술 (암시적 예시) | error-solving |

`example-io` 카드의 hint: "기대하는 입력과 출력의 구체적 예시를 제공하세요. Few-shot 예시는 AI 정확도를 크게 높입니다." — 이는 Brown et al. (2020)의 핵심 발견을 직접 사용자에게 전달하는 설계다.

---

### 3.5 P5 — 출력 형식 지정 (Output Format Specification)

#### 정의

모델이 생성해야 할 응답의 구조, 형식, 길이, 스타일을 명시하여 후처리 없이 바로 활용 가능한 결과를 유도하는 기법.

#### 벤더 공식 근거

**Anthropic** — Claude Prompting Best Practices:
> "Be specific about the desired output format and constraints."

**OpenAI** — Prompt Guidance:
> "Specify packaging directly: answer length, whether to ask a follow-up question, citation style, and section order."
> "Persona should not override task-specific output requirements. If the user asks for JSON, return JSON."

**Google** — Gemini Prompting Strategies:
> "Prioritize critical instructions: Place essential behavioral constraints, role definitions (persona), and output format requirements in the System Instruction or at the very beginning of the user prompt."
> "While you can specify the format of simple JSON response objects using prompts, we recommend using Gemini API's structured output feature when specifying a more complex JSON Schema."

#### 연구 근거

White et al. (2023)의 **Template Pattern**: "Generate output following this template: [structure]" 형태의 출력 템플릿 패턴. COSTAR 프레임워크의 **Response(R)** 요소.

#### PromptCraft 구현

| 카드 | 역할 | 특이 사항 |
|------|------|-----------|
| `output-format` | 응답 구조 지정 | 트리별 특화 옵션 제공 |
| `output-pref` | 설명 방식 지정 | concept-learn 전용 — 개념 중심 / 코드 중심 / 비교 중심 |

`output-format` 카드는 트리별로 다른 기본 옵션을 제공한다:
- `code-review`: 심각도 테이블 형식 / 인라인 코멘트 형식 / 요약+상세 형식 / diff+설명 형식
- `concept-learn`: 개념→코드→실습 순서 / 비유+요약 형식 / Q&A 형식 / 치트시트 형식

이는 각 워크플로우에서 실제로 유용한 출력 형식을 미리 제시하여 사용자의 프롬프트 엔지니어링 부담을 줄이는 설계다.

---

### 3.6 P6 — 제약 조건 명시 (Constraint Definition)

#### 정의

모델이 수행해야 할 범위, 사용 가능한 기술, 준수해야 할 기준을 명확히 경계 짓는 기법. 범위 초과(scope creep)를 방지하고 실행 가능한 답변을 유도한다.

#### 벤더 공식 근거

**Anthropic** — Claude Prompting Best Practices:
> "Provide instructions as sequential steps using numbered lists or bullet points when the order or completeness of steps matters."
> Golden rule: 동료에게 프롬프트를 보여주었을 때 혼란스럽다면, 모델도 혼란스러울 것이다.

**OpenAI** — Prompt Guidance:
> "Lock research and citations to retrieved evidence — When citation quality matters, make both the source boundary and the format requirement explicit."
> `<grounding_rules>` 패턴: "Base claims only on provided context or tool outputs."

**Google** — Gemini Prompting Strategies:
> "Define parameters: Explicitly explain any ambiguous terms or parameters."
> "Control output verbosity: If you need a more conversational or detailed response, you must explicitly request it in your instructions."

#### 연구 근거

White et al. (2023)의 **Context Manager Pattern**: 모델의 응답 범위를 특정 컨텍스트로 한정하는 패턴. COSTAR의 **Style(S)**, **Tone(T)**, **Audience(A)** 요소.

#### PromptCraft 구현

| 카드 | 제약 유형 | 적용 트리 |
|------|----------|-----------|
| `constraints` | 일반 제약사항 (사용 금지 라이브러리, 코드 스타일 등) | 전체 (풀) |
| `impl-scope` | 구현 범위 (신규 구현 / 기존 코드 수정) | feature-impl |
| `modification-scope` | 수정 허용 범위 | feature-impl |
| `acceptance-criteria` | 수락 기준 (완료 조건) | feature-impl |
| `review-focus` | 리뷰 중점 (8개 옵션) | code-review |
| `concern-area` | 우려 영역 특정 | code-review |
| `tech-preference` | 기술 선호/제한 | feature-impl |
| `skill-level` | 학습자 수준 (입문/중급/심화) | concept-learn |

`skill-level` 카드는 COSTAR의 **Audience(A)** 요소를 직접 구현한다. OpenAI 문서가 지적하듯 "If outputs are too simple, ask for expert-level writing" — 즉, 대상 수준을 명시하는 것이 출력 품질에 직접 영향을 준다.

---

### 3.7 P7 — 작업 분해 (Task Decomposition / Chain-of-Thought Elicitation)

#### 정의

복잡한 태스크를 구조적으로 분해하거나, 모델이 단계적 추론(step-by-step reasoning)을 수행하도록 유도하는 기법.

#### 벤더 공식 근거

**Anthropic** — Claude Prompting Best Practices:
프롬프트 체이닝(prompt chaining)과 단계별 사고 유도를 복잡한 태스크 처리의 핵심 전략으로 제시한다.

**OpenAI** — Prompt Engineering Guide:
> "Reasoning models generate an internal chain of thought to analyze the input prompt, and excel at understanding complex tasks and multi-step planning."
> GPT-5 코딩 가이드에서 "Explicit role and workflow guidance — Frame the model as a software engineering agent with well-defined responsibilities"라고 명시한다.

**Google** — Gemini Prompting Strategies:
> "Break down prompts into components:
> 1. Break down instructions: Instead of having many instructions in one prompt, create one prompt per instruction.
> 2. Chain prompts: For complex tasks that involve multiple sequential steps, make each step a prompt and chain the prompts together.
> 3. Aggregate responses: Aggregation is when you want to perform different parallel tasks on different portions of the data."

#### 연구 근거

**Wei et al. (2022)** — "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models" (NeurIPS 2022, arXiv:2201.11903):
프롬프트에 단계적 추론 예시를 포함하면 산술, 상식 추론, 기호 추론 태스크에서 성능이 현저히 향상됨을 실험으로 입증하였다.

**Kojima et al. (2022)** — "Large Language Models are Zero-Shot Reasoners" (NeurIPS 2022, arXiv:2205.11916):
"Let's think step by step" 한 문장을 추가하는 것만으로 제로샷 추론 성능이 크게 향상됨을 보였다.

**Wang et al. (2022)** — "Self-Consistency Improves Chain of Thought Reasoning" (ICLR 2023, arXiv:2203.11171):
다양한 추론 경로를 샘플링하고 다수결로 답을 선택하는 self-consistency 기법이 chain-of-thought의 정확도를 추가로 향상시킴을 입증하였다.

#### PromptCraft 구현

| 구성 요소 | 역할 |
|----------|------|
| **트리 시스템 자체** | "AI에게 도움 요청"이라는 복잡한 작업을 4가지 인지 유형(진단/생성/평가/학습)으로 분해 |
| `tried-methods` | 이미 시도한 방법 명시 → 모델이 동일한 실패를 반복하지 않도록 추론 경로 유도 |
| `impl-scope` | 구현 접근 방식(신규/수정)을 사전에 결정 → 모델의 추론 방향 설정 |
| `acceptance-criteria` | 완료 조건 명시 → 목표 달성 여부 판단 기준을 모델에게 제공 |

특히 `tried-methods` 카드는 CoT 연구에서 발견된 "잘못된 추론 경로 제거"의 원리를 활용한다. 실패한 방법을 명시하면 모델이 해당 경로를 제외하고 추론하므로, 사용자가 이미 시도한 해결책을 반복 제안하는 낭비를 방지한다.

---

## 4. 카드-원칙 역매핑 테이블

각 카드가 구현하는 프롬프트 엔지니어링 원칙의 전체 목록.

| 카드 ID | 카드명 | 주요 원칙 | 보조 원칙 | 기본 활성 트리 |
|---------|--------|----------|----------|--------------|
| `role` | 역할 | P1 Persona 설정 | — | 전체 (필수) |
| `goal` | 목표 | P2 목표 진술 | — | 전체 (필수) |
| `stack-environment` | 스택 & 환경 | P3 컨텍스트 제공 | P6 제약 조건 | error-solving, feature-impl |
| `error-evidence` | 에러 증거 | P3 컨텍스트 제공 | P7 작업 분해 | error-solving |
| `tried-methods` | 시도한 방법 | P7 작업 분해 | P6 제약 조건 | error-solving |
| `current-situation` | 현재 상황 | P3 컨텍스트 제공 | — | 풀 (optional) |
| `constraints` | 제약 조건 | P6 제약 조건 | — | 풀 (optional, 전체 트리) |
| `build-log` | 빌드 로그 | P3 컨텍스트 제공 | — | 풀 (optional) |
| `request-log` | 요청/응답 로그 | P3 컨텍스트 제공 | — | 풀 (optional) |
| `profiling-data` | 프로파일링 데이터 | P3 컨텍스트 제공 | P6 제약 조건 | 풀 (optional) |
| `baseline-metric` | 기준 성능 지표 | P6 제약 조건 | P3 컨텍스트 제공 | 풀 (optional) |
| `impl-scope` | 구현 범위 | P6 제약 조건 | P7 작업 분해 | feature-impl |
| `target-code` | 대상 코드 | P3 컨텍스트 제공 | — | 풀 (optional) |
| `tech-preference` | 기술 선호 | P6 제약 조건 | — | 풀 (optional) |
| `modification-scope` | 수정 범위 | P6 제약 조건 | P7 작업 분해 | 풀 (optional) |
| `review-code` | 리뷰 대상 코드 | P3 컨텍스트 제공 | — | code-review |
| `review-focus` | 리뷰 중점 | P6 제약 조건 | P7 작업 분해 | code-review |
| `security-context` | 보안 맥락 | P3 컨텍스트 제공 | P6 제약 조건 | 풀 (optional) |
| `concern-area` | 우려 영역 | P6 제약 조건 | P3 컨텍스트 제공 | 풀 (optional) |
| `concept` | 학습 개념 | P3 컨텍스트 제공 | P2 목표 진술 | concept-learn |
| `skill-level` | 현재 수준 | P6 제약 조건 | — | concept-learn |
| `output-pref` | 설명 방식 | P5 출력 형식 지정 | — | concept-learn |
| `expected-behavior` | 기대 동작 | P4 Few-Shot 예시 | P3 컨텍스트 제공 | 풀 (optional) |
| `acceptance-criteria` | 수락 기준 | P6 제약 조건 | P7 작업 분해 | 풀 (optional) |
| `output-format` | 응답 형식 | P5 출력 형식 지정 | — | 풀 (optional, 전체 트리) |
| `example-io` | 입출력 예시 | P4 Few-Shot 예시 | — | 풀 (optional) |
| `related-code` | 관련 코드 | P3 컨텍스트 제공 | — | 풀 (optional) |

> **집계**: P1·P2 각 1개 카드(필수), P3 12개 카드, P4 2개 카드, P5 2개 카드, P6 10개 카드, P7 4개 카드. 일부 카드는 복수 원칙에 걸쳐 있으며, 이는 프롬프트 엔지니어링 원칙들이 상호 보완적임을 반영한다.

---

## 5. 워크플로우 트리 설계 근거

### 5.1 왜 4개 트리인가

Google Gemini 문서는 "Break down prompts into components"에서 태스크 유형에 따라 다른 접근법이 필요함을 강조한다. Wei et al. (2022)의 CoT 연구 역시 태스크 유형에 따라 최적의 프롬프트 전략이 다름을 보였다.

PromptCraft의 4개 트리는 코딩 관련 AI 요청을 **인지 작업 유형**에 따라 분류한다:

| 트리 | 인지 유형 | 핵심 질문 | 필수 컨텍스트 |
|------|----------|----------|-------------|
| `error-solving` | **진단적 추론** (Diagnostic) | 무엇이 왜 잘못되었는가? | 에러 증거, 재현 조건, 시도한 방법 |
| `feature-impl` | **생성적 추론** (Generative) | 무엇을 어떻게 만들 것인가? | 구현 범위, 수락 기준, 기존 코드 |
| `code-review` | **평가적 추론** (Evaluative) | 이 코드는 어떤 문제가 있는가? | 리뷰 대상 코드, 리뷰 중점, 보안 맥락 |
| `concept-learn` | **교육적 추론** (Pedagogical) | 이 개념을 어떻게 이해할 것인가? | 개념, 학습자 수준, 선호 설명 방식 |

인지 유형이 다르면 모델에게 제공해야 할 컨텍스트의 종류와 순서가 달라진다. 동일한 `goal` 카드라도 `error-solving` 트리에서는 "어떤 에러인가?"를, `concept-learn` 트리에서는 "무엇을 배우고 싶은가?"를 묻는 방식으로 hint가 차별화된다.

### 5.2 기본 활성 카드와 풀 카드의 분리

Anthropic의 "Before prompt engineering" 원칙은 첫 번째 성공 기준으로 "A clear definition of the success criteria for your use case"를 제시한다. OpenAI는 소규모 모델일수록 명시적이고 구조화된 프롬프트가 더 중요함을 강조한다.

PromptCraft는 이 원칙에 따라:
- **기본 활성 카드**: 해당 트리에서 거의 항상 필요한 최소한의 컨텍스트 (4–5개)
- **풀 카드**: 특정 상황에서만 필요한 선택적 컨텍스트

로 분리하여, 사용자가 불필요한 카드 입력 부담 없이 빠르게 기본 프롬프트를 완성하고 필요시 깊이를 더할 수 있도록 설계하였다.

---

## 6. 결론

PromptCraft의 25개 카드와 4개 워크플로우 트리는 다음의 수렴적 근거에 기반하여 설계되었다:

1. **크로스 벤더 합의**: Anthropic, OpenAI, Google 세 벤더가 독립적으로 동일한 7개 원칙(Persona, 목표, 컨텍스트, Few-Shot, 출력 형식, 제약, 작업 분해)을 권장한다.

2. **연구 논문 지지**: 특히 Few-Shot(Brown et al., 2020), Chain-of-Thought(Wei et al., 2022), Prompt Pattern Catalog(White et al., 2023)는 카드 시스템의 핵심 설계 원리를 실험적으로 입증한다.

3. **구조 자체가 원칙**: PromptCraft의 카드 기반 `## 섹션헤더\n{{값}}` 렌더링 구조는 세 벤더가 모두 권장하는 "명확한 구분자로 프롬프트 섹션 분리" 원칙을 자동으로 적용한다. 사용자는 XML 태그나 Markdown 구조를 직접 작성할 필요 없이, 카드를 채우는 것만으로 구조화된 프롬프트를 얻는다.

4. **인지 유형별 분류**: 4개 트리는 임의적 분류가 아니라, CoT 연구에서 밝혀진 "태스크 유형에 따라 최적 프롬프트 전략이 다르다"는 원리를 반영한 설계다.

PromptCraft의 핵심 가치는 **프롬프트 엔지니어링 지식을 UI로 추상화**하는 것이다. 사용자는 Wei et al. (2022)의 논문을 읽지 않아도, "tried-methods" 카드를 채움으로써 자연스럽게 CoT의 이점을 얻는다. Brown et al. (2020)의 few-shot 원리를 몰라도, "example-io" 카드가 그 역할을 안내한다.

---

## Appendix A. 참고 문헌

### 벤더 공식 문서

[1] Anthropic. *Claude Prompting Best Practices*. 2024–2025. https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-prompting-best-practices

[2] OpenAI. *Prompt Engineering Guide*. 2024–2025. https://platform.openai.com/docs/guides/prompt-engineering

[3] OpenAI. *Prompt Guidance for GPT-5.4*. 2025. https://platform.openai.com/docs/guides/prompt-guidance

[4] Google. *Prompt Design Strategies — Gemini API*. 2024–2025. https://ai.google.dev/gemini-api/docs/prompting-strategies

### 연구 논문

[5] Brown, T. B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., Dhariwal, P., ... & Amodei, D. (2020). *Language Models are Few-Shot Learners*. In Advances in Neural Information Processing Systems (NeurIPS 2020). arXiv:2005.14165. https://arxiv.org/abs/2005.14165

[6] Wei, J., Wang, X., Schuurmans, D., Bosma, M., Ichter, B., Xia, F., ... & Zhou, D. (2022). *Chain-of-Thought Prompting Elicits Reasoning in Large Language Models*. In Advances in Neural Information Processing Systems (NeurIPS 2022). arXiv:2201.11903. https://arxiv.org/abs/2201.11903

[7] Kojima, T., Gu, S. S., Reid, M., Matsuo, Y., & Iwasawa, Y. (2022). *Large Language Models are Zero-Shot Reasoners*. In Advances in Neural Information Processing Systems (NeurIPS 2022). arXiv:2205.11916. https://arxiv.org/abs/2205.11916

[8] Wang, X., Wei, J., Schuurmans, D., Le, Q., Chi, E., Narang, S., ... & Zhou, D. (2022). *Self-Consistency Improves Chain of Thought Reasoning in Language Models*. In International Conference on Learning Representations (ICLR 2023). arXiv:2203.11171. https://arxiv.org/abs/2203.11171

[9] White, J., Fu, Q., Hays, S., Sandborn, M., Olea, C., Gilbert, H., ... & Schmidt, D. C. (2023). *A Prompt Pattern Catalog to Enhance Prompt Engineering with ChatGPT*. arXiv:2302.11382. https://arxiv.org/abs/2302.11382

### 프레임워크

[10] COSTAR Framework. *Context-Objective-Style-Tone-Audience-Response*. 커뮤니티 합의 프롬프트 구조 프레임워크. 2023–2024.
