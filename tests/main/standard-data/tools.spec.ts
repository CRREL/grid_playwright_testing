import { expect, test } from '@fixtures';
import { baseURL } from '@playwright.config';
import { deleteAoi, renameAoi, useSavedAoi } from '@aois';
import { navigateToMap } from '@before-test';
import { finishExport, waitForApiResponse } from '@network';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('map tools', () => {
  test('basic hlz export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/hlz-yeah`, async route => {
      if (route.request().method() === 'POST') await finishExport(route)
      else await route.continue()
    });
    
    await page.getByRole('button', { name: 'Standard Data' }).click();
    await useSavedAoi(page, "at_aoi_hlz");
    await page.getByRole('button', { name: 'HLZ Tool' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page.getByText('successHLZ successfully')).toBeVisible();
  });

  test('basic los route', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/los-route`, async route => await finishExport(route));

    await page.getByRole('button', { name: 'Standard Data' }).click();
    await page.getByRole('button', { name: 'Visibility Tool' }).click();
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
    await expect(page.getByText('successExport successfully')).toBeVisible();
    await renameAoi(page, 'at_aoi_los');
    await deleteAoi(page, 'at_aoi_los');
  });

  test('query tiles opens data tiles', async ({ page }) => {
    const canvas = page.locator('body');
    const box = await canvas.boundingBox();

    await page.getByRole('button', { name: 'Standard Data' }).click();
    await page.getByRole('button', { name: 'Query Tiles' }).click();
    if (box !== null) 
      await page.locator('canvas').click({
        position: {
          x: box.width / 2,
          y: box.height / 2
        }
      });
    await expect(page.locator('.tile-checked')).toBeVisible();
    await renameAoi(page, 'at_aoi_query_tiles');
    await deleteAoi(page, 'at_aoi_query_tiles');
  });
});