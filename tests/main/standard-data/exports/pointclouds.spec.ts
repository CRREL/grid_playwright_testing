import { test, expect, Page } from '../../../../fixtures';
import { baseURL } from '../../../../playwright.config';
import { isSorted, useDefaultAoi } from '../../../../utils/aois';
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

  await enableDataLayer(page, "pointclouds");
  await useDefaultAoi(page);

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

test.describe('export pointclouds', () => {
  test.describe.configure({ mode: 'default' });

  test('pointcloud map table sort', async ({ page }) => {
    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

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

  test('pointcloud streaming url', async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole('button', { name: 'Data Layers' }).click();
    await page.getByRole('button', { name: 'Reset all filters' }).click();
    const filter = page.locator('svg').filter({hasText: 'layer filtering'}).nth(1);
    await expect(filter).toBeVisible();
    await filter.click();
    await page.getByRole('checkbox', { name: 'Visualizable in browser (data tiles)' }).check();
    await useDefaultAoi(page);

    await page.evaluateHandle(() => navigator.clipboard.writeText(""));
    const handleBefore = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentBefore = await handleBefore.jsonValue();
    expect(clipboardContentBefore === "").toBeTruthy();

    await waitForApiResponse(page, 'maptable?*');
    const dataTiles = page.getByText('Data Tiles');
    await expect(dataTiles).not.toBeDisabled();
    await dataTiles.click();

    await waitForApiResponse(page, 'maptable?*');
    const select = page.getByRole('checkbox', { name: 'Select row' }).first();
    await expect(select).toBeVisible();
    await select.check();
    await page.getByRole('row', { name: 'Copy URL' }).first().locator('span').click();

    const handleAfter = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentAfter = await handleAfter.jsonValue();
    expect(clipboardContentAfter !== "").toBeTruthy();

    await expect(page.getByText('Streaming Url Copied to')).toBeVisible();
  });

  test('pointcloud to dem export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.generate_dem).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

    await waitForApiResponse(page, 'maptable?*');
    const select = page.getByRole('checkbox', { name: 'Select row' }).first();
    await expect(select).toBeVisible();
    await select.check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    const pcToDem = page.locator('div:nth-child(5) > .col-10 > .form-check-input');
    await expect(pcToDem).toBeVisible();
    await pcToDem.check();

    let next = page.getByRole('button', { name: 'Next' });
    await expect(next).toBeVisible();
    await next.click();
    next = page.getByRole('button', { name: 'Next' });
    await expect(next).toBeVisible();
    await next.click();
    await finishAndExpectExport(page);
  });

  test('pointcloud to dem warning', async ({ page }) => {
    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

    await waitForApiResponse(page, 'maptable?*');
    const checkbox = page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox');
    await expect(checkbox).toBeVisible();
    await checkbox.check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    const pcToDem = page.locator('div:nth-child(5) > .col-10 > .form-check-input');
    await expect(pcToDem).toBeVisible();
    await pcToDem.check();
    await expect(page.locator('div:nth-child(5) > .col-10 > .form-control')).toBeVisible();
  });

  test('pointcloud merge by collect', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.file_export_options === 'collect').toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

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

  test('pointcloud decimate', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/mapexport`, async route => {
      const json = getJSON(route);
      expect(json !== null && json?.decimation_radius === 1).toBeTruthy();
      await route.continue({postData: JSON.stringify({ ...json, warn: false })});
    });

    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

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

    const radio = page.getByRole('radio').nth(3);
    await expect(radio).toBeVisible();
    await radio.check();
    await page.locator('#decimationRadius').click();
    await page.locator('#decimationRadius').press('Shift+ArrowLeft');
    await page.locator('#decimationRadius').fill('1');
    await finishAndExpectExport(page);
  });

  test('pointcloud export BPF', async ({ page }) => {
    await exportFileType(page, 'BPF');
  });

  test('pointcloud export LAS 1.4', async ({ page }) => {
    await exportFileType(page, 'LAS 1.4');
  });

  test('pointcloud export CSV', async ({ page }) => {
    await exportFileType(page, 'CSV');
  });

  test('pointcloud export NITF', async ({ page }) => {
    await exportFileType(page, 'NITF');
  });

  test('pointcloud export LAS 1.2', async ({ page }) => {
    await exportFileType(page, 'LAS 1.2');
  });

  test('pointcloud download tile', async ({ page }) => {
    test.setTimeout(300000);

    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);

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