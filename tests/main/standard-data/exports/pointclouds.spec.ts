import { test, expect } from '../../../../fixtures';
import { baseURL } from '../../../../playwright.config';
import { isSorted, useDefaultAoi } from '../../../../utils/aois';
import { navigateToMap } from '../../../../utils/before-test';
import { finishAndExpectExport } from '../../../../utils/exports';
import { enableDataLayer } from '../../../../utils/layers';
import { getJSON, waitForApiResponse } from '../../../../utils/network';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('export pointclouds', () => {
  test.describe.configure({ mode: 'default' });

  test('pointcloud map table sort', async ({ page }) => {
    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

    await page.getByRole('button', { name: 'Program' }).click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsBefore = await page.locator('td#program').allTextContents();
    expect(isSorted(programsBefore, 'ascending')).toBeTruthy();

    await page.getByRole('button', { name: 'Program' }).click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsAfter = await page.locator('td#program').allTextContents();
    expect(isSorted(programsAfter, 'descending')).toBeTruthy();
  });

  test('pointcloud streaming url', async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole('button', { name: 'Data Layers' }).click();
    await page.getByRole('button', { name: 'Reset all filters' }).click();
    await page.locator('div').filter({ hasText: /^CheckLayer colorPointcloudsLayer filtering$/ }).locator('path').nth(2).click();
    await page.getByRole('checkbox', { name: 'Visualizable in browser (data tiles)' }).check();
    await useDefaultAoi(page);

    await page.evaluateHandle(() => navigator.clipboard.writeText(""));
    const handleBefore = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentBefore = await handleBefore.jsonValue();
    expect(clipboardContentBefore === "").toBeTruthy();

    await page.getByText('Data Tiles').click();
    await page.getByRole('row', { name: 'Copy URL' }).first().locator('span').click();

    const handleAfter = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentAfter = await handleAfter.jsonValue();
    expect(clipboardContentAfter !== "").toBeTruthy();

    await expect(page.getByText('Streaming Url Copied to')).toBeVisible();
  });

  test('pointcloud to dem export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.generate_dem).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page.locator('div:nth-child(5) > .col-10 > .form-check-input').check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await finishAndExpectExport(page);
  });

  test('pointcloud to dem warning', async ({ page }) => {
    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

    await page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page.locator('div:nth-child(5) > .col-10 > .form-check-input').check();
    await expect(page.locator('div:nth-child(5) > .col-10 > .form-control')).toBeVisible();
  });

  test('pointcloud merge by collect', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.file_export_options === 'collect').toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

    await page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page.getByRole('radio').nth(1).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await finishAndExpectExport(page);
  });

  test('pointcloud decimate', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.decimation_radius === 1).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('radio').nth(3).check();
    await page.locator('#decimationRadius').click();
    await page.locator('#decimationRadius').press('Shift+ArrowLeft');
    await page.locator('#decimationRadius').fill('1');
    await finishAndExpectExport(page);
  });

  test('pointcloud download tile', async ({ page }) => {
    test.setTimeout(300000);

    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

    await page.getByText('Data Tiles').click();
    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });
});