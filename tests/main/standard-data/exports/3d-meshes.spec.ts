import { expect, test } from '../../../../fixtures';
import { baseURL } from '../../../../playwright.config';
import { isSorted, useSavedAoi } from '../../../../utils/aois';
import { navigateToMap } from '../../../../utils/before-test';
import { enableDataLayer } from '../../../../utils/layers';
import { waitForApiResponse } from '../../../../utils/network';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('export 3d meshes - scenes', () => {
  test.describe.configure({ mode: 'default' });

  test('meshes map table sort', async ({ page }) => {
    await enableDataLayer(page, "3d meshes / scenes");
    await useSavedAoi(page, "TEST_AOI_UKRAINE");

    await page.getByRole('button', { name: 'Product', exact: true }).click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsBefore = await page.locator('td#product').allTextContents();
    expect(isSorted(programsBefore, 'ascending')).toBeTruthy();

    await page.getByRole('button', { name: 'Product', exact: true }).click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsAfter = await page.locator('td#product').allTextContents();
    expect(isSorted(programsAfter, 'descending')).toBeTruthy();
  });

  test('meshes streaming url', async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await enableDataLayer(page, "3d meshes / scenes");
    await useSavedAoi(page, "TEST_AOI_UKRAINE");

    await page.evaluateHandle(() => navigator.clipboard.writeText(""));
    const handleBefore = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentBefore = await handleBefore.jsonValue();
    expect(clipboardContentBefore === "").toBeTruthy();

    await page.getByRole('row', { name: 'Copy URL' }).first().locator('span').click();

    const handleAfter = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentAfter = await handleAfter.jsonValue();
    expect(clipboardContentAfter !== "").toBeTruthy();

    await expect(page.getByText('Streaming Url Copied to')).toBeVisible();
  });
});