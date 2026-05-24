---
title: "P1-12 Settings UI 구현 완료 · 디자인 변형 범위 제외 · P1-6 토큰 실측 결론"
date: 2026-05-25
status: completed
scope:
  - "§7.2.2 B"
  - "§7.2.2 C"
  - "§7.2.4"
related:
  - "[[2026-05-24-p1-11-history-done]]"
  - "[[7.Roadmap]]"
  - "[[4.UI-Design]]"
tags:
  - prd
  - prd/2-5
  - adr
up: "[[DECISIONS]]"
---

# P1-12 Settings UI 구현 완료 · 디자인 변형 범위 제외 · P1-6 토큰 실측 결론

## 배경

P1-12 설명("`/api/config` 소비 UI 부재. 디자인 변형 선택, 시스템 테마 연동 등 P1 항목 노출 창구")의 세 요소를 코드 전수 조사한 결과 PRD 표현과 실제 코드 상태 사이에 격차가 확인되었다.

- `/api/config`(DB `config` 테이블)에 실재하는 키는 Run as 셸 설정(`run.shell`/`run.shells`)뿐이다(`launcher.ts`, `repositories/config.ts`).
- 시스템 테마 연동은 이미 구현되어 있었다(next-themes `defaultTheme="system"` + `enableSystem` + `ThemeToggle`).
- "디자인 변형(design variant)"은 코드·PRD 어디에도 사용자 선택 가능한 개념으로 정의되어 있지 않았다(`variant`는 `SectionCard`의 `outlined`/`filled` prop뿐).

## 결정

1. **Settings UI 범위는 실재 항목으로 한정.** Run as 기본 셸 3지 선택(cmd/powershell/pwsh, `run.shell` 키) + 테마 3지 선택(시스템/라이트/다크)을 우측 `Sheet`(HistorySheet 패턴 재사용)로 노출한다. `run.shells` 사용자 정의 셸 템플릿 편집은 고급 기능으로 범위 외.
2. **"디자인 변형 선택"은 범위에서 제외.** 미정의 개념이므로 구현하지 않으며, 향후 정의가 필요해지면 별도 과제로 신설한다.
3. **시스템 테마 연동은 흡수.** 기존 next-themes 구현을 Settings에 명시 노출(시스템/라이트/다크 3지)하는 형태로 통합하고, TopBar `ThemeToggle`은 빠른 토글로 병행 유지한다(둘 다 `setTheme` 공유, 상태 자동 동기).
4. **P1-6 토큰은 실측 결론.** Settings UI를 기존 shadcn 표준 토큰(`bg-background`/`border-border`/`text-muted-foreground`/`--primary`/`--ring`)만으로 구현 가능함을 확인했다. PRD가 명시했던 `--pc-*` 접두사 토큰 9종은 작성 시점의 추측이며(실제 코드는 shadcn 표준 명명을 사용, `--pc-radius-xl 16px`은 이미 `--radius-xl`로 존재), 실측 결과 신규 토큰이 불필요했다. 미사용 토큰 선반영을 피하기 위해 P1-6 행을 §7.2.2 B에서 제거한다. 향후 실제 누락이 드러나면 그 시점에 필요분만 추가한다.

## 영향

- §7.2.2 C에서 P1-12 행 제거, §7.2.2 B에서 P1-6 행 제거. §7.2.4 매트릭스: P1-B 1건→0건, P1-C 2건→1건, 총계 8건→6건.
- P1-12·P1-6 번호는 결번 유지.
- 신규 컴포넌트: `src/web/components/SettingsSheet/`. 진입점: ActionBar `WORK_ACTIONBAR_SETTINGS`.
- E2E: `tests/e2e/settings.spec.ts`. 테스트 DB 격리를 위해 `connection.ts`에 `PROMPTCRAFT_DB_PATH` 환경변수 오버라이드 추가(per-run 고유 경로).
- 보안(KPI #7) 무변화: UI는 빌트인 셸 3종만 PUT하며, `buildArgv`가 미지 셸을 cmd로 폴백한다.
