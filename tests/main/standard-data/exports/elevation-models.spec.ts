import { test, expect, Page } from '../../../../fixtures';
import { baseURL } from '../../../../playwright.config';
import { isSorted, useSavedAoi } from '../../../../utils/aois';
import { navigateToMap } from '../../../../utils/before-test';
import { finishAndExpectExport } from '../../../../utils/exports';
import { enableDataLayer } from '../../../../utils/layers';
import { getJSON, waitForApiResponse } from '../../../../utils/network';

const exportFileType = async (page: Page, fileType: string) => {
  await page.route(`${baseURL}/api/drf/mapexport`, async route => {
    const json = getJSON(route);
    expect(json !== null).toBeTruthy();
    await route.continue({postData: JSON.stringify({ ...json, warn: false })});
  });

  await enableDataLayer(page, "elevation models");
  await useSavedAoi(page, "TEST_AOI_UKRAINE");

  await waitForApiResponse(page, 'maptable?*');
  const select = page.getByRole('checkbox', { name: 'Select row' }).first();
  await expect(select).toBeVisible();
  await select.check();
  await page.getByRole('button', { name: 'Export', exact: true }).click();

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

test.describe('export elevation models', () => {
  test.describe.configure({ mode: 'default' });

  test('elevation model map table sort', async ({ page }) => {
    await enableDataLayer(page, "elevation models");
    await useSavedAoi(page, "TEST_AOI_UKRAINE");

    await waitForApiResponse(page, 'maptable?*');
    const program = page.getByRole('button', { name: 'Program' });
    await expect(program).toBeVisible();
    await program.click();
    await waitForApiResponse(page, 'maptable?*');
    await page.waitForTimeout(1000);

    const programsBefore = await page.locator('td#program').allTextContents();
    expect(programsBefore.length > 1).toBeTruthy();
    expect(isSorted(programsBefore, 'ascending')).toBeTruthy();

    await program.click();
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

    await waitForApiResponse(page, 'maptable?*');
    const checkbox = page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox');
    await expect(checkbox).toBeVisible();
    await checkbox.check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    const radio = page.getByRole('radio').nth(1);
    await expect(radio).toBeVisible();
    await radio.check();
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

    await waitForApiResponse(page, 'maptable?*');
    const select = page.getByRole('checkbox', { name: 'Select row' }).first();
    await expect(select).toBeVisible();
    await select.check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    let next = page.getByRole('button', { name: 'Next' });
    await expect(next).toBeVisible();
    await next.click();
    next = page.getByRole('button', { name: 'Next' });
    await expect(next).toBeVisible();
    await next.click();

    const input = page.locator('.col-10 > .form-check-input').first();
    await expect(input).toBeVisible();
    await input.uncheck();
    await page.getByPlaceholder('defaults to source cell size').click();
    await page.getByPlaceholder('defaults to source cell size').press('ControlOrMeta+a');
    await page.getByPlaceholder('defaults to source cell size').fill('2');
    await finishAndExpectExport(page);
  });

  test('elevation models export GeoTiff', async ({ page }) => {
    await exportFileType(page, 'GeoTiff');
  });

  test('elevation models export TAK Format', async ({ page }) => {
    await exportFileType(page, 'TAK Format');
  });

  test('elevation models export BAG', async ({ page }) => {
    await exportFileType(page, 'BAG');
  });

  test('elevation models export National Imagery Transmission Format', async ({ page }) => {
    await exportFileType(page, 'National Imagery Transmission Format');
  });

  test('elevation models export Source Format', async ({ page }) => {
    await exportFileType(page, 'Source Format');
  });

  test('elevation models download tile', async ({ page }) => {
    test.setTimeout(300000);

    await enableDataLayer(page, "elevation models");
    await useSavedAoi(page, "TEST_AOI_UKRAINE_SMALL");

    await waitForApiResponse(page, 'maptable?*');
    const dataTiles = page.getByText('Data Tiles');
    await expect(dataTiles).not.toBeDisabled();
    await dataTiles.click();
    
    await waitForApiResponse(page, 'maptable?*');
    const select = page.getByRole('checkbox', { name: 'Select row' }).last();
    await expect(select).toBeVisible();
    await select.check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });

  test('elevation models view html metadata', async ({ page }) => {
    await enableDataLayer(page, "elevation models");
    await useSavedAoi(page, "TEST_AOI_UKRAINE_SMALL");

    await waitForApiResponse(page, 'maptable?*');
    const dataTiles = page.getByText('Data Tiles');
    await expect(dataTiles).not.toBeDisabled();
    await dataTiles.click();

    await waitForApiResponse(page, 'maptable?*');
    const checkbox = page.getByRole('row', { name: 'DGED5' }).first().getByRole('checkbox').first();
    await expect(checkbox).toBeVisible();
    await checkbox.check();

    const page1Promise = page.waitForEvent('popup');
    const metaData = page.getByRole('gridcell', { name: 'Open metadata' }).locator('path').first();
    await expect(metaData).toBeVisible();
    await metaData.click();
    const page1 = await page1Promise;
  });
});