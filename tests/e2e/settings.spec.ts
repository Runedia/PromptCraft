import { expect, test } from '@playwright/test';
import { buildSeedSession, enterWorkspaceWithSession } from './seed-session.js';

const TREE_ID = 'feature-impl';
const ACTIVE_CARD_COUNT = 5;

test.describe.configure({ mode: 'serial' });

test('Settings — 테마 3지 변경 + 기본 셸 선택 PUT/GET 왕복', async ({ page, context }) => {
  const session = buildSeedSession(TREE_ID, ACTIVE_CARD_COUNT);

  await enterWorkspaceWithSession(page, session);

  // Settings 열기
  await page.locator('[data-ui-id="WORK_ACTIONBAR_SETTINGS"]').click();
  const sheet = page.locator('[data-ui-id="WORK_SETTINGS_SHEET"]');
  await expect(sheet).toBeVisible();

  // 테마: 다크 → html.dark 적용
  const html = page.locator('html');
  await sheet.locator('#theme-dark').click();
  await expect(sheet.locator('#theme-dark')).toBeChecked();
  await expect(html).toHaveClass(/dark/);

  // 테마: 라이트 → html.dark 제거
  await sheet.locator('#theme-light').click();
  await expect(sheet.locator('#theme-light')).toBeChecked();
  await expect(html).not.toHaveClass(/dark/);

  // 테마: 시스템 (headless 기본 prefers-color-scheme: light → html.dark 없음)
  await sheet.locator('#theme-system').click();
  await expect(sheet.locator('#theme-system')).toBeChecked();
  await expect(html).not.toHaveClass(/dark/);

  // 셸: powershell 선택 → PUT /api/config 검증
  const putPromise = page.waitForResponse((res) => res.url().endsWith('/api/config') && res.request().method() === 'PUT', { timeout: 10_000 });
  await sheet.locator('#shell-powershell').click();
  const put = await putPromise;
  expect(put.ok()).toBe(true);
  expect(put.request().postDataJSON()).toEqual({ 'run.shell': 'powershell' });

  // 닫고 재오픈 → GET이 저장값(powershell) 반영
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await page.locator('[data-ui-id="WORK_ACTIONBAR_SETTINGS"]').click();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('#shell-powershell')).toBeChecked();

  await context.close();
});

test('Settings — AI 다듬기 모델 combobox 선택 PUT + 새로고침 재조회', async ({ page, context }) => {
  const MODELS = ['llama-3.1-8b-instruct', 'qwen2.5-coder-7b'];
  let statusCalls = 0;
  // /api/llm/status는 로컬 LLM 의존이라 e2e 서버에선 빈 목록 → combobox 항목 검증 위해 모킹.
  await page.route('**/api/llm/status', async (route) => {
    statusCalls += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: true, models: MODELS }) });
  });

  const session = buildSeedSession(TREE_ID, ACTIVE_CARD_COUNT);
  await enterWorkspaceWithSession(page, session);

  await page.locator('[data-ui-id="WORK_ACTIONBAR_SETTINGS"]').click();
  const sheet = page.locator('[data-ui-id="WORK_SETTINGS_SHEET"]');
  await expect(sheet).toBeVisible();
  await expect.poll(() => statusCalls).toBeGreaterThanOrEqual(1);

  // combobox 열기 → 항목 선택 → refine.model PUT 검증
  const trigger = sheet.locator('[data-ui-id="WORK_SETTINGS_REFINE_MODEL"]');
  await trigger.click();
  const putModel = page.waitForResponse(
    (res) =>
      res.url().endsWith('/api/config') &&
      res.request().method() === 'PUT' &&
      Boolean((res.request().postDataJSON() as Record<string, unknown>)?.['refine.model']),
    { timeout: 10_000 }
  );
  await page.getByRole('option', { name: MODELS[1] }).click();
  const put = await putModel;
  expect(put.ok()).toBe(true);
  expect(put.request().postDataJSON()).toEqual({ 'refine.model': MODELS[1] });
  // 선택값이 트리거에 반영
  await expect(trigger).toContainText(MODELS[1]);

  // 새로고침 버튼 → status 재조회 발생
  const before = statusCalls;
  const statusAgain = page.waitForResponse((res) => res.url().includes('/api/llm/status'), { timeout: 10_000 });
  await sheet.locator('[data-ui-id="WORK_SETTINGS_REFINE_REFRESH"]').click();
  await statusAgain;
  expect(statusCalls).toBeGreaterThan(before);

  await context.close();
});

test('Settings — AI 다듬기 엔드포인트/API키/임계값 입력이 되돌려지지 않는다 (불안정 t 회귀)', async ({ page, context }) => {
  // 회귀 가드: useT()가 매 렌더 새 함수 참조를 반환하면 config-load effect([open, t])가
  // 키 입력마다 재실행되어 GET /api/config가 입력값을 저장값으로 덮는다. onBlur 저장 필드
  // (baseUrl/apiKey/threshold)만 영향받는다 — 입력 중에는 PUT이 아직 안 나가기 때문.
  const STORED: Record<string, string> = {
    'run.shell': 'cmd',
    'refine.baseUrl': 'http://stored.example/v1',
    'refine.apiKey': 'stored-key',
    'refine.threshold': '50',
  };
  let configGets = 0;
  await page.route('**/api/config', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      configGets += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(STORED) });
      return;
    }
    // PUT(onBlur 저장) — 단순 200.
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  // 로컬 LLM 의존 제거: 빈 목록.
  await page.route('**/api/llm/status', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: false, models: [] }) });
  });

  const session = buildSeedSession(TREE_ID, ACTIVE_CARD_COUNT);
  await enterWorkspaceWithSession(page, session);

  await page.locator('[data-ui-id="WORK_ACTIONBAR_SETTINGS"]').click();
  const sheet = page.locator('[data-ui-id="WORK_SETTINGS_SHEET"]');
  await expect(sheet).toBeVisible();

  const baseUrl = sheet.locator('#refine-baseurl');
  const apiKey = sheet.locator('#refine-apikey');
  const threshold = sheet.locator('#refine-threshold');

  // 초기 로드: 저장값 반영
  await expect(baseUrl).toHaveValue(STORED['refine.baseUrl']);

  // 엔드포인트 입력 → 입력으로 유발된 비동기 config GET이 값을 덮을 시간을 준 뒤(부재 검증) 유지 확인.
  const TYPED_URL = 'http://typed.example:9999/v1';
  await baseUrl.fill(TYPED_URL);
  await page.waitForTimeout(600);
  await expect(baseUrl).toHaveValue(TYPED_URL);

  // 임계값 입력
  const TYPED_THRESHOLD = '72';
  await threshold.fill(TYPED_THRESHOLD);
  await page.waitForTimeout(600);
  await expect(threshold).toHaveValue(TYPED_THRESHOLD);

  // API 키 입력
  const TYPED_KEY = 'typed-secret-key';
  await apiKey.fill(TYPED_KEY);
  await page.waitForTimeout(600);
  await expect(apiKey).toHaveValue(TYPED_KEY);

  // 근본 원인 핀: config GET은 시트 오픈당 1회만이어야 한다(입력으로 재발화 금지).
  expect(configGets).toBe(1);

  await context.close();
});

test('Settings — 새로고침 후 기존 선택 모델이 새 목록에 없으면 선택을 비운다', async ({ page, context }) => {
  let statusCalls = 0;
  await page.route('**/api/llm/status', async (route) => {
    statusCalls += 1;
    // 1차(open): gone-model 포함 / 2차(refresh): gone-model 빠짐.
    const models = statusCalls === 1 ? ['gone-model', 'keep'] : ['fresh-a', 'fresh-b'];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: true, models }) });
  });
  await page.route('**/api/config', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 'refine.model': 'gone-model', 'refine.baseUrl': 'http://x/v1', 'refine.threshold': '50' }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  const session = buildSeedSession(TREE_ID, ACTIVE_CARD_COUNT);
  await enterWorkspaceWithSession(page, session);

  await page.locator('[data-ui-id="WORK_ACTIONBAR_SETTINGS"]').click();
  const sheet = page.locator('[data-ui-id="WORK_SETTINGS_SHEET"]');
  await expect(sheet).toBeVisible();

  const trigger = sheet.locator('[data-ui-id="WORK_SETTINGS_REFINE_MODEL"]');
  // 저장값(gone-model)이 초기 표시된다.
  await expect(trigger).toContainText('gone-model');
  await expect.poll(() => statusCalls).toBeGreaterThanOrEqual(1);

  // 새로고침 → 새 목록에 gone-model 없음 → 선택 비우기 + refine.model='' PUT(영속화).
  const putEmpty = page.waitForResponse(
    (res) =>
      res.url().endsWith('/api/config') &&
      res.request().method() === 'PUT' &&
      Object.hasOwn((res.request().postDataJSON() as Record<string, unknown>) ?? {}, 'refine.model'),
    { timeout: 10_000 }
  );
  await sheet.locator('[data-ui-id="WORK_SETTINGS_REFINE_REFRESH"]').click();
  const put = await putEmpty;
  expect(put.request().postDataJSON()).toEqual({ 'refine.model': '' });
  await expect(trigger).not.toContainText('gone-model');

  await context.close();
});

test('Settings — 새로고침 후 기존 선택 모델이 새 목록에 여전히 있으면 선택을 유지한다', async ({ page, context }) => {
  let modelPuts = 0;
  await page.route('**/api/llm/status', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: true, models: ['keep-model', 'other'] }) });
  });
  await page.route('**/api/config', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 'refine.model': 'keep-model', 'refine.baseUrl': 'http://x/v1', 'refine.threshold': '50' }),
      });
      return;
    }
    if (req.method() === 'PUT' && Object.hasOwn((req.postDataJSON() as Record<string, unknown>) ?? {}, 'refine.model')) {
      modelPuts += 1;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  const session = buildSeedSession(TREE_ID, ACTIVE_CARD_COUNT);
  await enterWorkspaceWithSession(page, session);

  await page.locator('[data-ui-id="WORK_ACTIONBAR_SETTINGS"]').click();
  const sheet = page.locator('[data-ui-id="WORK_SETTINGS_SHEET"]');
  await expect(sheet).toBeVisible();
  const trigger = sheet.locator('[data-ui-id="WORK_SETTINGS_REFINE_MODEL"]');
  await expect(trigger).toContainText('keep-model');

  const statusAgain = page.waitForResponse((res) => res.url().includes('/api/llm/status'), { timeout: 10_000 });
  await sheet.locator('[data-ui-id="WORK_SETTINGS_REFINE_REFRESH"]').click();
  await statusAgain;
  await page.waitForTimeout(400);
  // 목록에 여전히 있으므로 선택 유지 + refine.model PUT 미발생.
  await expect(trigger).toContainText('keep-model');
  expect(modelPuts).toBe(0);

  await context.close();
});
