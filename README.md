# PromptCraft

로컬 설치형 프롬프트 설계 도구

> AI 바이브 코딩을 위한 로컬 설치형 사전 프롬프트 생성 도구

LLM 비용 제로로 코드베이스를 스캔하고 카드 단위로 질문을 구조화해, 
AI 코딩의 One-Shot 성공률을 끌어올립니다.

## 요구사항

- Bun 1.3.10+

## 설치

> **주의:** 최초 설치 및 개발 환경 세팅(Windows 기준)은 반드시 **[SETUP.md](./docs/SETUP.md)** 를 참고하여 진행해 주시기 바랍니다.

```bash
# Bun이 없으면 먼저 설치: https://bun.sh
git clone <repo-url>
cd promptcraft
bun install
```

## 사용법

```bash
# 현재 프로젝트 경로 실행
promptcraft serve

# 다른 프로젝트 경로 실행
promptcraft serve [path]
```

## 개발

```bash
# 개발 모드
bun dev

# 테스트 실행
bun test

# 커버리지
bun test:coverage
```

## 데이터 저장 위치

- DB, 설정: `~/.promptcraft/`

## 문서

| 문서 | 설명 |
|------|------|
| [SETUP.md](./docs/SETUP.md) | 최초 설치 및 개발 환경 세팅 가이드 (Windows 기준) |
| [PRD 2.4](./docs/PRD/PRD_2.4.md) | AutoPlan 기능 PRD 2.4 전체 사양 |
| [SWA 평가 보고서](./docs/SWA-evaluation-2026-04.md) | 2026년 4월 소프트웨어 아키텍처 평가 결과 |
| [Vibe 레벨 레퍼런스](./docs/vibe_level.md) | AutoPlan Vibe 레벨(L1–L5) 이론 기준 정의 |
| [프롬프트 엔지니어링 근거](./docs/prompt-engineering-evidence.md) | 설계 근거 및 참고 자료 |
