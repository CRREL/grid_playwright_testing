import { expect, test } from '@fixtures';
import { isSorted, useDefaultAoi } from '@aois';
import { navigateToMap } from '@before-test';
import { exportFileType } from '@exports';
import { enableDataLayer } from '@layers';
import { waitForApiResponse } from '@network';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
  await enableDataLayer(page, "features");
  await useDefaultAoi(page);
});

test.describe('export features', () => {
  test('features map table sort', async ({ page }) => {
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

    await page.getByText('Data Tiles').click();

    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });
});