import { expect, Page, test } from "../../../fixtures";
import { baseURL } from "../../../playwright.config";
import { isSorted, useSavedAoi } from "../../../utils/aois";
import { updateCookies } from "../../../utils/update-cookies";

const enableDatalayer = async (page: Page) => {
  await page.getByRole('button', { name: 'Features Data' }).click();
  await page.getByRole('button', { name: 'Data Layers' }).click();
  await page.getByRole('button', { name: 'Reset Layer' }).click();

  await page.waitForTimeout(500);
  if (await page.locator('.fa-folder-open').count() > 0) {
    await page.getByRole('button', { name: 'Expand Layer Expand Layer' }).click();
  }
  await page.getByRole('button', { name: 'Expand Layer Expand Layer' }).click();

  await page.locator('.list-group-item > div > .list-group > div > div > div > div > .btn').first().click();
}

test.beforeEach(async ({ page, context }) => {
  await page.goto('/grid/map');
  await page.waitForTimeout(1000);
  updateCookies(await context.cookies());
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
      const payload = route.request().postData();
      const json = payload !== null ? JSON.parse(payload) : null
      await route.fulfill({ status: 202, body: `{"aoi_id":${json?.aoi_id}}` });
      //await route.continue();
    });
    
    await enableDatalayer(page);

    await useSavedAoi(page, "FEATURES_TEST_AOI");

    await page.getByText('Layers', { exact: true }).click();
    await page.getByRole('checkbox', { name: 'Select row' }).check();
    await page.getByRole('button', { name: 'Export layers' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
  });

  test('layer global export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const payload = route.request().postData();
      const json = payload !== null ? JSON.parse(payload) : null
      expect(json !== null && json?.cds_global).toBeTruthy();
      await route.fulfill({ status: 202, body: `{"aoi_id":${json?.aoi_id}}` });
      //await route.continue();
    });
    
    await enableDatalayer(page);

    await useSavedAoi(page, "FEATURES_TEST_AOI");

    await page.getByText('Layers', { exact: true }).click();
    await page.getByRole('checkbox', { name: 'Select row' }).check();
    await page.getByRole('button', { name: 'Export layers' }).click();
    await page.getByRole('checkbox').nth(3).check();
    await page.getByRole('button', { name: 'Finish' }).click();
  });

  test('single feature export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const payload = route.request().postData();
      const json = payload !== null ? JSON.parse(payload) : null
      await route.fulfill({ status: 202, body: `{"aoi_id":${json?.aoi_id}}` });
      //await route.continue();
    });

    await enableDatalayer(page);

    await useSavedAoi(page, "FEATURES_TEST_AOI");

    await page.getByText('Features', { exact: true }).click();
    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('button', { name: 'Export features', exact: true }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
  });

  test('multiple features export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const payload = route.request().postData();
      const json = payload !== null ? JSON.parse(payload) : null
      expect(json !== null && json?.cds_feature_ids.length === 3).toBeTruthy();
      await route.fulfill({ status: 202, body: `{"aoi_id":${json?.aoi_id}}` });
      //await route.continue();
    });

    await enableDatalayer(page);

    await useSavedAoi(page, "FEATURES_TEST_AOI");

    await page.getByText('Features', { exact: true }).click();
    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select row 2', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Select row 3', exact: true }).check();
    await page.getByRole('button', { name: 'Export features', exact: true }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
  });
});
