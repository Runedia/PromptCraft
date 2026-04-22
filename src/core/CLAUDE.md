# src/core — 핵심 비즈니스 로직 레이어

**목적:** 스캔, 카드 세션, 프롬프트 빌드 등 순수 로직. 어떤 인터페이스(CLI/Web)에도 의존하지 않음.

## 컨벤션

- **LLM API 호출 완전 금지** — 외부 AI 서비스 의존 금지
- **Commander.js / Express import 금지** — 프레임워크 종속 없는 순수 TS
- **DB:** `bun:sqlite` 내장 모듈 사용 (`better-sqlite3` 아님). 경로는 `DB_PATH`(shared/constants) 사용
- 반환값은 직렬화 가능한 순수 객체
- 모든 I/O는 인터페이스 레이어(server)에서 처리
- 성능 기준: 스캔 5초 이내, 프롬프트 빌드 5초 이내
