import { test, expect } from '@fixtures';
import { useSavedAoi, testMapTableSort } from '@aois';
import { navigateToMap } from '@before-test';
import { exportFileType, finishAndExpectExport, showAdvancedSettings, specifyCellSize } from '@exports';
import { enableDataLayer } from '@layers';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
  await enableDataLayer(page, "elevation models");
});

test.describe('export elevation models', () => {
  test('elevation model map table sort', async ({ page }) => {
    await useSavedAoi(page, "at_aoi_ukraine");
    await testMapTableSort(page);
  });

  test('elevation models merge by collect', async ({ page }) => {
    await useSavedAoi(page, "at_aoi_em_buckeye");
    await page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    await showAdvancedSettings(page, 'GeoTiff');
    await page.getByRole('radio').nth(1).click();

    await page.waitForResponse(response => { 
      const json = response.request().postDataJSON();
      expect(json !== null && json.file_export_options === 'collect');
      return response.request().method() === 'PATCH' && response.status() === 200;
    });
    await finishAndExpectExport(page);
  });

  test('elevation models specify cell size', async ({ page }) => {
    await useSavedAoi(page, "at_aoi_ukraine");
    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    await showAdvancedSettings(page, 'GeoTiff');
    await specifyCellSize(page, '2');

    await page.waitForResponse(response => { 
      const json = response.request().postDataJSON();
      expect(json !== null && json.target_cell_size === 2);
      return response.request().method() === 'PATCH' && response.status() === 200;
    });
    await finishAndExpectExport(page);
  });

  test('elevation models export GeoTiff', async ({ page }) => {
    await useSavedAoi(page, "at_aoi_ukraine");
    await exportFileType(page, 'GeoTiff');
  });

  test('elevation models export TAK Format', async ({ page }) => {
    await useSavedAoi(page, "at_aoi_ukraine");
    await exportFileType(page, 'TAK Format');
  });

  test('elevation models export BAG', async ({ page }) => {
    await useSavedAoi(page, "at_aoi_ukraine");
    await exportFileType(page, 'BAG');
  });

  test('elevation models export National Imagery Transmission Format', async ({ page }) => {
    await useSavedAoi(page, "at_aoi_ukraine");
    await exportFileType(page, 'National Imagery Transmission Format');
  });

  test('elevation models export Source Format', async ({ page }) => {
    await useSavedAoi(page, "at_aoi_ukraine");
    await exportFileType(page, 'Source Format');
  });

  test('elevation models download tile', async ({ page }) => {
    test.setTimeout(300000);

    await useSavedAoi(page, "at_aoi_ukraine");
    await page.getByText('Data Tiles').click();
    await page.getByRole('checkbox', { name: 'Select row' }).last().check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });

  test('elevation models view html metadata', async ({ page }) => {
    await useSavedAoi(page, "at_aoi_ukraine");

    await page.getByText('Data Tiles').click();
    const row = page.getByRole('row', { name: 'DGED5' }).first();
    await row.getByRole('checkbox').first().check();

    const page1Promise = page.waitForEvent('popup');
    await row.getByTitle('View Report').click();
    const page1 = await page1Promise;
  });
});