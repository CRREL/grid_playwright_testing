import { expect, Page, test } from "../../../fixtures";
import { baseURL } from "../../../playwright.config";
import { isSorted, useSavedAoi } from "../../../utils/aois";
import { navigateToMap } from "../../../utils/before-test";
import { finishAndExpectExport } from "../../../utils/exports";
import { getJSON, waitForApiResponse } from "../../../utils/network";

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

  const loc = getFeatureLayerLoc(page, 'Petroleum, Oil, & Lubricants Storage/Oil Storage (Ursa Black Gold)/2025');
  await expect(loc).toBeVisible();
  await loc.click();
}

const exportFileType = async (page: Page, fileType: string) => {
  await page.route(`${baseURL}/api/drf/mapexport`, async route => {
    const json = getJSON(route);
    expect(json !== null).toBeTruthy();
    await route.continue({postData: JSON.stringify({ ...json, warn: false })});
  });

  await enableDatalayer(page);
  await useSavedAoi(page, "at_aoi_source_com");

  const features = page.getByText('Features', { exact: true });
  await expect(features).not.toBeDisabled();
  await features.click();

  const select = page.getByRole('checkbox', { name: 'Select row' }).first();
  await expect(select).toBeVisible();
  await select.check();
  await page.getByRole('button', { name: 'Export features', exact: true }).click();

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

test.describe('source commercial', () => {
  test('features map table sort', async ({ page }) => {
    await enableDatalayer(page);

    await useSavedAoi(page, "at_aoi_source_com");
    await page.getByText('Features', { exact: true }).click();
    
    const ogr = page.getByRole('button', { name: 'Ogr Fid' });
    await expect(ogr).toBeVisible();
    await ogr.click();
    await page.waitForTimeout(500);
    const featuresBefore = await page.locator('td#ogr_fid').allTextContents();
    expect(featuresBefore.length > 1).toBeTruthy();
    expect(isSorted(featuresBefore, 'ascending', 'number')).toBeTruthy();

    await ogr.click();
    await page.waitForTimeout(500);
    const featuresAfter = await page.locator('td#ogr_fid').allTextContents();
    expect(isSorted(featuresAfter, 'descending', 'number')).toBeTruthy();
  });

  test('layer export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });
    
    await enableDatalayer(page);
    await useSavedAoi(page, "at_aoi_source_com");

    const layers = page.getByText('Layers', { exact: true });
    await expect(layers).not.toBeDisabled();
    await layers.click();

    const select = page.getByRole('checkbox', { name: 'Select row' }).first();
    await expect(select).toBeVisible();
    await select.check();
    await page.getByRole('button', { name: 'Export layers' }).click();
    await finishAndExpectExport(page);
  });

  test('layer global export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.cds_global).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });
    
    await enableDatalayer(page);
    await useSavedAoi(page, "at_aoi_source_com");

    const layers = page.getByText('Layers', { exact: true });
    await expect(layers).not.toBeDisabled();
    await layers.click();

    const select = page.getByRole('checkbox', { name: 'Select row' }).first();
    await expect(select).toBeVisible();
    await select.check();
    await page.getByRole('button', { name: 'Export layers' }).click();

    const checkbox = page.getByRole('checkbox').nth(3);
    await expect(checkbox).toBeVisible();
    await checkbox.check();
    await finishAndExpectExport(page);
  });

  test('single feature export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDatalayer(page);
    await useSavedAoi(page, "at_aoi_source_com");

    const features = page.getByText('Features', { exact: true });
    await expect(features).not.toBeDisabled();
    await features.click();

    const select = page.getByRole('checkbox', { name: 'Select row' }).first();
    await expect(select).toBeVisible();
    await select.check();
    await page.getByRole('button', { name: 'Export features', exact: true }).click();
    await finishAndExpectExport(page);
  });

  test('multiple features export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.cds_feature_ids.length === 3).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDatalayer(page);
    await useSavedAoi(page, "at_aoi_source_com");

    const features = page.getByText('Features', { exact: true });
    await expect(features).not.toBeDisabled();
    await features.click();

    await page.waitForTimeout(1000);
    expect(await page.getByRole('gridcell', { name: 'Select row' }).count()).toBeGreaterThan(2);
    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select row 2', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select row 3', exact: true }).check();
    await page.getByRole('button', { name: 'Export features', exact: true }).click();
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
