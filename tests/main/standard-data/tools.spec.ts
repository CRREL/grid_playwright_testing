import { expect, test } from '@fixtures';
import { baseURL } from '@playwright.config';
import { deleteAoi, renameAoi, useSavedAoi } from '@aois';
import { navigateToMap } from '@before-test';
import { finishExport, waitForApiResponse } from '@network';
import { enableDataLayer } from '@utils/layers';
import { Page } from '@playwright/test';

const changeAnalysisTool = async (page: Page, toolName: string) => {
  await page.getByRole('button', { name: 'Change analysis tool' }).click();
  await page.getByRole('button', { name: toolName }).click();
};

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('map tools', () => {
  test('basic hlz export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/hlz-yeah`, async route => {
      if (route.request().method() === 'POST') await finishExport(route)
      else await route.continue()
    });
    
    await page.getByRole('button', { name: 'Data' }).click();
    await page.getByText("Layers", { exact: true }).locator('//preceding-sibling::*').click();
    await useSavedAoi(page, "at_aoi_hlz");
    await changeAnalysisTool(page, 'HLZ Tool');
    await page.getByRole('button', { name: 'Finish', exact: true }).click();
    await expect(page.getByText('HLZ successfully submitted!')).toBeVisible();
  });

  test('basic los route', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/los-route`, async route => await finishExport(route));

    await page.getByRole('button', { name: 'Data' }).click();
    await page.getByText("Layers", { exact: true }).locator('//preceding-sibling::*').click();
    await changeAnalysisTool(page, 'Visibility Tool');
    await page.getByRole('radio', { name: 'MGRS' }).check();

    await page.getByRole('textbox', { name: 'Coordinate' }).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).fill('14SQB0545629022');

    await page.getByRole('button', { name: 'Add point' }).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(1).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(1).fill('14SQB0529128978');

    await page.getByRole('button', { name: 'Add point' }).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(2).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(2).fill('14SQB0525828951');

    await page.getByRole('button', { name: 'Add point' }).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(3).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(3).fill('14SQB0521528891');

    await page.getByRole('button', { name: 'Add point' }).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(4).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(4).fill('14SQB0513128859');
    await waitForApiResponse(page, 'foundational-data-check/?*');

    await page.getByRole('button', { name: 'Finish' }).click();
    await waitForApiResponse(page, 'los-route');
    await expect(page.getByText('Export successfully submitted!')).toBeVisible();
    await renameAoi(page, 'at_aoi_los');
    await deleteAoi(page, 'at_aoi_los');
  });

  test('query tiles opens data tiles', async ({ page }) => {
    const canvas = page.locator('body');
    const box = await canvas.boundingBox();

    await enableDataLayer(page, "elevation models");
    await changeAnalysisTool(page, 'Query Tiles');
    if (box !== null) 
      await page.locator('canvas').click({
        position: {
          x: box.width / 2,
          y: box.height / 2
        }
      });
    await expect(page.getByText('Download selected')).toBeVisible();
    await renameAoi(page, 'at_aoi_query_tiles');
    await deleteAoi(page, 'at_aoi_query_tiles');
  });
});