import { expect, Page, test } from '../../../../fixtures';
import { baseURL } from '../../../../playwright.config';
import { isSorted, useDefaultAoi, useSavedAoi } from '../../../../utils/aois';
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

  await enableDataLayer(page, "features");
  await useSavedAoi(page, "FEATURES_TEST_AOI");

  await waitForApiResponse(page, 'maptable?*');
  const select = page.getByRole('checkbox', { name: 'Select row' }).first();
  await expect(select).toBeVisible();
  await select.check();
  await page.getByRole('button', { name: 'Export', exact: true }).click();

  const dropdown = page.locator('.modal-body .layer-select-dropdown');
  await expect(dropdown).toBeVisible();
  await dropdown.click();
  const button = page.getByRole('button', { name: fileType });
  await expect(button).toBeVisible();
  await button.click();
  await finishAndExpectExport(page);
}

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('export features', () => {
  test.describe.configure({ mode: 'default' });

  test('features map table sort', async ({ page }) => {
    await enableDataLayer(page, "features");
    await useDefaultAoi(page);

    await waitForApiResponse(page, 'maptable?*');
    const program = page.getByRole('button', { name: 'Program' });
    await expect(program).toBeVisible();
    await program.click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsBefore = await page.locator('td#program').allTextContents();
    expect(programsBefore.length > 1).toBeTruthy();
    expect(isSorted(programsBefore, 'ascending')).toBeTruthy();

    await program.click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsAfter = await page.locator('td#program').allTextContents();
    expect(isSorted(programsAfter, 'descending')).toBeTruthy();
  });

  test('features export GeoPackage', async ({ page }) => {
    await exportFileType(page, 'GeoPackage');
  });

  test('features export GML', async ({ page }) => {
    await exportFileType(page, 'GML');
  });

  test('features export SQLite', async ({ page }) => {
    await exportFileType(page, 'SQLite');
  });

  test('features export ESRI Shapefile', async ({ page }) => {
    await exportFileType(page, 'ESRI Shapefile');
  });

  test('features export KMZ', async ({ page }) => {
    await exportFileType(page, 'KMZ');
  });

  test('features export flatgeobuf', async ({ page }) => {
    await exportFileType(page, 'flatgeobuf');
  });

  test('features export GeoParquet', async ({ page }) => {
    await exportFileType(page, 'GeoParquet');
  });

  test('features export GeoJSON', async ({ page }) => {
    await exportFileType(page, 'GeoJSON');
  });

  test('features download tile', async ({ page }) => {
    test.setTimeout(300000);

    await enableDataLayer(page, "features");
    await useDefaultAoi(page);

    await waitForApiResponse(page, 'maptable?*');
    const dataTiles = page.getByText('Data Tiles');
    await expect(dataTiles).not.toBeDisabled();
    await dataTiles.click();

    await waitForApiResponse(page, 'maptable?*');
    const select = page.getByRole('checkbox', { name: 'Select row' }).first();
    await expect(select).toBeVisible();
    await select.check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });
});