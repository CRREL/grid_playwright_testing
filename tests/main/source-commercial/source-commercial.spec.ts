import { expect, Page, test } from "@fixtures";
import { baseURL } from "@playwright.config";
import { isSorted, useSavedAoi } from "@aois";
import { navigateToMap } from "@before-test";
import { finishAndExpectExport, selectFileFormat, showAdvancedSettings } from "@exports";
import { finishExport, waitForApiResponse } from "@network";

const getFeatureLayerLoc = (page: Page, layer: string) => {
  const layers = layer.split('/');
  let loc = page.locator('.align-items-center').filter({hasText: layers[0]});
  for (let i = 1; i < layers.length; i++) {
    loc = loc.locator('.list-group-item').filter({hasText: layers[i]});
  }
  return loc.locator('.btn.header-checkbox').first();
}

const enableDatalayer = async (page: Page) => {
  await page.getByRole('button', { name: 'Data' }).click();
  await page.getByRole('button', { name: 'Reset all filters' }).click();
  await page.waitForTimeout(1000);
  await page.getByText('FeaturesCommercial Data and').getByText("Features", { exact: true }).locator('//preceding-sibling::*').click();
  await page.getByRole('button', { name: 'Expand Layer Expand Layer' }).click();
  await page.waitForTimeout(1000);
  
  await expect(page.locator('.alert.alert-secondary')).not.toBeVisible();
  expect(await page.locator('.rounded-pill').count()).toEqual(0);

  if (await page.locator('.fa-folder-open').count() > 0) {
    await page.getByRole('button', { name: 'Expand Layer Expand Layer' }).click();
  }
  await page.getByRole('button', { name: 'Expand Layer Expand Layer' }).click();

  await getFeatureLayerLoc(page, 'Commercial Data and Analytic Services/Active Products/Petroleum Storage/<= 2025-12-03').click();
}

const exportFileType = async (page: Page, fileType: string) => {
  await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => await finishExport(route));

  await selectFirstAndExport(page, 'Individual Features');
  await selectFileFormat(page, fileType);
  await finishAndExpectExport(page);
}

const selectFirstAndExport = async (page: Page, type: 'Data Sets' | 'Individual Features') => {
  await page.getByText(type, { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select row' }).first().check();
  await page.locator('.bottom-drawer').getByRole('button', { name: 'Export'}).click();
}

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
  await enableDatalayer(page);
  await useSavedAoi(page, "at_aoi_source_com");
});

test.describe('source commercial', () => {
  test('features map table sort', async ({ page }) => {
    await page.getByText('Individual Features', { exact: true }).click();
    
    const ogr = page.getByRole('button', { name: 'Fillbarrels' });
    await ogr.click();
    await page.waitForTimeout(500);
    const featuresBefore = await page.locator('td#fillbarrels').allTextContents();
    expect(featuresBefore.length > 1 && isSorted(featuresBefore, 'ascending', 'number')).toBeTruthy();

    await ogr.click();
    await page.waitForTimeout(500);
    const featuresAfter = await page.locator('td#fillbarrels').allTextContents();
    expect(isSorted(featuresAfter, 'descending', 'number')).toBeTruthy();
  });

  test('layer export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => await finishExport(route));
    
    await selectFirstAndExport(page, 'Data Sets');
    await finishAndExpectExport(page);
  });

  test('layer global export', async ({ page }) => {
    await selectFirstAndExport(page, 'Data Sets');
    await showAdvancedSettings(page);
    await page.getByText('Global Export').locator('//following-sibling::*').getByRole('checkbox').click();
    await page.waitForResponse(response => { 
      const json = response.request().postDataJSON();
      expect(json !== null && json.cds_global);
      return response.request().method() === 'PATCH' && response.status() === 200;
    });
    await finishAndExpectExport(page);
  });

  test('single feature export', async ({ page }) => {
    await selectFirstAndExport(page, 'Individual Features');
    await finishAndExpectExport(page);
  });

  test('multiple features export', async ({ page }) => {
    await page.getByText('Individual Features', { exact: true }).click();
    await waitForApiResponse(page, 'cdsmap/attributetable/cdsfilterlayer/*');

    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select row 2', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select row 3', exact: true }).check();
    await page.getByRole('button', { name: 'Export features', exact: true }).click();
    await page.waitForResponse(response => { 
      const json = response.request().postDataJSON();
      expect(json !== null && json.cds_feature_ids?.length === 3);
      return response.request().method() === 'PATCH' && response.status() === 200;
    });
    await finishAndExpectExport(page);
  });

  test('feature export GeoPackage', async ({ page }) => {
    await exportFileType(page, 'GeoPackage');
  });

  test('feature export GML', async ({ page }) => {
    await exportFileType(page, 'GML');
  });

  test('feature export SQLite', async ({ page }) => {
    await exportFileType(page, 'SQLite');
  });

  test('feature export ESRI Shapefile', async ({ page }) => {
    await exportFileType(page, 'ESRI Shapefile');
  });

  test('feature export KMZ', async ({ page }) => {
    await exportFileType(page, 'KMZ');
  });

  test('feature export flatgeobuf', async ({ page }) => {
    await exportFileType(page, 'flatgeobuf');
  });

  test('feature export GeoParquet', async ({ page }) => {
    await exportFileType(page, 'GeoParquet');
  });

  test('feature export GeoJSON', async ({ page }) => {
    await exportFileType(page, 'GeoJSON');
  });
});
