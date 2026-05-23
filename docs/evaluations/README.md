# PromptCraft 평가 자료 (Evaluations Archive)

본 폴더는 PromptCraft 평가 사이클의 입력·응답·평가 결과를 영구 보존하는 아카이브입니다. PRD 2.5 [§6 Evaluation](../PRD/PRD_2.5/6.Evaluation.md)의 정량 baseline 원본 자료입니다.

---

## 아카이브 구성

| 파일 | 크기 | 평가 사이클 | 대상 프로젝트 |
|---|---|---|---|
| [`scenarios-1-code-review.zip`](./scenarios-1-code-review.zip) | 63 KB | 1차 평가 (분석 모드, code-review 시나리오) | `markitdown` |
| [`scenarios-2-refactoring.zip`](./scenarios-2-refactoring.zip) | 147 KB | 2차 평가 (실행 모드, refactoring 시나리오) | `obscura` (Rust workspace) |

---

## 1. scenarios-1-code-review.zip

**1차 평가 사이클** — 응답 텍스트 도메인. AI가 코드 리뷰 결과를 텍스트로 산출.

### 포함 자료
```
시나리오/
├── L1-A_일반.txt ~ L3-B_promptcraft.txt   (입력 프롬프트 6개)
├── 결과1/ ~ 결과4/                          (AI 응답 텍스트 × 4 세션)
└── 평가보고서.md                           (1차 종합 평가)
```

### 평가 단위 매트릭스
- 6 시나리오(L1-A · L1-B · L2-A · L2-B · L3-A · L3-B) × 4 결과 = 24개

### 시점
2026-05-10 작성 (1차 평가보고서 작성일 기준)

---

## 2. scenarios-2-refactoring.zip

**2차 평가 사이클** — 실행 모드. AI가 실제 Rust 코드를 적용하고 `cargo check`로 빌드 검증.

### 포함 자료
```
시나리오2/
├── L1-A_일반.txt ~ L3-B_promptcraft.txt   (입력 프롬프트 6개)
├── 결과1/ ~ 결과3/                          (AI 응답 텍스트 × 3 모델)
├── 평가가이드라인.md                       (실행 모드 평가 절차)
├── 평가기준표.md                           (G1~G10 정량 기준)
├── 평가결과/                               (세부 평가서 19개)
│   ├── R1_L1-A.md ~ R1_L3-B.md            (R1 × 6)
│   ├── R2_L1-A.md ~ R2_L3-B.md            (R2 × 6)
│   ├── R3_L1-A.md ~ R3_L3-B.md            (R3 × 6)
│   └── R1_L2-A_2.md                       (R1 L2-A 재시도, 비결정성 검증)
└── 평가보고서.md                           (2차 종합 평가, 18개 단위)
```

### 평가 단위 매트릭스
- 6 시나리오 × 3 결과(R1·R2·R3) = 18개 + R1 L2-A 재시도 1개 = 19개

### 대상 프로젝트 baseline
- 저장소: `obscura` (Rust workspace, V8 from-source 빌드 포함)
- 기준 커밋: `1950048` (`main` 브랜치)
- 평가 대상 함수: `crates/obscura-cli/src/main.rs::run_parallel_scrape` (원본 230줄)

### 결과별 브랜치/커밋 매핑

| 결과군 | 원본 저장소 위치 (평가 당시) | 브랜치 패턴 |
|---|---|---|
| R1 | `E:\Project\temp\obscura` | `test001`~`test006` (각각 L1-A~L3-B), `test003_2` (재시도) |
| R2 | `E:\Project\temp\gem\obscura` | `gem001`~`gem006` |
| R3 | `E:\Project\temp\pi\obscura-pi001`~`pi006` | git worktree, uncommitted 변경사항 |

### 시점
2026-05-22 작성 (2차 평가보고서 작성일 기준)
2026-05-22 보강 (R3 추가 + 단계별 안전성 분석 정정)

---

## 압축에서 제외된 자료

다음 자료는 zip에 포함되지 않았습니다.

### `시나리오2/project/` (13개 obscura 워크스페이스 clone본)

평가 진행 시 subagent가 정적 분석을 수행한 작업 폴더입니다. 다음 사유로 보존하지 않습니다.

1. 각 폴더가 V8 from-source 빌드를 포함하는 Rust 워크스페이스로 매우 큼 (수~수십 GB)
2. 정량 평가 데이터는 평가보고서.md와 평가결과/ 폴더에 모두 기록됨

---

## 재현 절차

후속 평가 사이클에서 본 baseline을 재구성하려면:

### 1차 평가 (code-review) 재현
1. `scenarios-1-code-review.zip` 압축 해제
2. `markitdown` 저장소 baseline 커밋 확인 (1차 평가보고서.md 참조)
3. `시나리오/L*-*.txt` 입력을 평가 대상 모델에 투입
4. 응답 텍스트를 `결과N/` 폴더에 저장
5. 1차 평가보고서.md §5의 가설 검증 표 형식으로 정량 분석

### 2차 평가 (refactoring) 재현
1. `scenarios-2-refactoring.zip` 압축 해제
2. `obscura` 저장소를 main 브랜치 커밋 `1950048`로 reset
3. `시나리오2/L*-*.txt` 입력을 평가 대상 모델에 투입 (스킬 비활성 권장)
4. 모델 응답을 git 브랜치로 적용 (test/gem/pi 패턴 자유 선택)
5. 응답 텍스트를 `결과N/` 폴더에 저장
6. 평가가이드라인.md 절차에 따라 subagent 6개 병렬 평가
7. `cargo check --workspace` 사후 실행 → G1 지표 확정
8. 평가결과/R{N}_L*-*.md 세부 평가서 생성
9. 종합 보고서를 평가보고서.md에 추가

---

## 관련 PRD 섹션

- [PRD 2.5 §6 Evaluation](../PRD/PRD_2.5/6.Evaluation.md) — 2회 평가 사이클 종합 분석
- [PRD 2.5 §7 Roadmap](../PRD/PRD_2.5/7.Roadmap.md) — 신규 KPI 정의, 후속 평가 사이클 권장 항목
- [PRD 2.5 §1.4 Overview L1~L5 모델](../PRD/PRD_2.5/1.Overview.md) — 시나리오 레벨 모델 정의

---

## 유의 사항

- 본 아카이브는 정량 baseline의 영구 보존을 목적으로 합니다. 평가 결과 정정·재해석이 필요한 경우 zip을 다시 풀어 분석한 뒤 새 버전으로 추가합니다 (`scenarios-2-refactoring-v2.zip` 등).
- 외부 의존성: 토큰·latency 데이터는 외부 도구(`getagentseal/codeburn` 등) 위임이므로 본 아카이브에는 포함되지 않습니다.
- 모델 식별: R1·R2·R3의 실제 모델은 평가자 편향 차단을 위해 본 평가에서는 비공개로 진행되었습니다. 후속 평가는 PRD 2.5 §7.2.1 P0-1(모델 식별 메타데이터)로 보강됩니다.
