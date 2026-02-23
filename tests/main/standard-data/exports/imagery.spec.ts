import { expect, test } from '@fixtures';
import { baseURL } from '@playwright.config';
import { isSorted, useSavedAoi } from '@aois';
import { navigateToMap } from '@before-test';
import { exportFileType, finishAndExpectExport } from '@exports';
import { enableDataLayer } from '@layers';
import { verifyExport, waitForApiResponse } from '@network';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
  await enableDataLayer(page, "imagery");
  await useSavedAoi(page, "at_aoi_imagery");
});

test.describe('export imagery', () => {
  test('imagery map table sort', async ({ page }) => {
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

  test('imagery merge by collect', async ({ page }) => {
    let callCount = 0;
    const validation = (json: any) => ++callCount && json?.file_export_options === 'collect';
    await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => await verifyExport(route, 'PATCH', validation));

    await page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    await page.getByRole('radio').nth(1).click();
    expect(callCount).toEqual(1);
    await finishAndExpectExport(page);
  });

  test('imagery specify cell size', async ({ page }) => {
    let callCount = 0;
    const validation = (json: any) => ++callCount && json?.target_cell_size === 2;
    await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => await verifyExport(route, 'PATCH', validation));

    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    await page.getByRole('checkbox', { name: 'Use source file cell size(s)' }).uncheck();
    const targetResolution = page.getByPlaceholder('enter value');
    await targetResolution.click();
    await targetResolution.press('ControlOrMeta+a');
    await targetResolution.fill('2');
    await page.waitForResponse(response => response.request().method() === 'PATCH' && response.status() === 200);
    expect(callCount).toEqual(1);
    await finishAndExpectExport(page);
  });

  test('imagery export GeoTiff', async ({ page }) => {
    await exportFileType(page, 'GeoTiff');
  });

  test('imagery export TAK Format', async ({ page }) => {
    await exportFileType(page, 'GeoTiff');
  });

  test('imagery export JP2OpenJPEG', async ({ page }) => {
    await exportFileType(page, 'TAK Format');
  });

  test('imagery export National Imagery Transmission Format', async ({ page }) => {
    await exportFileType(page, 'National Imagery Transmission Format');
  });

  test('imagery export Source Format', async ({ page }) => {
    await exportFileType(page, 'Source Format');
  });

  test('imagery download tile', async ({ page }) => {
    test.setTimeout(300000);

    await page.getByText('Data Tiles').click();

    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });
});