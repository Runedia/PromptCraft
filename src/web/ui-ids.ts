/**
 * UI 식별자 단일 진실 원천.
 * 자동 생성되는 docs/ui-map.md의 입력.
 */
export const UI_IDS = {
  // ── 글로벌 ───────────────────────────────────────────────────────────────

  /**
   * @screen Global
   * @region Theme
   * @description 라이트/다크 테마 토글 버튼
   * @file src/web/components/ThemeToggle.tsx
   */
  THEME_TOGGLE: 'THEME_TOGGLE',

  // ── TreeSelect 화면 ──────────────────────────────────────────────────────

  /**
   * @screen TreeSelect
   * @region Hero
   * @description 히어로 섹션 (PromptCraft 로고 · 제목 · 설명문)
   * @file src/web/components/TreeSelect/TreeSelect.tsx
   */
  TREE_HERO: 'TREE_HERO',

  /**
   * @screen TreeSelect
   * @region Path
   * @description 프로젝트 경로 입력 카드 (경로 + 탐색 + 역할 제안)
   * @file src/web/components/TreeSelect/TreeSelect.tsx
   */
  TREE_PATH_CARD: 'TREE_PATH_CARD',

  /**
   * @screen TreeSelect
   * @region Path
   * @description 프로젝트 경로 텍스트 입력 필드
   * @file src/web/components/TreeSelect/TreeSelect.tsx
   */
  TREE_PATH_INPUT: 'TREE_PATH_INPUT',

  /**
   * @screen TreeSelect
   * @region Path
   * @description 경로 지우기 버튼 (입력 값이 있을 때만 표시)
   * @file src/web/components/TreeSelect/TreeSelect.tsx
   */
  TREE_PATH_CLEAR_BTN: 'TREE_PATH_CLEAR_BTN',

  /**
   * @screen TreeSelect
   * @region Path
   * @description 폴더 탐색기 열기 버튼
   * @file src/web/components/TreeSelect/TreeSelect.tsx
   */
  TREE_PATH_BROWSE_BTN: 'TREE_PATH_BROWSE_BTN',

  /**
   * @screen TreeSelect
   * @region Path
   * @description 역할 제안 칩 목록 (스캔 완료 후 표시)
   * @file src/web/components/TreeSelect/TreeSelect.tsx
   */
  TREE_PATH_ROLE_CHIPS: 'TREE_PATH_ROLE_CHIPS',

  /**
   * @screen TreeSelect
   * @region Card
   * @description 상황 카드 그리드 컨테이너 (2-col)
   * @file src/web/components/TreeSelect/TreeSelect.tsx
   */
  TREE_CARD_GRID: 'TREE_CARD_GRID',

  /**
   * @screen TreeSelect
   * @region Card
   * @description 개별 상황 카드 (반복 — data-ui-tree-id로 인스턴스 구분)
   * @file src/web/components/TreeSelect/TreeSelect.tsx
   */
  TREE_CARD: 'TREE_CARD',

  // ── WorkspacePage 화면 ───────────────────────────────────────────────────

  /**
   * @screen WorkspacePage
   * @region Restore
   * @description 이전 작업 복원 여부 확인 다이얼로그
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_RESTORE_DIALOG: 'WORK_RESTORE_DIALOG',

  /**
   * @screen WorkspacePage
   * @region Left
   * @description 좌측 패널 (헤더 + 카드 목록 + 카드 풀)
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_LEFT_PANEL: 'WORK_LEFT_PANEL',

  /**
   * @screen WorkspacePage
   * @region Left
   * @description 좌측 패널 고정 헤더 (뒤로 + 트리 라벨 + 스캔 버튼)
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_LEFT_HEADER: 'WORK_LEFT_HEADER',

  /**
   * @screen WorkspacePage
   * @region Left
   * @description 뒤로(TreeSelect 화면으로 이동) 버튼
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_LEFT_BACK_BTN: 'WORK_LEFT_BACK_BTN',

  /**
   * @screen WorkspacePage
   * @region Left
   * @description 스캔 / 재스캔 토글 버튼
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_LEFT_SCAN_BTN: 'WORK_LEFT_SCAN_BTN',

  /**
   * @screen WorkspacePage
   * @region Scan
   * @description 스캔 경로 텍스트 입력 (스캔 버튼 클릭 시 표시)
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_SCAN_INPUT: 'WORK_SCAN_INPUT',

  /**
   * @screen WorkspacePage
   * @region Scan
   * @description 스캔 실행 버튼
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_SCAN_EXECUTE_BTN: 'WORK_SCAN_EXECUTE_BTN',

  /**
   * @screen WorkspacePage
   * @region Section
   * @description 활성 SectionCard 컨테이너 (DnD 정렬 가능)
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_SECTION_LIST: 'WORK_SECTION_LIST',

  /**
   * @screen WorkspacePage
   * @region Right
   * @description 우측 패널 (PromptPreview 포함)
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_RIGHT_PANEL: 'WORK_RIGHT_PANEL',

  /**
   * @screen WorkspacePage
   * @region SaveTemplate
   * @description 템플릿 저장 모달
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_SAVE_TEMPLATE_MODAL: 'WORK_SAVE_TEMPLATE_MODAL',

  /**
   * @screen WorkspacePage
   * @region SaveTemplate
   * @description 템플릿 이름 텍스트 입력
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_SAVE_TEMPLATE_INPUT: 'WORK_SAVE_TEMPLATE_INPUT',

  /**
   * @screen WorkspacePage
   * @region SaveTemplate
   * @description 템플릿 저장 확인 버튼
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_SAVE_TEMPLATE_SAVE_BTN: 'WORK_SAVE_TEMPLATE_SAVE_BTN',

  /**
   * @screen WorkspacePage
   * @region SaveTemplate
   * @description 템플릿 저장 취소 버튼
   * @file src/web/pages/WorkspacePage.tsx
   */
  WORK_SAVE_TEMPLATE_CANCEL_BTN: 'WORK_SAVE_TEMPLATE_CANCEL_BTN',

  // ── SectionCard 컴포넌트 ─────────────────────────────────────────────────

  /**
   * @screen WorkspacePage
   * @region Section
   * @description 개별 활성 SectionCard 루트 (반복 — data-ui-card-id로 인스턴스 구분)
   * @file src/web/components/SectionCard/SectionCard.tsx
   */
  WORK_SECTION_CARD: 'WORK_SECTION_CARD',

  /**
   * @screen WorkspacePage
   * @region Section
   * @description SectionCard 드래그 핸들 버튼
   * @file src/web/components/SectionCard/SectionCard.tsx
   */
  WORK_SECTION_CARD_DRAG_BTN: 'WORK_SECTION_CARD_DRAG_BTN',

  /**
   * @screen WorkspacePage
   * @region Section
   * @description SectionCard 제거 버튼 (선택 카드에만 표시)
   * @file src/web/components/SectionCard/SectionCard.tsx
   */
  WORK_SECTION_CARD_REMOVE_BTN: 'WORK_SECTION_CARD_REMOVE_BTN',

  // ── CardPool 컴포넌트 ────────────────────────────────────────────────────

  /**
   * @screen WorkspacePage
   * @region CardPool
   * @description 비활성 카드 풀 컨테이너 (비활성 카드가 있을 때만 표시)
   * @file src/web/components/CardPool/CardPool.tsx
   */
  WORK_CARD_POOL: 'WORK_CARD_POOL',

  /**
   * @screen WorkspacePage
   * @region CardPool
   * @description 카드 풀 개별 카드 추가 버튼 (반복 — data-ui-card-id로 인스턴스 구분)
   * @file src/web/components/CardPool/CardPool.tsx
   */
  WORK_CARD_POOL_ITEM_BTN: 'WORK_CARD_POOL_ITEM_BTN',

  // ── PromptPreview 컴포넌트 ───────────────────────────────────────────────

  /**
   * @screen WorkspacePage
   * @region Preview
   * @description 프롬프트 미리보기 패널 루트
   * @file src/web/components/PromptPreview/PromptPreview.tsx
   */
  WORK_PREVIEW: 'WORK_PREVIEW',

  /**
   * @screen WorkspacePage
   * @region Preview
   * @description 미리보기 헤더 (Undo/Redo + 토큰 수 표시)
   * @file src/web/components/PromptPreview/PromptPreview.tsx
   */
  WORK_PREVIEW_HEADER: 'WORK_PREVIEW_HEADER',

  /**
   * @screen WorkspacePage
   * @region Preview
   * @description 실행 취소(Undo) 버튼
   * @file src/web/components/PromptPreview/PromptPreview.tsx
   */
  WORK_PREVIEW_UNDO_BTN: 'WORK_PREVIEW_UNDO_BTN',

  /**
   * @screen WorkspacePage
   * @region Preview
   * @description 다시 실행(Redo) 버튼
   * @file src/web/components/PromptPreview/PromptPreview.tsx
   */
  WORK_PREVIEW_REDO_BTN: 'WORK_PREVIEW_REDO_BTN',

  /**
   * @screen WorkspacePage
   * @region Preview
   * @description 프롬프트 마크다운 미리보기 콘텐츠 영역
   * @file src/web/components/PromptPreview/PromptPreview.tsx
   */
  WORK_PREVIEW_CONTENT: 'WORK_PREVIEW_CONTENT',

  /**
   * @screen WorkspacePage
   * @region Preview
   * @description 미리보기 액션 바 (복사 · 저장 · 히스토리)
   * @file src/web/components/PromptPreview/PromptPreview.tsx
   */
  WORK_PREVIEW_ACTION_BAR: 'WORK_PREVIEW_ACTION_BAR',

  /**
   * @screen WorkspacePage
   * @region Preview
   * @description 프롬프트 클립보드 복사 버튼
   * @file src/web/components/PromptPreview/PromptPreview.tsx
   */
  WORK_PREVIEW_COPY_BTN: 'WORK_PREVIEW_COPY_BTN',

  /**
   * @screen WorkspacePage
   * @region Preview
   * @description 템플릿 저장 트리거 버튼 (모달 열기)
   * @file src/web/components/PromptPreview/PromptPreview.tsx
   */
  WORK_PREVIEW_SAVE_BTN: 'WORK_PREVIEW_SAVE_BTN',

  /**
   * @screen WorkspacePage
   * @region Preview
   * @description 히스토리 패널 열기 버튼
   * @file src/web/components/PromptPreview/PromptPreview.tsx
   */
  WORK_PREVIEW_HISTORY_BTN: 'WORK_PREVIEW_HISTORY_BTN',

  // ── ActionBar 컴포넌트 (V2 TopBar 우측) ──────────────────────────────────

  /**
   * @screen WorkspacePage
   * @region ActionBar
   * @description 실행 취소 버튼
   * @file src/web/components/ActionBar/ActionBar.tsx
   */
  WORK_ACTIONBAR_UNDO: 'WORK_ACTIONBAR_UNDO',

  /**
   * @screen WorkspacePage
   * @region ActionBar
   * @description 다시 실행 버튼
   * @file src/web/components/ActionBar/ActionBar.tsx
   */
  WORK_ACTIONBAR_REDO: 'WORK_ACTIONBAR_REDO',

  /**
   * @screen WorkspacePage
   * @region ActionBar
   * @description 템플릿 저장 트리거
   * @file src/web/components/ActionBar/ActionBar.tsx
   */
  WORK_ACTIONBAR_SAVE: 'WORK_ACTIONBAR_SAVE',

  /**
   * @screen WorkspacePage
   * @region ActionBar
   * @description 프롬프트 복사 버튼
   * @file src/web/components/ActionBar/ActionBar.tsx
   */
  WORK_ACTIONBAR_COPY: 'WORK_ACTIONBAR_COPY',

  /**
   * @screen WorkspacePage
   * @region ActionBar
   * @description Run as 드롭다운 트리거 (4 옵션)
   * @file src/web/components/ActionBar/ActionBar.tsx
   */
  WORK_ACTIONBAR_RUN: 'WORK_ACTIONBAR_RUN',

  // ── ScanBanner / V6 Tree-Select ──────────────────────────────────────────

  /**
   * @screen TreeSelect
   * @region Scan
   * @description 스캔 상태 배너 (idle/scanning/scanned)
   * @file src/web/components/ScanBanner/ScanBanner.tsx
   */
  TREE_SCAN_BANNER: 'TREE_SCAN_BANNER',

  /**
   * @screen TreeSelect
   * @region Brand
   * @description V6 진입 화면 브랜드 바 (로고 + 버전 + 테마 토글)
   * @file src/web/components/TreeSelect/TreeSelect.tsx
   */
  TREE_BRAND_BAR: 'TREE_BRAND_BAR',

  /**
   * @screen TreeSelect
   * @region CTA
   * @description V6 진입 화면 취소 버튼
   * @file src/web/components/TreeSelect/CTARow.tsx
   */
  TREE_CTA_CANCEL: 'TREE_CTA_CANCEL',

  /**
   * @screen TreeSelect
   * @region CTA
   * @description V6 진입 화면 계속하기 버튼 (워크스페이스 진입)
   * @file src/web/components/TreeSelect/CTARow.tsx
   */
  TREE_CTA_CONTINUE: 'TREE_CTA_CONTINUE',

  // ── V2 TopBar ────────────────────────────────────────────────────────────

  /**
   * @screen WorkspacePage
   * @region TopBar
   * @description V2 워크스페이스 상단 44px 바 루트
   * @file src/web/components/TopBar/TopBar.tsx
   */
  WORK_TOPBAR: 'WORK_TOPBAR',

  /**
   * @screen WorkspacePage
   * @region TopBar
   * @description 트리 아이콘 + 라벨 + 프로젝트 경로 breadcrumb
   * @file src/web/components/TopBar/TopBar.tsx
   */
  WORK_TOPBAR_BREADCRUMB: 'WORK_TOPBAR_BREADCRUMB',

  /**
   * @screen WorkspacePage
   * @region TopBar
   * @description 추론된 도메인 배지 (scanResult.domainContext.primary)
   * @file src/web/components/TopBar/TopBar.tsx
   */
  WORK_TOPBAR_DOMAIN: 'WORK_TOPBAR_DOMAIN',

  /**
   * @screen WorkspacePage
   * @region TopBar
   * @description 재스캔 popover 트리거
   * @file src/web/components/TopBar/TopBar.tsx
   */
  WORK_TOPBAR_RESCAN: 'WORK_TOPBAR_RESCAN',

  /**
   * @screen WorkspacePage
   * @region Left
   * @description 카드 풀 사이드바 트리/프로젝트 정보 헤더
   * @file src/web/components/CardPool/CardPoolSidebar.tsx
   */
  WORK_TREE_HEADER: 'WORK_TREE_HEADER',

  /**
   * @screen WorkspacePage
   * @region Left
   * @description 카드 풀 사이드바 프로젝트 메타데이터(path/framework/files)
   * @file src/web/components/CardPool/CardPoolSidebar.tsx
   */
  WORK_PROJECT_INFO: 'WORK_PROJECT_INFO',
} as const;

export type UiId = (typeof UI_IDS)[keyof typeof UI_IDS];
