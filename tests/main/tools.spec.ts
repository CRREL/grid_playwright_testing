import { expect, test } from '../../fixtures';
import { baseURL } from '../../playwright.config';
import { useSavedAoi } from '../../utils/aois';
import { waitForApiResponse } from '../../utils/network';
import { updateCookies } from '../../utils/update-cookies';

let createdAois = 0;

test.beforeEach(async ({ page, context }) => {
  await page.goto('/grid/map');
  await page.waitForTimeout(1000);
  updateCookies(await context.cookies());
});

test.afterEach(async ({ page }) => {
  if (createdAois > 0) {
    await page.goto('/grid/export/aoi/list');
    await page.getByRole('checkbox').nth(1).check();
    await page.getByRole('rowgroup').filter({ hasText: 'Delete selected Clear data notifications Name Recent Activity (UTC) Date' }).locator('input[type="button"]').click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Selected aoi(s) have been')).toBeVisible();
    createdAois--;
  }
});

test.describe('map tools', () => {
  test.describe.configure({ mode: 'default' });

  test('basic hlz export', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/hlz-yeah`, async route => {
      const payload = route.request().postData();
      const json = payload !== null ? JSON.parse(payload) : null
      await route.fulfill({ status: 202, body: `{"aoi_id":${json?.aoi_id}}` });
      //await route.continue();
    });
    
    await useSavedAoi(page, "HLZ_TEST_AOI");
    await page.getByRole('button', { name: 'HLZ Tool' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
  });

  test('basic los route', async ({ page }) => {
    await page.route(`${baseURL}/api/drf/los-route`, async route => {
      const payload = route.request().postData();
      const json = payload !== null ? JSON.parse(payload) : null;
      await route.fulfill({ status: 202, body: `{"aoi_id":${json?.aoi_id}}` });
      //await route.continue();
    });

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
    await expect(page.getByText('successExport successfully')).toBeVisible();
    createdAois++;
  });

  test('query tiles opens data tiles', async ({ page }) => {
    const canvas = page.locator('body');
    const box = await canvas.boundingBox();

    await page.getByRole('button', { name: 'Query Tiles' }).click();
    if (box !== null) 
      await page.locator('canvas').click({
        position: {
          x: box.width / 2,
          y: box.height / 2
        }
      });
    await expect(page.locator('.tile-checked')).toBeVisible();
    createdAois++;
  });
});