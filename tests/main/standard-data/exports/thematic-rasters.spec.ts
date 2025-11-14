import { expect, Page, test } from '../../../../fixtures';
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

  await enableDataLayer(page, "thematic layers");
  await useSavedAoi(page, "at_aoi_ukraine");

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

test.describe('export thematic rasters', () => {
  test('thematic rasters map table sort', async ({ page }) => {
    await enableDataLayer(page, "thematic layers");
    await useSavedAoi(page, "at_aoi_ukraine");

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

  test('thematic rasters merge by collect', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.file_export_options === 'collect').toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDataLayer(page, "thematic layers");
    await useSavedAoi(page, "at_aoi_ukraine");

    await waitForApiResponse(page, 'maptable?*');
    const checkbox = page.getByRole('row', { name: 'Select Row' }).first().getByRole('checkbox');
    await expect(checkbox).toBeVisible();
    await checkbox.check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    const radio = page.getByRole('radio').nth(1);
    await expect(radio).toBeVisible();
    await radio.check();
    await finishAndExpectExport(page);
  });

  test('thematic rasters specify cell size', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.target_resolution === 2).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDataLayer(page, "thematic layers");
    await useSavedAoi(page, "at_aoi_ukraine");

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
    test.setTimeout(300000);

    await enableDataLayer(page, "thematic layers");
    await useSavedAoi(page, "at_aoi_ukraine");

    await waitForApiResponse(page, 'maptable?*');
    const dataTiles = page.getByText('Data Tiles');
    await expect(dataTiles).not.toBeDisabled();
    await dataTiles.click();

    await waitForApiResponse(page, 'maptable?*');
    const select = page.getByRole('checkbox', { name: 'Select row' }).first();
    await expect(select).toBeVisible();
    await select.check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });
});