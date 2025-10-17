import { expect, Page, test } from "../../../fixtures";
import { baseURL } from "../../../playwright.config";
import { isSorted, useSavedAoi } from "../../../utils/aois";
import { navigateToMap } from "../../../utils/before-test";
import { finishAndExpectExport } from "../../../utils/exports";
import { getJSON, waitForApiResponse } from "../../../utils/network";

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

  await page.locator('.list-group-item > div > .list-group > div > div > div > div > .btn').first().click();
}

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('source commercial', () => {
  test.describe.configure({ mode: 'default' });

  test('features map table sort', async ({ page }) => {
    await enableDatalayer(page);

    await useSavedAoi(page, "FEATURES_TEST_AOI");
    await page.getByText('Features', { exact: true }).click();
    
    await page.getByRole('button', { name: 'Ogr Fid' }).click();
    await page.waitForTimeout(500);
    const featuresBefore = await page.locator('td#ogr_fid').allTextContents();
    expect(isSorted(featuresBefore, 'ascending', 'number')).toBeTruthy();

    await page.getByRole('button', { name: 'Ogr Fid' }).click();
    await page.waitForTimeout(500);
    const featuresAfter = await page.locator('td#ogr_fid').allTextContents();
    expect(isSorted(featuresAfter, 'descending', 'number')).toBeTruthy();
  });

  test('layer export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });
    
    await enableDatalayer(page);
    await useSavedAoi(page, "FEATURES_TEST_AOI");

    await page.getByText('Layers', { exact: true }).click();
    await page.getByRole('checkbox', { name: 'Select row' }).check();
    await page.getByRole('button', { name: 'Export layers' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await finishAndExpectExport(page);
  });

  test('layer global export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.cds_global).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });
    
    await enableDatalayer(page);
    await useSavedAoi(page, "FEATURES_TEST_AOI");

    await page.getByText('Layers', { exact: true }).click();
    await page.getByRole('checkbox', { name: 'Select row' }).check();
    await page.getByRole('button', { name: 'Export layers' }).click();
    await page.getByRole('checkbox').nth(3).check();
    await finishAndExpectExport(page);
  });

  test('single feature export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDatalayer(page);
    await useSavedAoi(page, "FEATURES_TEST_AOI");

    await page.getByText('Features', { exact: true }).click();
    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('button', { name: 'Export features', exact: true }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await finishAndExpectExport(page);
  });

  test('multiple features export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.cds_feature_ids.length === 3).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDatalayer(page);
    await useSavedAoi(page, "FEATURES_TEST_AOI");

    await page.getByText('Features', { exact: true }).click();
    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select row 2', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select row 3', exact: true }).check();
    await page.getByRole('button', { name: 'Export features', exact: true }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await finishAndExpectExport(page);
  });
});
