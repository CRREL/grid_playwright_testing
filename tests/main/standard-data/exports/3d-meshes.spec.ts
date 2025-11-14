import { expect, Page, test } from '../../../../fixtures';
import { baseURL } from '../../../../playwright.config';
import { isSorted, useSavedAoi } from '../../../../utils/aois';
import { navigateToMap } from '../../../../utils/before-test';
import { finishAndExpectExport } from '../../../../utils/exports';
import { enableDataLayer } from '../../../../utils/layers';
import { getJSON, waitForApiResponse } from '../../../../utils/network';

const exportFileType = async (page: Page, fileType: string) => {
  await page.route(`${baseURL}/api/drf/mapexport`, async route => {
    const json = getJSON(route);
    expect(json !== null).toBeTruthy();
    await route.continue({postData: JSON.stringify({ ...json, warn: false })});
  });
  
  await enableDataLayer(page, "3d meshes / scenes");
  await useSavedAoi(page, "at_aoi_3d_meshes");

  await waitForApiResponse(page, 'maptable?*');
  const checkbox = page.getByRole('row').filter({ hasText: fileType }).getByRole('checkbox').first();
  await expect(checkbox).toBeVisible();
  await checkbox.click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await finishAndExpectExport(page);
}

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('export 3d meshes - scenes', () => {
  test('meshes map table sort', async ({ page }) => {
    await enableDataLayer(page, "3d meshes / scenes");
    await useSavedAoi(page, "at_aoi_3d_meshes");

    await waitForApiResponse(page, 'maptable?*');
    const product = page.getByRole('button', { name: 'Product', exact: true });
    await expect(product).toBeVisible();
    await product.click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsBefore = await page.locator('td#product').allTextContents();
    expect(programsBefore.length > 1).toBeTruthy();
    expect(isSorted(programsBefore, 'ascending')).toBeTruthy();

    await product.click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsAfter = await page.locator('td#product').allTextContents();
    expect(isSorted(programsAfter, 'descending')).toBeTruthy();
  });

  test('meshes streaming url', async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await enableDataLayer(page, "3d meshes / scenes");
    await useSavedAoi(page, "at_aoi_3d_meshes");

    await waitForApiResponse(page, 'maptable?*');
    await page.evaluateHandle(() => navigator.clipboard.writeText(""));
    const handleBefore = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentBefore = await handleBefore.jsonValue();
    expect(clipboardContentBefore === "").toBeTruthy();

    const span = page.getByRole('row', { name: 'Copy URL' }).first().locator('span');
    await expect(span).toBeVisible();
    await span.click();

    const handleAfter = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentAfter = await handleAfter.jsonValue();
    expect(clipboardContentAfter !== "").toBeTruthy();

    await expect(page.getByText('Streaming Url Copied to')).toBeVisible();
  });

  test('meshes export 3D Tile', async ({ page }) => {
    await exportFileType(page, '3D Tile');
  });

  test('meshes export I3S', async ({ page }) => {
    await exportFileType(page, 'Indexed 3D Scene (I3S)');
  });
});