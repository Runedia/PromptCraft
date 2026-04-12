# PromptCraft

로컬 설치형 코딩 프롬프트 빌더 — AI 코딩 도구에 더 완전하고 구조화된 질문을 자동으로 작성해줍니다.

> AI 바이브 코딩을 위한 로컬 설치형 사전 프롬프트 생성 도구

코드베이스를 자동으로 분석하고, 구조화된 질의응답을 통해 
AI 코딩 도구에 최적화된 완성형 프롬프트를 생성합니다.

## 요구사항

- Node.js 24+
- pnpm 10.30.3

## 설치

> **주의:** 최초 설치 및 개발 환경 세팅(Windows 기준)은 반드시 **[SETUP.md](./docs/SETUP.md)** 를 참고하여 진행해 주시기 바랍니다.

```bash
# pnpm이 없으면 먼저 설치: npm install -g pnpm
git clone <repo-url>
cd promptcraft
pnpm install
```

## 사용법

```bash
# 프로젝트 스캔
promptcraft scan [path]

# 프롬프트 빌드 (인터랙티브 Q&A)
promptcraft build

# 히스토리 조회
promptcraft history
```

## 개발

```bash
# 개발 모드 (nodemon)
pnpm dev

# 테스트 실행
pnpm test

# 커버리지
pnpm test:coverage

# scan 성능 벤치마크 (JSON 결과 누적 저장)
pnpm benchmark:scan
```

벤치마크 결과는 `tests/perf-results/scan-benchmark.json` 에 누적 저장됩니다.
실행 파라미터는 환경 변수로 조정할 수 있습니다.

```bash
SCAN_PERF_DEPTH=100 SCAN_PERF_FILES=1000 SCAN_PERF_ITERATIONS=5 SCAN_PERF_SEED=20260323 pnpm benchmark:scan
```

## 데이터 저장 위치

- DB, 설정: `~/.promptcraft/`
