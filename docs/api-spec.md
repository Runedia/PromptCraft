# API Specification — PromptCraft

---

## 1. 개요

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **인증**: 없음 (로컬 전용 서버)
- **에러 응답 형식**: 모든 에러는 아래 구조를 따른다

```json
{
  "error": {
    "code": "SCAN_PATH_NOT_FOUND",
    "message": "지정한 경로가 존재하지 않습니다"
  }
}
```

---

## 2. 엔드포인트 목록

| Method | Path | 설명 | 우선순위 |
|---|---|---|---|
| POST | /api/scan | 프로젝트 디렉토리 스캔 | P0 |
| GET | /api/trees | 사용 가능한 분기 트리 목록 | P0 |
| GET | /api/trees/:treeId | 특정 트리 상세 조회 | P0 |
| POST | /api/qna/start | 질의응답 세션 시작 | P0 |
| POST | /api/qna/answer | 질문에 응답 (다음 질문 반환) | P0 |
| POST | /api/prompt/build | 프롬프트 생성 | P0 |
| POST | /api/context/generate | 컨텍스트 파일 생성 | P0 |
| GET | /api/history | 히스토리 목록 조회 | P1 |
| GET | /api/history/:id | 히스토리 상세 조회 | P1 |
| DELETE | /api/history/:id | 히스토리 삭제 | P1 |
| GET | /api/templates | 템플릿 목록 조회 | P1 |
| POST | /api/templates | 템플릿 저장 | P1 |
| DELETE | /api/templates/:id | 템플릿 삭제 | P1 |
| GET | /api/config | 설정 조회 | P1 |
| PUT | /api/config | 설정 업데이트 | P1 |

---

## 3. 엔드포인트 상세

### 3.1 POST /api/scan

프로젝트 디렉토리를 스캔하여 언어, 프레임워크, 구조 정보를 반환한다.

**Request**

```json
{
  "path": "C:/Users/user/my-project",
  "useCache": true
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| path | string | O | 스캔할 디렉토리 절대 경로 |
| useCache | boolean | - | 캐시 사용 여부 (기본: true) |

**Response 200**

```json
{
  "scanResult": {
    "path": "C:/Users/user/my-project",
    "languages": [
      { "name": "JavaScript", "extension": ".js", "count": 45, "percentage": 62.5 }
    ],
    "frameworks": [
      { "name": "Express", "version": "4.18.2", "source": "package.json" }
    ],
    "structure": {
      "name": "my-project",
      "children": [
        { "name": "src", "children": ["components", "utils"] }
      ]
    },
    "packageManager": "npm",
    "hasEnv": true,
    "configFiles": ["package.json", ".eslintrc.js"],
    "scannedAt": "2026-03-06T12:00:00Z"
  },
  "fromCache": false
}
```

**Error**

| 코드 | HTTP | 설명 |
|---|---|---|
| SCAN_PATH_NOT_FOUND | 400 | 경로가 존재하지 않음 |
| SCAN_PATH_NOT_DIR | 400 | 경로가 디렉토리가 아님 |
| SCAN_TIMEOUT | 408 | 스캔 시간 초과 (5초) |

---

### 3.2 GET /api/trees

사용 가능한 분기 트리 목록을 반환한다.

**Response 200**

```json
{
  "trees": [
    {
      "treeId": "error-solving",
      "name": "에러 해결",
      "description": "에러 메시지 기반으로 문제를 구조화합니다",
      "isCustom": false
    },
    {
      "treeId": "feature-impl",
      "name": "기능 구현",
      "description": "새 기능 구현을 위한 요구사항을 구조화합니다",
      "isCustom": false
    }
  ]
}
```

---

### 3.3 GET /api/trees/:treeId

특정 트리의 전체 구조를 반환한다.

**Response 200**

```json
{
  "tree": {
    "treeId": "error-solving",
    "name": "에러 해결",
    "description": "에러 메시지 기반으로 문제를 구조화합니다",
    "version": "1.0.0",
    "entryNodeId": "language",
    "nodes": { ... }
  }
}
```

**Error**

| 코드 | HTTP | 설명 |
|---|---|---|
| TREE_NOT_FOUND | 404 | 해당 treeId가 존재하지 않음 |

---

### 3.4 POST /api/qna/start

질의응답 세션을 시작하고 첫 번째 질문을 반환한다.

**Request**

```json
{
  "treeId": "error-solving",
  "scanResult": { ... }
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| treeId | string | O | 사용할 분기 트리 ID |
| scanResult | object | - | 스캔 결과 (autoFill에 사용) |

**Response 200**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "question": {
    "nodeId": "language",
    "question": "사용 중인 언어와 버전은 무엇인가요?",
    "type": "text",
    "key": "language",
    "required": true,
    "placeholder": "예: JavaScript (Node.js 20)",
    "autoFilledValue": "JavaScript"
  },
  "progress": {
    "current": 1,
    "estimated": 6
  }
}
```

---

### 3.5 POST /api/qna/answer

현재 질문에 응답하고 다음 질문 또는 완료 상태를 반환한다.

**Request**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "answer": "JavaScript (Node.js 20)"
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| sessionId | string | O | 세션 ID |
| answer | string \| boolean \| array | O | 사용자 응답 (type에 따라 형식 상이) |

**Response 200 — 다음 질문**

```json
{
  "completed": false,
  "question": {
    "nodeId": "error-message",
    "question": "에러 메시지를 붙여넣어 주세요.",
    "type": "textarea",
    "key": "errorMessage",
    "required": true,
    "placeholder": "..."
  },
  "progress": {
    "current": 2,
    "estimated": 6
  }
}
```

**Response 200 — 완료**

```json
{
  "completed": true,
  "answers": {
    "language": "JavaScript (Node.js 20)",
    "errorMessage": "TypeError: Cannot read property 'map' of undefined",
    "errorContext": "API 응답 데이터를 렌더링할 때 발생",
    "triedMethods": "",
    "desiredResult": "API 응답이 없을 때 빈 배열로 처리",
    "constraints": ""
  }
}
```

**Error**

| 코드 | HTTP | 설명 |
|---|---|---|
| SESSION_NOT_FOUND | 404 | 세션이 존재하지 않거나 만료됨 |
| ANSWER_REQUIRED | 400 | 필수 질문에 빈 응답 |
| INVALID_ANSWER_TYPE | 400 | 응답 형식이 질문 타입과 불일치 |

---

### 3.6 POST /api/prompt/build

수집된 데이터로 프롬프트를 생성한다.

**Request**

```json
{
  "treeId": "error-solving",
  "scanResult": { ... },
  "answers": { ... },
  "templateId": null,
  "saveToHistory": true
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| treeId | string | O | 분기 트리 ID |
| scanResult | object | - | 스캔 결과 |
| answers | object | O | QnA 응답 |
| templateId | string | - | 사용할 템플릿 ID (null이면 기본) |
| saveToHistory | boolean | - | 히스토리 저장 여부 (기본: true) |

**Response 200**

```json
{
  "prompt": "## 프로젝트 컨텍스트\n- Stack: JavaScript (Node.js 20), Express 4.18.2\n...",
  "historyId": "660e8400-e29b-41d4-a716-446655440001"
}
```

---

### 3.7 POST /api/context/generate

컨텍스트 파일을 생성한다.

**Request**

```json
{
  "scanResult": { ... },
  "formats": ["claude", "gemini"],
  "customRules": {
    "conventions": "ESLint airbnb, async/await only",
    "constraints": "No deprecated APIs",
    "testFramework": "Jest"
  },
  "outputPath": "C:/Users/user/my-project"
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| scanResult | object | O | 스캔 결과 |
| formats | array | O | 생성할 포맷 목록 |
| customRules | object | - | 사용자 추가 규칙 |
| outputPath | string | - | 파일 저장 경로 (미지정 시 내용만 반환) |

**Response 200**

```json
{
  "files": [
    {
      "format": "claude",
      "filename": "CLAUDE.md",
      "content": "# Project Overview\n...",
      "saved": true,
      "path": "C:/Users/user/my-project/CLAUDE.md"
    },
    {
      "format": "gemini",
      "filename": "GEMINI.md",
      "content": "# Project Context\n...",
      "saved": true,
      "path": "C:/Users/user/my-project/GEMINI.md"
    }
  ]
}
```

**Error**

| 코드 | HTTP | 설명 |
|---|---|---|
| OUTPUT_PATH_NOT_WRITABLE | 400 | 출력 경로에 쓰기 권한 없음 |
| INVALID_FORMAT | 400 | 지원하지 않는 포맷 |

---

### 3.8 GET /api/history

히스토리 목록을 조회한다.

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| page | number | 1 | 페이지 번호 |
| limit | number | 20 | 페이지당 항목 수 |
| search | string | - | 프롬프트 내용 검색어 |
| treeId | string | - | 트리 ID로 필터링 |

**Response 200**

```json
{
  "items": [
    {
      "id": "550e8400-...",
      "treeId": "error-solving",
      "scanPath": "C:/Users/user/my-project",
      "tags": ["auth", "error"],
      "createdAt": "2026-03-06T12:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### 3.9 GET /api/history/:id

히스토리 상세를 조회한다.

**Response 200**

```json
{
  "id": "550e8400-...",
  "treeId": "error-solving",
  "scanPath": "C:/Users/user/my-project",
  "scanResult": { ... },
  "answers": { ... },
  "prompt": "## 프로젝트 컨텍스트\n...",
  "tags": ["auth", "error"],
  "createdAt": "2026-03-06T12:00:00",
  "updatedAt": "2026-03-06T12:00:00"
}
```

---

### 3.10 DELETE /api/history/:id

히스토리를 삭제한다.

**Response 200**

```json
{
  "deleted": true
}
```

---

### 3.11 GET /api/templates

템플릿 목록을 조회한다.

**Response 200**

```json
{
  "templates": [
    {
      "id": "...",
      "name": "기본 에러 해결",
      "description": "에러 해결용 기본 프롬프트 템플릿",
      "treeId": "error-solving",
      "isDefault": true
    }
  ]
}
```

---

### 3.12 POST /api/templates

템플릿을 저장한다.

**Request**

```json
{
  "name": "내 커스텀 템플릿",
  "description": "상세한 에러 해결 템플릿",
  "treeId": "error-solving",
  "content": "## Context\n{{#if scanResult}}...{{/if}}",
  "isDefault": false
}
```

**Response 201**

```json
{
  "id": "...",
  "name": "내 커스텀 템플릿",
  "createdAt": "2026-03-06T12:00:00"
}
```

---

### 3.13 DELETE /api/templates/:id

템플릿을 삭제한다.

**Response 200**

```json
{
  "deleted": true
}
```

---

### 3.14 GET /api/config

전체 설정을 조회한다.

**Response 200**

```json
{
  "config": {
    "ai.provider": null,
    "ai.model": null,
    "output.defaultFormat": "claude",
    "output.copyToClipboard": "true",
    "scan.maxDepth": "2",
    "scan.ignorePatterns": "[\"node_modules\",\"dist\",\".git\"]"
  }
}
```

---

### 3.15 PUT /api/config

설정을 업데이트한다.

**Request**

```json
{
  "key": "output.defaultFormat",
  "value": "gemini"
}
```

**Response 200**

```json
{
  "updated": true,
  "key": "output.defaultFormat",
  "value": "gemini"
}
```

---

## 4. QnA 세션 관리

- 세션은 **메모리 내 Map**으로 관리 (SQLite에 저장하지 않음)
- 세션 TTL: **30분** (마지막 요청 기준)
- 만료된 세션 접근 시 `SESSION_NOT_FOUND` 반환
- 서버 재시작 시 세션 소멸 (의도된 동작 — 질의응답은 짧은 작업)

---

## 5. HTTP 상태 코드 정리

| 코드 | 용도 |
|---|---|
| 200 | 정상 응답 |
| 201 | 리소스 생성 성공 |
| 400 | 잘못된 요청 (유효성 검증 실패) |
| 404 | 리소스를 찾을 수 없음 |
| 408 | 요청 시간 초과 |
| 500 | 서버 내부 오류 |
