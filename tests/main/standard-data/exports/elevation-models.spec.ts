import { test, expect } from '../../../../fixtures';
import { baseURL } from '../../../../playwright.config';
import { isSorted, useSavedAoi } from '../../../../utils/aois';
import { navigateToMap } from '../../../../utils/before-test';
import { finishAndExpectExport } from '../../../../utils/exports';
import { enableDataLayer } from '../../../../utils/layers';
import { getJSON, waitForApiResponse } from '../../../../utils/network';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('export elevation models', () => {
  test.describe.configure({ mode: 'default' });

  test('elevation model map table sort', async ({ page }) => {
    await enableDataLayer(page, "elevation models");
    await useSavedAoi(page, "TEST_AOI_UKRAINE");

    await page.getByRole('button', { name: 'Program' }).click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsBefore = await page.locator('td#program').allTextContents();
    expect(isSorted(programsBefore, 'ascending')).toBeTruthy();

    await page.getByRole('button', { name: 'Program' }).click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsAfter = await page.locator('td#program').allTextContents();
    expect(isSorted(programsAfter, 'descending')).toBeTruthy();
  });

  test('elevation models merge by collect', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.file_export_options === 'collect').toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDataLayer(page, "elevation models");
    await useSavedAoi(page, "TEST_AOI_2");

    await page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page.getByRole('radio').nth(1).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await finishAndExpectExport(page);
  });

  test('elevation models specify cell size', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.target_resolution === 2).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDataLayer(page, "elevation models");
    await useSavedAoi(page, "TEST_AOI_UKRAINE");

    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await page.locator('.col-10 > .form-check-input').first().uncheck();
    await page.getByPlaceholder('defaults to source cell size').click();
    await page.getByPlaceholder('defaults to source cell size').press('ControlOrMeta+a');
    await page.getByPlaceholder('defaults to source cell size').fill('2');
    await finishAndExpectExport(page);
  });

  test('elevation models download tile', async ({ page }) => {
    test.setTimeout(300000);

    await enableDataLayer(page, "elevation models");
    await useSavedAoi(page, "TEST_AOI_UKRAINE_SMALL");

    await page.getByText('Data Tiles').click();
    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });

  test('elevation models view html metadata', async ({ page }) => {
    await enableDataLayer(page, "elevation models");
    await useSavedAoi(page, "TEST_AOI_UKRAINE_SMALL");

    await page.getByText('Data Tiles').click();
    await page.getByRole('row', { name: 'DGED5 (2m)' }).first().getByRole('checkbox').first().check();
    const page1Promise = page.waitForEvent('popup');
    await page.getByRole('gridcell', { name: 'Open metadata' }).locator('path').first().click();
    const page1 = await page1Promise;
  });
});