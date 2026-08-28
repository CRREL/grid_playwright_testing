import { expect, test } from '@fixtures';
import { useSavedAoi, downloadTile, testMapTableSort } from '@aois';
import { navigateToMap } from '@before-test';
import { exportFileType, finishAndExpectExport, showAdvancedSettings, specifyCellSize } from '@exports';
import { enableDataLayer } from '@layers';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
  await enableDataLayer(page, "thematic layers");
  await useSavedAoi(page, "at_aoi_ukraine");
});

test.describe('export thematic rasters', () => {
  test('thematic rasters map table sort', async ({ page }) => {
    await testMapTableSort(page);
  });

  test('thematic rasters merge by collect', async ({ page }) => {
    await page.getByRole('row', { name: 'Select Row' }).first().getByRole('checkbox').check();
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

  test('thematic rasters specify cell size', async ({ page }) => {
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

  test('thematic rasters export GeoTiff', async ({ page }) => {
    await exportFileType(page, 'GeoTiff');
  });

  test('thematic rasters export TAK Format', async ({ page }) => {
    await exportFileType(page, 'TAK Format');
  });

  test('thematic rasters export National Imagery Transmission Format', async ({ page }) => {
    await exportFileType(page, 'National Imagery Transmission Format');
  });

  test('thematic rasters export Source Format', async ({ page }) => {
    await exportFileType(page, 'Source Format');
  });
  
  test('thematic layers download tile', async ({ page }) => {
    await downloadTile(page);
  });
});