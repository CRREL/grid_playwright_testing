import { expect, test } from '../../../fixtures';
import { baseURL } from '../../../playwright.config';
import { isSorted, useSavedAoi } from '../../../utils/aois';
import { enableDataLayer } from '../../../utils/layers';
import { waitForApiResponse } from '../../../utils/network';
import { updateCookies } from '../../../utils/update-cookies';

test.beforeEach(async ({ page, context }) => {
  await page.goto('/grid/map');
  await page.waitForTimeout(1000);
  updateCookies(await context.cookies());
});

test.describe('export imagery', () => {
  test.describe.configure({ mode: 'default' });

  test('imagery map table sort', async ({ page }) => {
    await enableDataLayer(page, "imagery");
    await useSavedAoi(page, "TEST_AOI_IMAGERY");

    await page.getByRole('button', { name: 'Program' }).click();
    await waitForApiResponse(page, 'maptable?*');

    const programsBefore = await page.locator('td#program').allTextContents();
    expect(isSorted(programsBefore, 'ascending')).toBeTruthy();

    await page.getByRole('button', { name: 'Program' }).click();
    await waitForApiResponse(page, 'maptable?*');

    const programsAfter = await page.locator('td#program').allTextContents();
    expect(isSorted(programsAfter, 'descending')).toBeTruthy();
  });

  test('imagery merge by collect', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const payload = route.request().postData();
      const json = payload !== null ? JSON.parse(payload) : null
      expect(json !== null && json?.file_export_options === 'collect').toBeTruthy();
      await route.fulfill({ status: 202, body: `{"aoi_id":${json?.aoi_id}}` });
      //await route.continue();
    });

    await enableDataLayer(page, "imagery");
    await useSavedAoi(page, "TEST_AOI_IMAGERY");

    await page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page.getByRole('radio').nth(1).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
  });

  test('imagery specify cell size', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const payload = route.request().postData();
      const json = payload !== null ? JSON.parse(payload) : null
      expect(json !== null && json?.target_resolution === 2).toBeTruthy();
      await route.fulfill({ status: 202, body: `{"aoi_id":${json?.aoi_id}}` });
      //await route.continue();
    });

    await enableDataLayer(page, "imagery");
    await useSavedAoi(page, "TEST_AOI_IMAGERY");

    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await page.locator('.col-10 > .form-check-input').first().uncheck();
    await page.getByPlaceholder('defaults to source cell size').click();
    await page.getByPlaceholder('defaults to source cell size').press('ControlOrMeta+a');
    await page.getByPlaceholder('defaults to source cell size').fill('2');
    await page.getByRole('button', { name: 'Finish' }).click();
  });

  test('imagery download tile', async ({ page }) => {
    test.setTimeout(300000);

    await enableDataLayer(page, "imagery");
    await useSavedAoi(page, "TEST_AOI_IMAGERY");

    await page.getByText('Data Tiles').click();
    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });
});