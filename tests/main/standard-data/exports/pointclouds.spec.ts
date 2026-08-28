import { test, expect } from '@fixtures';
import { useDefaultAoi, downloadTile, testMapTableSort } from '@aois';
import { navigateToMap } from '@before-test';
import { exportFileType, finishAndExpectExport, showAdvancedSettings } from '@exports';
import { enableDataLayer } from '@layers';
import { waitForApiResponse } from '@network';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('other pointcloud tests', () => {
  test('pointcloud streaming url', async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole('button', { name: 'Data' }).click();
    await page.getByRole('button', { name: 'Reset all filters' }).click();
    await page.getByText('Pointclouds').locator('//following-sibling::*').click();
    await page.locator('#cds-expand-layer').click();
    await page.getByRole('checkbox', { name: 'Visualizable in browser (data tiles)' }).check();
    await useDefaultAoi(page);

    await page.evaluateHandle(() => navigator.clipboard.writeText(""));
    const handleBefore = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentBefore = await handleBefore.jsonValue();
    expect(clipboardContentBefore === "").toBeTruthy();

    await waitForApiResponse(page, 'maptable?*');
    await page.getByText('Data Tiles').click();

    await waitForApiResponse(page, 'maptable?*');
    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('row', { name: 'Copy URL' }).first().locator('span').click();

    const handleAfter = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContentAfter = await handleAfter.jsonValue();
    expect(clipboardContentAfter !== "").toBeTruthy();

    await expect(page.getByText('Streaming Url Copied to')).toBeVisible();
  });
});

test.describe('export pointclouds', () => {
  test.beforeEach(async ({ page }) => {
    await enableDataLayer(page, "pointclouds");
    await useDefaultAoi(page);
  });

  test('pointcloud map table sort', async ({ page }) => {
    await testMapTableSort(page);
  });

  test('pointcloud to dem export', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await showAdvancedSettings(page);
    await page.getByText('Convert the pointcloud into a digital elevation model.').locator('//preceding-sibling::*').click();

    await page.waitForResponse(response => { 
      const json = response.request().postDataJSON();
      expect(json !== null && json.pc_to_dem);
      return response.request().method() === 'PATCH' && response.status() === 200;
    });
    await finishAndExpectExport(page);
  });

  test('pointcloud to dem warning', async ({ page }) => {
    await page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await showAdvancedSettings(page);
    await page.getByText('Convert the pointcloud into a digital elevation model.').locator('//preceding-sibling::*').click();
    await expect(page.locator('.d-flex > .form-control')).toBeVisible();
  });

  test('pointcloud merge by collect', async ({ page }) => {
    await page.getByRole('row', { name: 'BuckEye' }).first().getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await showAdvancedSettings(page, 'CSV');
    await page.getByRole('radio').nth(1).click();
    
    await page.waitForResponse(response => { 
      const json = response.request().postDataJSON();
      expect(json !== null && json.file_export_options === 'collect');
      return response.request().method() === 'PATCH' && response.status() === 200;
    });
    await finishAndExpectExport(page);
  });

  test('pointcloud decimate', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Select row' }).first().check();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await showAdvancedSettings(page, 'CSV');

    await page.getByText('Decimate export').getByRole('checkbox').click();
    const decimate = page.locator('#decimationRadius');
    await decimate.click();
    await decimate.press('Shift+ArrowLeft');
    await decimate.fill('1');

    await page.waitForResponse(response => { 
      const json = response.request().postDataJSON();
      expect(json !== null && json.decimation_radius === 1);
      return response.request().method() === 'PATCH' && response.status() === 200;
    });
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
    await downloadTile(page);
  });
});