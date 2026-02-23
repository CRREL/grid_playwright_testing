import { expect, Page, test } from "@fixtures";
import { baseURL } from "@playwright.config";
import { isSorted, useSavedAoi } from "@aois";
import { navigateToMap } from "@before-test";
import { finishAndExpectExport, selectFileFormat } from "@exports";
import { finishExport, verifyExport, waitForApiResponse } from "@network";

const getFeatureLayerLoc = (page: Page, layer: string) => {
  const layers = layer.split('/');
  let loc = page.locator('.align-items-center').filter({hasText: layers[0]});
  for (let i = 1; i < layers.length; i++) {
    loc = loc.locator('.list-group-item').filter({hasText: layers[i]});
  }
  return loc.locator('.btn.header-checkbox').first();
}

const enableDatalayer = async (page: Page) => {
  await page.getByRole('button', { name: 'Features Data' }).click();
  await page.getByRole('button', { name: 'Data Layers' }).click();
  await page.getByRole('button', { name: 'Reset Layer' }).click();
  await waitForApiResponse(page, 'cdsmap/usercdsmaplayerselection/*/');
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

  await selectFirstAndExport(page, 'Features');
  await selectFileFormat(page, fileType);
  await finishAndExpectExport(page);
}

const selectFirstAndExport = async (page: Page, type: 'Layers' | 'Features') => {
  await page.getByText(type, { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select row' }).first().check();
  await page.getByRole('button', { name: `Export ${type.toLocaleLowerCase()}`, exact: true }).click();
}

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
  await enableDatalayer(page);
  await useSavedAoi(page, "at_aoi_source_com");
});

test.describe('source commercial', () => {
  test('features map table sort', async ({ page }) => {
    await page.getByText('Features', { exact: true }).click();
    
    const ogr = page.getByRole('button', { name: 'Ogr Fid' });
    await ogr.click();
    await page.waitForTimeout(500);
    const featuresBefore = await page.locator('td#ogr_fid').allTextContents();
    expect(featuresBefore.length > 1 && isSorted(featuresBefore, 'ascending', 'number')).toBeTruthy();

    await ogr.click();
    await page.waitForTimeout(500);
    const featuresAfter = await page.locator('td#ogr_fid').allTextContents();
    expect(isSorted(featuresAfter, 'descending', 'number')).toBeTruthy();
  });

  test('layer export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => await finishExport(route));
    
    await selectFirstAndExport(page, 'Layers');
    await finishAndExpectExport(page);
  });

  test('layer global export', async ({ page }) => {
    let callCount = 0;
    const validation = (json: any) => ++callCount && json?.cds_global;
    await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => await verifyExport(route, 'PATCH', validation));

    await selectFirstAndExport(page, 'Layers');
    await page.getByText('Global Export').locator('//following-sibling::*').getByRole('checkbox').click();
    expect(callCount).toEqual(1);
    await finishAndExpectExport(page);
  });

  test('single feature export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => finishExport(route));

    await selectFirstAndExport(page, 'Features');
    await finishAndExpectExport(page);
  });

  test('multiple features export', async ({ page }) => {
    let callCount = 0;
    const validation = (json: any) => ++callCount && json?.cds_feature_ids?.length === 3
    await page.route(`${baseURL}/api/drf/mapexport/export/`, async route => verifyExport(route, 'POST', validation));

    await page.getByText('Features', { exact: true }).click();
    await waitForApiResponse(page, 'cdsmap/attributetable/cdsfilterlayer/*');
    await page.waitForTimeout(500);
    expect(await page.getByRole('gridcell', { name: 'Select row' }).count()).toBeGreaterThan(2);

    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select row 2', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select row 3', exact: true }).check();
    await page.getByRole('button', { name: 'Export features', exact: true }).click();
    expect(callCount).toEqual(1);
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
