# PromptCraft CLI UI/UX 문서 (PRD_2.2.md)

본 문서는 **현재 코드에 실제 반영된 CLI UI/UX**를 기준으로 정리합니다. 대상은 `promptcraft` CLI 전체이며, 특히 `build`의 Ink 기반 인터랙티브 플로우를 상세히 다룹니다.

## 1. 전체 사용자 경험 구조

PromptCraft CLI는 다음 4개 명령으로 구성됩니다.

- `promptcraft build`: Ink 기반 멀티 스크린 위자드로 프롬프트 생성
- `promptcraft scan [path]`: 단일 명령형 스캔 출력(스피너 + 결과 리포트)
- `promptcraft history`: 생성 히스토리 조회/복사/삭제
- `promptcraft config`: 설정 조회/저장

공통 특징:

- 언어: 한국어 UX 문구 중심
- 색상: Chalk/Ink 컬러 출력 사용
- 취소/종료: `build`에서 `Ctrl+C` 전역 취소 지원
- 저장소: `~/.promptcraft/` (DB, last-scan, config)

## 2. 진입점/런타임 UX

### 2.1 바이너리 진입 (`bin/promptcraft.mts`)

- Node.js 24 미만이면 즉시 에러 출력 후 종료
- DB 초기화 후 CLI 실행
- 치명적 오류는 `Fatal error: ...` 출력

### 2.2 CLI 루트 (`src/cli/index.ts`)

- 프로그램명: `promptcraft`
- 설명: `AI 코딩 도구를 위한 구조화된 프롬프트 빌더`
- 버전 옵션: `-v, --version`
- 전역 옵션: `--no-color`
- 알 수 없는 명령어 입력 시:
  - `알 수 없는 명령어: ...` 출력
  - help 화면 표시

## 3. `build` 명령 UI/UX (핵심)

## 3.1 옵션 기반 초기 진입

`promptcraft build` 옵션:

- `-t, --tree <id>`: 트리 사전 지정
- `--scan [path]`: 빌드 전 스캔 실행 (path 생략 시 현재 경로)
- `--no-scan`: 스캔 생략
- `--template <name>`: 저장 템플릿으로 답변 prefill
- `--no-copy`: 결과 자동 클립보드 복사 비활성화
- `--output <file>`: 결과 프롬프트 파일 저장

템플릿 이름이 없거나 로드 실패 시 경고 후 빈 답변으로 진행합니다.

### 3.2 화면 상태 머신

상태 전환은 `useWizard`에서 관리합니다.

- `TREE_SELECT` → `PRESET_SELECT` → `SCAN` → `QNA` → `RESULT`

초기 분기:

- `initialTreeId && noScan` → `QNA` 바로 진입
- `initialTreeId`만 있음 → `PRESET_SELECT`
- 기본 → `TREE_SELECT`

### 3.3 공통 화면 레이아웃

대부분 스크린은 다음을 공통으로 사용합니다.

- 둥근 cyan 보더 박스
- 상단 헤더: `PromptCraft › [현재 단계/트리명]`
- 하단 힌트(키 가이드)

### 3.4 전역 키 동작

- `Ctrl+C`: 즉시 취소/종료 (`CANCELLED` 처리)
- 개별 스크린 내 키는 각 스크린이 오버레이 처리

---

### 3.5 TREE_SELECT 화면 (상황 선택)

표시 트리(고정 4개):

- 에러 해결 (`error-solving`)
- 기능 구현 (`feature-impl`)
- 코드 리뷰 (`code-review`)
- 개념 학습 (`concept-learn`)

UX:

- `↑/↓`로 이동
- `Enter`로 선택 확정 → `PRESET_SELECT`
- 각 항목에 설명 문구 동시 노출

---

### 3.6 PRESET_SELECT 화면 (빠른 시작)

트리별 프리셋(`data/template-presets/<treeId>/*.json`) + 직접 입력 옵션을 표시합니다.

UX:

- 프리셋 목록 + 설명 노출
- 마지막 항목: `직접 입력 (프리셋 없이 시작)`
- `↑/↓`, `Enter` 선택
- `Esc`로 프리셋 선택 건너뛰기

결과:

- 프리셋 선택 시 첫 example의 `prefill`을 QnA 초기값으로 전달
- 직접 입력/건너뛰기 시 빈 prefill로 진행
- 다음 단계: `SCAN`

---

### 3.7 SCAN 화면

단계 상태:

- `select` (방식 선택)
- `scanning` (스피너)
- `done` (요약 표시)
- `error` (실패 표시)

선택 UX:

- 기본 항목: `새로운 프로젝트 스캔 실행`
- 캐시(`~/.promptcraft/last-scan.json`) 존재 시: `이전 스캔 결과 사용`
- 항상 제공: `스캔 없이 진행`

키:

- `↑/↓` 선택
- `Enter` 확정

동작:

- `reuse` 선택: 캐시 결과로 즉시 QnA 이동
- `skip` 선택: 스캔 없이 QnA 이동
- `scan` 선택: `.` 경로 스캔 실행
- `--scan <path>`가 주어지면 선택 단계를 건너뛰고 즉시 `scanning`
- `--no-scan`이면 스캔 화면 로직 자체를 사실상 즉시 통과

시각화:

- 스캔 중 브라유 스피너 애니메이션
- 완료 시 언어 비중 바 차트(최대 5개), 프레임워크/패키지매니저 배지

실패 UX:

- `✗ 스캔 실패` + 에러 메시지
- `Enter`로 스캔 없이 계속

---

### 3.8 QNA 화면

핵심 UX:

- 상단: 이전 답변 히스토리(질문/답변 요약)
- 현재 질문 카드:
  - `[현재/전체]` 진행 표시
  - 진행 바(최대 경로 기준 추정)
  - hint / examples(최대 2개)
  - 입력 컴포넌트
- 하단 StatusBar: 입력 타입별 키 가이드 + undo 가능 시 Esc 힌트

세션:

- 화면 마운트 시 QnA 세션 생성
- 언마운트 시 세션 정리
- 입력 완료 시 즉시 다음 질문으로 이동

Undo UX:

- `Esc`로 이전 질문으로 되돌리기(가능할 때만)
- 구현 방식: 세션 재생성 + 기존 답변 replay
- 되돌린 답변은 현재 입력값으로 prefill됨

템플릿/preset prefill:

- `wizard.prefill` + `--template` 답변을 병합
- 현재 질문 key와 일치하면 자동 제출되어 스텝을 건너뜀

완료 UX:

- `✓ 완료! 프롬프트를 생성합니다...`
- 이후 `RESULT` 화면 이동

#### 입력 타입별 UX

1. `text` (`TextInput`)

- 한 줄 입력
- `Enter` 제출
- 필수 질문에서 공백 제출 시 `필수 항목입니다.`

2. `select` (`SelectInput`)

- `↑/↓` 선택, `Enter` 확정
- 옵션 label/description 표시

3. `select-or-text` (`SelectOrTextInput`)

- 기본은 select UI
- `__custom__` 선택 시 text 입력 모드 전환

4. `multiline` (`MultilineInput`)

- 줄 단위 입력
- 현재 줄이 비어있지 않으면 `Enter`로 다음 줄로 이동
- 현재 줄이 빈 상태에서 `Enter` 시 제출(종료)
- 백스페이스로 이전 줄 복귀 가능
- 상태바 안내 문구에는 `Shift+Enter 줄바꿈`이 표시되지만, 실제 구현은 Enter 기반 줄 전환입니다.

5. `multiline-mention` (`MentionInput`)

- 멀티라인 + `@경로` 자동완성 드롭다운
- `Tab` 또는 `Enter`로 후보 확정
- `↑/↓` 드롭다운 탐색
- 빈 줄 `Enter` 시 제출
- `Esc`로 드롭다운 닫기

멘션 보안/처리:

- 경로 탈출 방지
- `.env`, `.env.*` 차단
- 일부 이진 확장자 차단
- 제출 시 `@path`를 Markdown 링크(`[path](absPath)`)로 치환

> 참고: `readMentionedFile`(파일 내용 인라인 삽입)는 현재 Ink QnA 경로에서는 직접 사용되지 않습니다.

---

### 3.9 RESULT 화면

서브 단계:

- `view` (기본)
- `save-name` (템플릿명 입력)
- `save-file` (파일 경로 입력)

자동 동작:

- 기본: 프롬프트 자동 클립보드 복사 시도
- `--no-copy`면 자동 복사 생략
- `--output <file>`이면 자동 파일 저장 시도

본문 UX:

- 프롬프트를 페이지 단위(20줄)로 표시
- `↑/↓` 스크롤
- 페이지 인디케이터(`[n/total 페이지]`)
- 상태 배너(복사/저장 성공·실패 메시지, 자동 소거)

단축키(한/영 모두):

- `c` / `ㅊ`: 복사
- `s` / `ㄴ`: 템플릿 저장 모드
- `o` / `ㅐ`: 파일 저장 모드
- `q` / `ㅂ`: 종료(완료 콜백)

템플릿 저장 UX:

- 이름 입력 후 DB template 테이블 저장
- 성공/실패 상태 메시지

파일 저장 UX:

- 경로 입력 후 해당 파일에 프롬프트 저장
- 성공/실패 상태 메시지

### 3.10 build 종료 후 후처리

- 정상 완료 시 결과를 history DB에 저장
  - treeId, 상황라벨, prompt, scanPath, answers
- 저장 실패는 사용자 플로우를 막지 않음

## 4. Q&A 트리별 실제 질문 흐름

## 4.1 공통 시작 패턴

4개 트리 모두 시작 질문은 동일합니다.

- `role` (`select-or-text`, required, `scan.suggestedRoles`)

스캔 결과(언어/프레임워크)에 따라 역할 후보를 동적으로 추천하고, 항상 `직접 입력` 옵션이 포함됩니다.

### 4.2 `error-solving`

- 목표(goal) → 현재상황(multiline-mention) → 문제유형(select)
- 문제유형 분기:
  - runtime → error-evidence
  - build → build-log
  - network → request-log
  - perf → profiling-data → baseline-metric
- 이후 tried-methods(선택) → constraints(선택)로 종료

### 4.3 `feature-impl`

- goal → impl-scope(select)
- 분기:
  - new → tech-preference(선택)
  - modify → target-code(multiline-mention) → modification-scope
- constraints(선택)로 종료

### 4.4 `code-review`

- goal → review-code(multiline-mention) → review-focus(select)
- review-focus=security일 때 security-context(선택) 추가
- concern-area(선택) → constraints(선택) 종료

### 4.5 `concept-learn`

- goal → concept → skill-level(select) → output-pref(select) → constraints(선택) 종료

## 5. `scan` 명령 UI/UX

`promptcraft scan [path]`는 Ink가 아닌 단일 CLI 출력형 UX입니다.

옵션:

- `--json`: JSON 출력
- `--save`: `~/.promptcraft/last-scan.json` 저장
- `--depth <n>`: 디렉토리 깊이 제어

UX:

- 시작 시 스피너 표시 (`프로젝트 스캔 중...`)
- 완료 시:
  - 스캔 경로 + 소요 시간
  - 언어 통계
  - 프레임워크
  - 디렉토리 트리
  - 패키지매니저
  - `.env` 존재 여부
- 실패 시 에러 문구 출력 후 종료 코드 1

## 6. `history` 명령 UI/UX

기본 실행(`promptcraft history`)은 최근 목록 조회입니다.

서브명령:

- `list --limit`
- `show <id>`
- `copy <id>`
- `delete <id>`
- `clear`

UX 특징:

- 터미널 너비 기반 컬럼 레이아웃
- 프롬프트 미리보기 자동 잘림
- `delete`, `clear`는 확인 프롬프트 후 수행
- 비어 있을 때 친절한 안내 문구 출력

## 7. `config` 명령 UI/UX

서브명령:

- `config list`
- `config get <key>`
- `config set <key> <value> [--project]`

UX 특징:

- `set`의 value는 JSON parse 시도 후 실패하면 문자열로 저장
- 우선순위: project > global > default
- list는 값 + source(project/global/default) 동시 표시

## 8. 에러/취소/복원성 UX

- `build`:
  - 취소(`Ctrl+C`) 시 즉시 종료
  - `BuildError`, `QnAError`, 기타 에러를 구분해 메시지 출력
- `scan`:
  - `ScanError`와 기타 에러 분리 출력
- 결과 저장/복사 실패는 가능한 한 메시지로 알리고 플로우는 유지

## 9. 데이터 지속성(UX와 직접 연결되는 저장소)

- `~/.promptcraft/promptcraft.db`
  - `history`: build 완료 기록
  - `template`: 결과 화면 템플릿 저장/재사용
  - `config`: 내부 설정 저장
- `~/.promptcraft/last-scan.json`
  - ScanScreen에서 재사용 선택 UI의 근거 데이터

## 10. 키맵 요약

| 컨텍스트 | 키 | 동작 |
|---|---|---|
| 공통(build) | `Ctrl+C` | 취소/종료 |
| 선택형 화면 | `↑/↓` | 항목 이동 |
| 선택형 화면 | `Enter` | 확정 |
| Preset 선택 | `Esc` | 프리셋 건너뜀 |
| QnA | `Esc` | 이전 질문 undo (가능 시) |
| Mention 입력 | `Tab` | 자동완성 확정 |
| Mention 입력 | `↑/↓` | 후보 이동 |
| Mention 입력 | `Esc` | 드롭다운 닫기 |
| 멀티라인 입력 | 빈 줄 + `Enter` | 입력 완료 |
| Result | `c/ㅊ` | 복사 |
| Result | `s/ㄴ` | 템플릿 저장 |
| Result | `o/ㅐ` | 파일 저장 |
| Result | `q/ㅂ` | 종료 |

