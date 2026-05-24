import { expect, test } from '@playwright/test';
import { buildSeedSession } from './seed-session.js';

const TREE_ID = 'feature-impl';
const ACTIVE_CARD_COUNT = 5;

test.describe.configure({ mode: 'serial' });

test('Settings — 테마 3지 변경 + 기본 셸 선택 PUT/GET 왕복', async ({ page, context }) => {
  const session = buildSeedSession(TREE_ID, ACTIVE_CARD_COUNT);
  const sessionKey = `promptcraft:session:${TREE_ID}`;

  await page.addInitScript(
    (args: { session: unknown; key: string; treeId: string }) => {
      localStorage.setItem(args.key, JSON.stringify(args.session));
      history.replaceState({ type: 'workspace', treeId: args.treeId, projectPath: '' }, '', `/workspace/${args.treeId}`);
    },
    { session, key: sessionKey, treeId: TREE_ID }
  );

  await page.goto('/');

  // 세션 복원 다이얼로그 처리 → 워크스페이스 진입
  const restore = page.locator('[data-ui-id="WORK_RESTORE_DIALOG"]');
  await restore.waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('button', { name: '이어서 하기' }).click();
  await restore.waitFor({ state: 'hidden', timeout: 10_000 });

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
