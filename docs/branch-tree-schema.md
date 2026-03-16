# Branch Tree JSON Schema — PromptCraft

---

## 1. 개요

분기 질의응답 엔진은 JSON으로 정의된 트리를 순회하며 사용자에게 질문을 제시한다.
각 트리는 하나의 상황 유형(에러 해결, 기능 구현 등)에 대응하며, 노드 단위로 질문과 분기 조건을 정의한다.

---

## 2. 트리 파일 위치

```
data/trees/
├── error-solving.json      # 에러 해결
├── feature-impl.json       # 기능 구현
├── code-review.json        # 코드 리뷰
└── concept-learn.json      # 개념 이해

~/.promptcraft/trees/       # 사용자 커스텀 트리 (우선 로드)
```

- `data/trees/`는 내장 기본 트리 (패키지에 포함)
- `~/.promptcraft/trees/`는 사용자가 추가한 커스텀 트리
- 동일한 `treeId`가 있으면 커스텀 트리가 우선

---

## 3. JSON 스키마 정의

### 3.1 트리 루트 구조

```json
{
  "treeId": "error-solving",
  "name": "에러 해결",
  "description": "에러 메시지 기반으로 문제를 구조화합니다",
  "version": "1.0.0",
  "entryNodeId": "language",
  "nodes": { }
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| treeId | string | O | 고유 식별자 (영문 kebab-case) |
| name | string | O | 표시 이름 |
| description | string | O | 트리 설명 |
| version | string | O | 트리 버전 (semver) |
| entryNodeId | string | O | 시작 노드 ID |
| nodes | object | O | 노드 맵 (`nodeId → Node`) |

### 3.2 노드 구조

```json
{
  "nodeId": "language",
  "question": "사용 중인 언어와 버전은 무엇인가요?",
  "type": "text",
  "key": "language",
  "required": true,
  "placeholder": "예: JavaScript (Node.js 20)",
  "next": "error-message"
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| nodeId | string | O | 노드 고유 ID |
| question | string | O | 사용자에게 표시할 질문 |
| type | string | O | 입력 유형 (아래 참조) |
| key | string | O | 응답 저장 키 (answers 객체의 속성명) |
| required | boolean | - | 필수 입력 여부 (기본: true) |
| placeholder | string | - | 입력 힌트 |
| next | string \| null | - | 다음 노드 ID (null이면 트리 종료) |
| branches | array | - | 조건부 분기 (next 대신 사용) |
| options | array | - | type이 select/multiselect일 때 선택지 |
| autoFill | object | - | 스캔 결과에서 자동 채움 설정 |

### 3.3 입력 유형 (type)

| type | 설명 | UI 표현 |
|---|---|---|
| text | 단일 행 텍스트 | input |
| textarea | 여러 행 텍스트 (코드 스니펫 등) | textarea |
| select | 단일 선택 | radio / dropdown |
| multiselect | 복수 선택 | checkbox |
| confirm | 예/아니오 | yes/no |

### 3.4 조건부 분기 (branches)

`next` 대신 `branches`를 사용하면 사용자 응답에 따라 다음 노드가 달라진다.

```json
{
  "nodeId": "has-existing-code",
  "question": "현재 관련 코드가 있나요?",
  "type": "confirm",
  "key": "hasExistingCode",
  "branches": [
    { "condition": { "eq": true }, "next": "existing-code-input" },
    { "condition": { "eq": false }, "next": "desired-behavior" }
  ],
  "defaultNext": "desired-behavior"
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| branches[].condition | object | 매칭 조건 |
| branches[].next | string | 조건 충족 시 이동할 노드 ID |
| defaultNext | string | 모든 조건 불일치 시 기본 이동 노드 |

#### 조건 연산자

| 연산자 | 설명 | 예시 |
|---|---|---|
| eq | 값 일치 | `{ "eq": true }` |
| ne | 값 불일치 | `{ "ne": "none" }` |
| in | 배열 포함 | `{ "in": ["performance", "security"] }` |
| contains | 문자열 포함 | `{ "contains": "error" }` |

### 3.5 자동 채움 (autoFill)

스캔 결과에서 값을 자동으로 채울 수 있다. 사용자에게는 확인/수정 기회를 제공한다.

```json
{
  "nodeId": "language",
  "question": "사용 중인 언어와 버전은 무엇인가요?",
  "type": "text",
  "key": "language",
  "autoFill": {
    "source": "scanResult",
    "field": "languages[0].name",
    "message": "스캔 결과: {{value}} — 맞으면 Enter, 수정하려면 입력하세요"
  }
}
```

---

## 4. 전체 트리 예시: 에러 해결

```json
{
  "treeId": "error-solving",
  "name": "에러 해결",
  "description": "에러 메시지 기반으로 문제를 구조화합니다",
  "version": "1.0.0",
  "entryNodeId": "language",
  "nodes": {
    "language": {
      "nodeId": "language",
      "question": "사용 중인 언어와 버전은 무엇인가요?",
      "type": "text",
      "key": "language",
      "placeholder": "예: JavaScript (Node.js 20)",
      "autoFill": {
        "source": "scanResult",
        "field": "languages[0].name",
        "message": "스캔 결과: {{value}} — 맞으면 Enter, 수정하려면 입력하세요"
      },
      "next": "error-message"
    },
    "error-message": {
      "nodeId": "error-message",
      "question": "에러 메시지를 붙여넣어 주세요.",
      "type": "textarea",
      "key": "errorMessage",
      "placeholder": "터미널이나 브라우저 콘솔의 에러 메시지를 그대로 붙여넣으세요",
      "next": "error-context"
    },
    "error-context": {
      "nodeId": "error-context",
      "question": "에러가 발생하는 상황을 설명해 주세요.",
      "type": "textarea",
      "key": "errorContext",
      "placeholder": "예: 로그인 API를 호출할 때 발생, 특정 입력값에서만 발생 등",
      "next": "tried-methods"
    },
    "tried-methods": {
      "nodeId": "tried-methods",
      "question": "이미 시도한 해결 방법이 있나요?",
      "type": "textarea",
      "key": "triedMethods",
      "required": false,
      "placeholder": "예: Stack Overflow에서 찾은 방법을 시도했으나 동일한 에러 발생",
      "next": "desired-result"
    },
    "desired-result": {
      "nodeId": "desired-result",
      "question": "원하는 동작은 무엇인가요?",
      "type": "textarea",
      "key": "desiredResult",
      "placeholder": "예: 로그인 시 JWT 토큰이 정상 반환되어야 함",
      "next": "constraints"
    },
    "constraints": {
      "nodeId": "constraints",
      "question": "제약 조건이 있나요?",
      "type": "textarea",
      "key": "constraints",
      "required": false,
      "placeholder": "예: 외부 라이브러리 추가 불가, Node.js 18 이상 필수 등",
      "next": null
    }
  }
}
```

---

## 5. 전체 트리 예시: 기능 구현

```json
{
  "treeId": "feature-impl",
  "name": "기능 구현",
  "description": "새 기능 구현을 위한 요구사항을 구조화합니다",
  "version": "1.0.0",
  "entryNodeId": "feature-description",
  "nodes": {
    "feature-description": {
      "nodeId": "feature-description",
      "question": "구현하려는 기능을 설명해 주세요.",
      "type": "textarea",
      "key": "featureDescription",
      "placeholder": "예: 사용자가 이메일로 비밀번호를 재설정할 수 있는 기능",
      "next": "has-existing-code"
    },
    "has-existing-code": {
      "nodeId": "has-existing-code",
      "question": "현재 관련 코드가 있나요?",
      "type": "confirm",
      "key": "hasExistingCode",
      "branches": [
        { "condition": { "eq": true }, "next": "existing-code" },
        { "condition": { "eq": false }, "next": "reference-code" }
      ],
      "defaultNext": "reference-code"
    },
    "existing-code": {
      "nodeId": "existing-code",
      "question": "관련 코드를 붙여넣어 주세요.",
      "type": "textarea",
      "key": "existingCode",
      "next": "reference-code"
    },
    "reference-code": {
      "nodeId": "reference-code",
      "question": "참고할 코드나 예시가 있나요?",
      "type": "textarea",
      "key": "referenceCode",
      "required": false,
      "placeholder": "URL이나 코드 스니펫을 붙여넣으세요",
      "next": "constraints"
    },
    "constraints": {
      "nodeId": "constraints",
      "question": "제약 조건이 있나요?",
      "type": "textarea",
      "key": "constraints",
      "required": false,
      "placeholder": "예: 성능 요구사항, 사용 불가 라이브러리, 코딩 컨벤션 등",
      "next": null
    }
  }
}
```

---

## 6. 전체 트리 예시: 코드 리뷰

```json
{
  "treeId": "code-review",
  "name": "코드 리뷰",
  "description": "코드 리뷰 요청을 구조화합니다",
  "version": "1.0.0",
  "entryNodeId": "review-focus",
  "nodes": {
    "review-focus": {
      "nodeId": "review-focus",
      "question": "리뷰 시 집중해야 할 포인트를 선택하세요.",
      "type": "multiselect",
      "key": "reviewFocus",
      "options": [
        { "value": "performance", "label": "성능" },
        { "value": "security", "label": "보안" },
        { "value": "readability", "label": "가독성" },
        { "value": "architecture", "label": "구조/설계" },
        { "value": "all", "label": "전체" }
      ],
      "next": "code-snippet"
    },
    "code-snippet": {
      "nodeId": "code-snippet",
      "question": "리뷰할 코드를 붙여넣어 주세요.",
      "type": "textarea",
      "key": "codeSnippet",
      "next": "review-context"
    },
    "review-context": {
      "nodeId": "review-context",
      "question": "코드에 대한 추가 설명이 있나요?",
      "type": "textarea",
      "key": "reviewContext",
      "required": false,
      "placeholder": "예: 이 코드는 결제 처리 모듈의 일부입니다",
      "next": null
    }
  }
}
```

---

## 7. 전체 트리 예시: 개념 이해

```json
{
  "treeId": "concept-learn",
  "name": "개념 이해",
  "description": "프로그래밍 개념 학습을 위한 질문을 구조화합니다",
  "version": "1.0.0",
  "entryNodeId": "concept-topic",
  "nodes": {
    "concept-topic": {
      "nodeId": "concept-topic",
      "question": "어떤 개념에 대해 알고 싶나요?",
      "type": "text",
      "key": "conceptTopic",
      "placeholder": "예: 클로저, async/await, REST API, 디자인 패턴",
      "next": "current-level"
    },
    "current-level": {
      "nodeId": "current-level",
      "question": "현재 이해 수준은 어느 정도인가요?",
      "type": "select",
      "key": "currentLevel",
      "options": [
        { "value": "none", "label": "처음 들어봄" },
        { "value": "heard", "label": "이름만 알고 있음" },
        { "value": "basic", "label": "기본 개념은 알지만 활용이 어려움" },
        { "value": "intermediate", "label": "사용하고 있지만 깊이 이해하고 싶음" }
      ],
      "next": "prefer-analogy"
    },
    "prefer-analogy": {
      "nodeId": "prefer-analogy",
      "question": "비유를 활용한 설명을 원하나요?",
      "type": "confirm",
      "key": "preferAnalogy",
      "next": "has-related-code"
    },
    "has-related-code": {
      "nodeId": "has-related-code",
      "question": "관련 코드가 있나요?",
      "type": "confirm",
      "key": "hasRelatedCode",
      "branches": [
        { "condition": { "eq": true }, "next": "related-code" },
        { "condition": { "eq": false }, "next": null }
      ],
      "defaultNext": null
    },
    "related-code": {
      "nodeId": "related-code",
      "question": "관련 코드를 붙여넣어 주세요.",
      "type": "textarea",
      "key": "relatedCode",
      "next": null
    }
  }
}
```

---

## 8. 엔진 동작 규칙

1. **시작**: `entryNodeId`에 해당하는 노드를 첫 질문으로 제시
2. **순회**: 사용자 응답 후, `next` 또는 `branches` 평가로 다음 노드 결정
3. **종료**: `next`가 `null`이면 트리 순회 완료
4. **응답 저장**: 각 노드의 `key`를 속성명으로 하여 `answers` 객체에 저장
5. **필수 검증**: `required: true`(기본값)인 노드는 빈 입력 불허
6. **자동 채움**: `autoFill`이 있으면 스캔 결과에서 기본값을 제시, 사용자가 수정 가능
7. **분기 평가**: `branches` 배열을 순서대로 평가, 첫 번째 매칭 조건의 `next`로 이동

---

## 9. 커스텀 트리 추가 규칙

- `~/.promptcraft/trees/` 디렉토리에 JSON 파일을 추가하면 자동 인식
- `treeId`는 기존 내장 트리와 중복 가능 (커스텀이 우선)
- 트리 유효성 검증: 로드 시 아래 항목을 검사
  - `entryNodeId`가 `nodes`에 존재하는지
  - 모든 `next` 및 `branches[].next`가 유효한 노드를 참조하는지 (`null` 제외)
  - 순환 참조가 없는지
  - 필수 필드 누락 여부
