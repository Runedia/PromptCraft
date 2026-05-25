import { expect, test } from '@playwright/test';
import { buildSeedSession, enterWorkspaceWithSession, injectSession } from './seed-session.js';

const TREE_ID = 'feature-impl';
const ACTIVE_CARD_COUNT = 5;
const PERSIST_KEY = 'promptcraft-preview-mode';
const GFM_CARD_ID = 'goal';
const GFM_VALUE = [
  '## 목표 요약',
  '',
  '- 우선순위 A',
  '- 우선순위 B',
  '',
  '| 항목 | 상태 |',
  '|---|---|',
  '| 빌드 | OK |',
  '| 테스트 | OK |',
  '',
  '- [x] 체크된 항목',
  '- [ ] 미체크 항목',
].join('\n');

test.describe.configure({ mode: 'serial' });

test('PromptPreview 토글 — default 원문 / 미리보기 전환 / localStorage persist / GFM 렌더', async ({ page, context }) => {
  const session = buildSeedSession(TREE_ID, ACTIVE_CARD_COUNT);
  const targetCard = session.cards.find((c) => c.id === GFM_CARD_ID);
  if (targetCard) targetCard.value = GFM_VALUE;

  await enterWorkspaceWithSession(page, session);

  const rawBtn = page.locator('[data-ui-id="WORK_PREVIEW_TOGGLE_RAW"]');
  const renderedBtn = page.locator('[data-ui-id="WORK_PREVIEW_TOGGLE_RENDERED"]');
  const previewContent = page.locator('[data-ui-id="WORK_PREVIEW_CONTENT"]');

  await expect(rawBtn).toBeVisible();
  await expect(renderedBtn).toBeVisible();

  // 1. default = raw
  await expect(rawBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(renderedBtn).toHaveAttribute('aria-pressed', 'false');
  await expect(previewContent).toContainText('## 목표 요약');
  await expect(previewContent).toContainText('- [x] 체크된 항목');
  await expect(previewContent.locator('table')).toHaveCount(0);

  // 2. 미리보기 전환
  await renderedBtn.click();
  await expect(rawBtn).toHaveAttribute('aria-pressed', 'false');
  await expect(renderedBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(previewContent).not.toContainText('## 목표 요약');
  await expect(previewContent.locator('h2').filter({ hasText: '목표 요약' })).toHaveCount(1);
  await expect(previewContent.locator('ul li').first()).toBeVisible();
  await expect(previewContent.locator('table')).toHaveCount(1);
  await expect(previewContent.locator('table tr')).toHaveCount(3);
  const checkboxes = previewContent.locator('input[type="checkbox"]');
  await expect(checkboxes).toHaveCount(2);
  await expect(checkboxes.nth(0)).toBeChecked();
  await expect(checkboxes.nth(1)).not.toBeChecked();

  // 3. localStorage persist 확인
  const persisted = await page.evaluate((key) => localStorage.getItem(key), PERSIST_KEY);
  expect(persisted).not.toBeNull();
  expect(JSON.parse(persisted ?? '{}')?.state?.previewMode).toBe('rendered');

  // 4. 새로고침 후에도 'rendered' 유지 (reload도 마운트 effect 재실행 → /api/trees 재fetch race 동일)
  const treesResp = page.waitForResponse((r) => r.url().includes(`/api/trees/${TREE_ID}`), { timeout: 15_000 });
  await page.reload();
  await treesResp;
  await injectSession(page, session);
  await expect(renderedBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(previewContent.locator('table')).toHaveCount(1);

  // 5. 원문 복귀
  await rawBtn.click();
  await expect(rawBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(previewContent).toContainText('## 목표 요약');
  await expect(previewContent.locator('table')).toHaveCount(0);

  await context.close();
});
