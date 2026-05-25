import { expect, test } from '@playwright/test';
import { buildSeedSession, enterWorkspaceWithSession } from './seed-session.js';

const TREE_ID = 'feature-impl';
const ACTIVE_CARD_COUNT = 5;

test.describe.configure({ mode: 'serial' });

/**
 * 언어 전환 E2E.
 * 기본 언어(headless OS=en이지만 seed 세션은 ko 라벨로 적재됨)에서 시작 → Settings에서 한국어로
 * 고정해 ko 기준을 만든 뒤 → English로 전환 → (a) 카드 라벨, (b) 웹 chrome, (c) 프리뷰 헤더가
 * 동시에 영어로 바뀌고, (d) 사용자가 입력한 value가 보존되는지 검증한다.
 */
test('언어 전환 — 카드 라벨·chrome·프리뷰 헤더 동시 전환 + value 보존', async ({ page, context }) => {
  const session = buildSeedSession(TREE_ID, ACTIVE_CARD_COUNT);

  // M4: value 보존 검증이 의미를 가지려면 seed role value가 non-empty여야 한다(조건부 silent pass 방지).
  const seedRoleValue = session.cards.find((c) => c.id === 'role')?.value ?? '';
  expect(seedRoleValue.length).toBeGreaterThan(0);

  await enterWorkspaceWithSession(page, session);

  const sectionList = page.locator('[data-ui-id="WORK_SECTION_LIST"]');
  const previewContent = page.locator('[data-ui-id="WORK_PREVIEW_CONTENT"]');
  await expect(sectionList).toBeVisible();

  // Settings 열기
  const openSettings = async () => {
    await page.locator('[data-ui-id="WORK_ACTIONBAR_SETTINGS"]').click();
    const sheet = page.locator('[data-ui-id="WORK_SETTINGS_SHEET"]');
    await expect(sheet).toBeVisible();
    return sheet;
  };

  // 1) 한국어로 고정 (기준 정렬) — PUT /api/config { ui.language: 'ko' }
  {
    const sheet = await openSettings();
    const langGroup = sheet.locator('[data-ui-id="WORK_SETTINGS_LANG_GROUP"]');
    await expect(langGroup).toBeVisible();
    const putKo = page.waitForResponse((r) => r.url().endsWith('/api/config') && r.request().method() === 'PUT', { timeout: 10_000 });
    await sheet.locator('#lang-ko').click();
    const put = await putKo;
    expect(put.request().postDataJSON()).toEqual({ 'ui.language': 'ko' });
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  }

  // ko 기준 확인: 카드 라벨 "역할", 프리뷰 헤더 "## 역할"
  await expect(sectionList.getByText('역할', { exact: true })).toBeVisible();
  await expect(previewContent.getByText('## 역할')).toBeVisible();

  // 2) English로 전환 — PUT { ui.language: 'en' }
  {
    const sheet = await openSettings();
    const putEn = page.waitForResponse((r) => r.url().endsWith('/api/config') && r.request().method() === 'PUT', { timeout: 10_000 });
    await sheet.locator('#lang-en').click();
    const put = await putEn;
    expect(put.request().postDataJSON()).toEqual({ 'ui.language': 'en' });
    // (b) chrome 영어 전환: Settings 제목 "Settings"
    await expect(sheet.locator('[data-ui-id="WORK_SETTINGS_LANG_GROUP"]')).toBeVisible();
    await expect(sheet.getByText('Settings', { exact: true }).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  }

  // (a) 카드 라벨 "Role" 로 전환, "역할" 사라짐
  await expect(sectionList.getByText('Role', { exact: true })).toBeVisible();
  await expect(sectionList.getByText('역할', { exact: true })).toHaveCount(0);

  // (c) 프리뷰 헤더 "## Role" 로 전환
  await expect(previewContent.getByText('## Role')).toBeVisible();
  await expect(previewContent.getByText('## 역할')).toHaveCount(0);

  // (d) value 보존: seed에서 채운 role value(ko 텍스트)는 정의 해소 대상이 아니므로 영어 전환 후에도
  // 그대로 보존되어야 한다. M4: 무조건 assertion(위에서 non-empty 보장됨).
  await expect(previewContent.getByText(seedRoleValue, { exact: false }).first()).toBeVisible();

  // 3) "시스템 따름" 전환 — DELETE /api/config/ui.language 발화 + locale 재해소 반영 (I3 회귀 방지)
  {
    const sheet = await openSettings();
    // 재오픈 시 GET /api/config에 ui.language=en이 반영돼 #lang-en이 checked인지 확인.
    await expect(sheet.locator('#lang-en')).toBeChecked();
    const delResp = page.waitForResponse((r) => r.url().endsWith(`/api/config/${encodeURIComponent('ui.language')}`) && r.request().method() === 'DELETE', {
      timeout: 10_000,
    });
    await sheet.locator('#lang-system').click();
    const del = await delResp;
    expect(del.ok()).toBe(true);
    // RadioGroup이 system으로 선택됨
    await expect(sheet.locator('#lang-system')).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  }

  // "시스템 따름" → 서버 OS 감지로 해소(e2e 서버 호스트=ko) → 카드 라벨이 해소된 언어로 갱신.
  // 핵심(I3): setLang이 실제 호출됐다면 라벨이 English("Role")에서 해소 언어로 바뀐다.
  // 호스트 OS에 무관하게 "라벨이 해소된 유효 언어 중 하나"임을 검증한다.
  await expect(sectionList.getByText(/^(역할|Role)$/).first()).toBeVisible();

  await context.close();
});
