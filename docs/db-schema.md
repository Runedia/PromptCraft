# DB Schema — PromptCraft

---

## 1. 개요

- **DB 엔진**: SQLite (better-sqlite3)
- **파일 위치**: `~/.promptcraft/promptcraft.db`
- **마이그레이션**: 버전 기반 순차 마이그레이션 (`src/core/db/migrations/`)

---

## 2. 테이블 설계

### 2.1 prompt_history — 생성된 프롬프트 히스토리

```sql
CREATE TABLE prompt_history (
    id          TEXT PRIMARY KEY,              -- UUID v4
    tree_id     TEXT NOT NULL,                 -- 사용된 분기 트리 ID
    scan_path   TEXT,                          -- 스캔한 프로젝트 경로
    scan_result TEXT,                          -- ScanResult JSON
    answers     TEXT NOT NULL,                 -- QnA 응답 JSON
    prompt      TEXT NOT NULL,                 -- 최종 생성된 프롬프트
    tags        TEXT,                          -- 사용자 태그 (JSON 배열)
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_history_tree_id ON prompt_history(tree_id);
CREATE INDEX idx_history_created_at ON prompt_history(created_at);
```

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | TEXT (UUID) | 고유 식별자 |
| tree_id | TEXT | 어떤 분기 트리로 생성했는지 |
| scan_path | TEXT | 스캔 대상 경로 (없으면 NULL) |
| scan_result | TEXT (JSON) | 스캔 결과 전체를 JSON으로 저장 |
| answers | TEXT (JSON) | 질의응답 응답 전체를 JSON으로 저장 |
| prompt | TEXT | 최종 조립된 프롬프트 원문 |
| tags | TEXT (JSON) | 사용자가 붙인 태그 `["auth", "error"]` |
| created_at | TEXT | 생성 시각 |
| updated_at | TEXT | 수정 시각 |

### 2.2 prompt_template — 사용자 저장 템플릿

```sql
CREATE TABLE prompt_template (
    id          TEXT PRIMARY KEY,              -- UUID v4
    name        TEXT NOT NULL UNIQUE,          -- 템플릿 이름
    description TEXT,                          -- 설명
    tree_id     TEXT,                          -- 연관 트리 ID (없으면 범용)
    content     TEXT NOT NULL,                 -- 템플릿 내용 (Handlebars)
    is_default  INTEGER NOT NULL DEFAULT 0,   -- 기본 템플릿 여부
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX idx_template_name ON prompt_template(name);
```

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | TEXT (UUID) | 고유 식별자 |
| name | TEXT | 템플릿 이름 (고유) |
| description | TEXT | 템플릿 설명 |
| tree_id | TEXT | 특정 트리 전용이면 해당 트리 ID, 범용이면 NULL |
| content | TEXT | Handlebars 템플릿 본문 |
| is_default | INTEGER | 1이면 해당 tree_id의 기본 템플릿 |
| created_at | TEXT | 생성 시각 |
| updated_at | TEXT | 수정 시각 |

### 2.3 scan_cache — 스캔 결과 캐시

```sql
CREATE TABLE scan_cache (
    path        TEXT PRIMARY KEY,              -- 스캔 경로 (정규화된 절대 경로)
    result      TEXT NOT NULL,                 -- ScanResult JSON
    file_hash   TEXT NOT NULL,                 -- 디렉토리 상태 해시 (변경 감지)
    scanned_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

| 컬럼 | 타입 | 설명 |
|---|---|---|
| path | TEXT | 스캔 대상 절대 경로 (PK) |
| result | TEXT (JSON) | 캐시된 ScanResult |
| file_hash | TEXT | 파일 목록 + mtime 기반 해시. 변경 시 재스캔 |
| scanned_at | TEXT | 스캔 시각 |

### 2.4 config — 사용자 설정

```sql
CREATE TABLE config (
    key         TEXT PRIMARY KEY,              -- 설정 키
    value       TEXT NOT NULL,                 -- 설정 값 (JSON 또는 단순 문자열)
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

| 컬럼 | 타입 | 설명 |
|---|---|---|
| key | TEXT | 설정 키 (PK) |
| value | TEXT | 설정 값 |
| updated_at | TEXT | 마지막 수정 시각 |

#### 주요 설정 키

| key | 예시 value | 설명 |
|---|---|---|
| `ai.provider` | `"anthropic"` | AI 연결 제공자 |
| `ai.apiKey` | `"encrypted:..."` | 암호화된 API Key |
| `ai.ollamaUrl` | `"http://localhost:11434"` | Ollama 서버 URL |
| `ai.model` | `"claude-sonnet-4-6"` | 사용할 모델 |
| `output.defaultFormat` | `"claude"` | 기본 컨텍스트 파일 포맷 |
| `output.copyToClipboard` | `"true"` | 자동 클립보드 복사 여부 |
| `scan.maxDepth` | `"2"` | 디렉토리 스캔 깊이 |
| `scan.ignorePatterns` | `'["node_modules","dist",".git"]'` | 스캔 제외 패턴 |

---

## 3. ER 다이어그램

```
┌─────────────────────┐
│   prompt_history    │
├─────────────────────┤
│ id (PK)             │
│ tree_id ─────────────────► 분기 트리 JSON의 treeId
│ scan_path            │
│ scan_result (JSON)   │
│ answers (JSON)       │
│ prompt               │
│ tags (JSON)          │
│ created_at           │
│ updated_at           │
└─────────────────────┘

┌─────────────────────┐
│   prompt_template   │
├─────────────────────┤
│ id (PK)             │
│ name (UNIQUE)        │
│ description          │
│ tree_id ─────────────────► 분기 트리 JSON의 treeId (nullable)
│ content              │
│ is_default           │
│ created_at           │
│ updated_at           │
└─────────────────────┘

┌─────────────────────┐
│   scan_cache        │
├─────────────────────┤
│ path (PK)            │
│ result (JSON)        │
│ file_hash            │
│ scanned_at           │
└─────────────────────┘

┌─────────────────────┐
│   config            │
├─────────────────────┤
│ key (PK)             │
│ value                │
│ updated_at           │
└─────────────────────┘
```

- 테이블 간 FK는 설정하지 않는다. `tree_id`는 JSON 파일의 `treeId`를 참조하는 논리적 관계.
- SQLite의 경량성을 유지하기 위해 정규화보다 JSON 컬럼을 활용.

---

## 4. 마이그레이션 전략

```
src/core/db/migrations/
├── 001_initial.sql         # 최초 테이블 생성
├── 002_add_tags.sql        # 예시: tags 컬럼 추가
└── ...
```

- DB 파일에 `PRAGMA user_version`으로 현재 버전 기록
- 앱 시작 시 현재 버전과 마이그레이션 파일 비교, 미적용 마이그레이션 순차 실행
- 각 마이그레이션 파일은 트랜잭션으로 감싸서 실행

```javascript
// 마이그레이션 실행 로직 (의사 코드)
const currentVersion = db.pragma('user_version', { simple: true });
const migrations = loadMigrations(); // 001, 002, ...

for (const migration of migrations) {
  if (migration.version > currentVersion) {
    db.transaction(() => {
      db.exec(migration.sql);
      db.pragma(`user_version = ${migration.version}`);
    })();
  }
}
```

---

## 5. 쿼리 예시

### 히스토리 목록 조회 (최신순, 페이지네이션)

```sql
SELECT id, tree_id, scan_path, tags, created_at
FROM prompt_history
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

### 히스토리 검색 (프롬프트 내용 기반)

```sql
SELECT id, tree_id, prompt, created_at
FROM prompt_history
WHERE prompt LIKE '%' || ? || '%'
ORDER BY created_at DESC
LIMIT 20;
```

### 스캔 캐시 조회 (변경 감지)

```sql
SELECT result, file_hash
FROM scan_cache
WHERE path = ?;
```

### 설정 읽기/쓰기

```sql
-- 읽기
SELECT value FROM config WHERE key = ?;

-- 쓰기 (upsert)
INSERT INTO config (key, value, updated_at)
VALUES (?, ?, datetime('now', 'localtime'))
ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = excluded.updated_at;
```
