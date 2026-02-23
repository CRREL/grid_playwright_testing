import { test, expect } from '@fixtures';
import { baseURL } from '@playwright.config';
import { isSorted, useDefaultAoi } from '@aois';
import { navigateToMap } from '@before-test';
import { exportFileType, finishAndExpectExport } from '@exports';
import { enableDataLayer } from '@layers';
import { verifyExport, waitForApiResponse } from '@network';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('other pointcloud tests', () => {
  test('pointcloud streaming url', async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole('button', { name: 'Data Layers' }).click();
    await page.getByRole('button', { name: 'Reset all filters' }).click();
    await page.getByText('Pointclouds').locator('//following-sibling::*').click();
    await page.getByRole('checkbox', { name: 'Visualizable in browser (data tiles)' }).check();
    await useDefaultAoi(page);

    await page.evaluateHandle(() => navigator.clipboard.writeText(""));
    const handleBefore = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentBefore = await handleBefore.jsonValue();
    expect(clipboardContentBefore === "").toBeTruthy();

    await waitForApiResponse(page, 'maptable?*');
    await page.getByText('Data Tiles').click();

    await waitForApiResponse(page, 'maptable?*');
    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('row', { name: 'Copy URL' }).first().locator('span').click();

    const handleAfter = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentAfter = await handleAfter.jsonValue();
    expect(clipboardContentAfter !== "").toBeTruthy();

    await expect(page.getByText('Streaming Url Copied to')).toBeVisible();
  });
});

test.describe('export pointclouds', () => {
  test.beforeEach(async ({ page, context }) => {
    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);
  });

  test('pointcloud map table sort', async ({ page }) => {
    const program = page.getByRole('button', { name: 'Program' });
    await program.click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsBefore = await page.locator('td#program').allTextContents();
    expect(programsBefore.length > 1 && isSorted(programsBefore, 'ascending')).toBeTruthy();

    await program.click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsAfter = await page.locator('td#program').allTextContents();
    expect(isSorted(programsAfter, 'descending')).toBeTruthy();
  });

  test('pointcloud to dem export', async ({ page }) => {
    let callCount = 0;
    const validation = (json: any) => ++callCount && json?.pc_to_dem;
    await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => await verifyExport(route, 'PATCH', validation));

    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    await page.getByText('Convert the pointcloud into a digital elevation model.').locator('//preceding-sibling::*').click();
    expect(callCount).toEqual(1);
    await finishAndExpectExport(page);
  });

  test('pointcloud to dem warning', async ({ page }) => {
    await page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    await page.getByText('Convert the pointcloud into a digital elevation model.').locator('//preceding-sibling::*').click();
    await expect(page.locator('.d-flex > .form-control')).toBeVisible();
  });

  test('pointcloud merge by collect', async ({ page }) => {
    let callCount = 0;
    const validation = (json: any) => ++callCount && json?.file_export_options === 'collect';
    await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => await verifyExport(route, 'PATCH', validation));

    await page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    await page.getByRole('radio').nth(1).click();
    expect(callCount).toEqual(1);
    await finishAndExpectExport(page);
  });

  test('pointcloud decimate', async ({ page }) => {
    let callCount = 0;
    const validation = (json: any) => ++callCount && json?.decimation_radius === 1;
    await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => await verifyExport(route, 'PATCH', validation));

    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    await page.getByText('Decimate export').getByRole('checkbox').click();
    const decimate = page.locator('#decimationRadius');
    await decimate.click();
    await decimate.press('Shift+ArrowLeft');
    await decimate.fill('1');
    await page.waitForResponse(response => response.request().method() === 'PATCH' && response.status() === 200);
    expect(callCount).toEqual(1);
    await finishAndExpectExport(page);
  });

  test('pointcloud export BPF', async ({ page }) => {
    await exportFileType(page, 'BPF');
  });

  test('pointcloud export LAS 1.4', async ({ page }) => {
    await exportFileType(page, 'LAS 1.4');
  });

  test('pointcloud export CSV', async ({ page }) => {
    await exportFileType(page, 'CSV');
  });

  test('pointcloud export NITF', async ({ page }) => {
    await exportFileType(page, 'NITF');
  });

  test('pointcloud export LAS 1.2', async ({ page }) => {
    await exportFileType(page, 'LAS 1.2');
  });

  test('pointcloud download tile', async ({ page }) => {
    test.setTimeout(300000);

    await page.getByText('Data Tiles').click();
    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });
});