import { expect, test } from '@fixtures';
import { baseURL } from '@playwright.config';
import { updateCookies } from '@utils/update-cookies';

test.beforeEach(async ({ page, context }) => {
  await page.goto(baseURL);
  await page.waitForTimeout(1000);
  updateCookies(await context.cookies());
});

test.describe('home page functions', () => {
  test('quick aoi from home page', async ({ page }) => {
    await page.getByRole('link', { name: 'Quick AOI' }).click();
    await expect(page.getByRole('heading', { name: 'AOI By Coordinates' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Coordinate - Radius' })).toBeChecked();
  });

  test('geodata coop links', async ({ page }) => {
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'GeoData Cooperative' }).click();
    const popup = await popupPromise;

    const clickAndCancel = async (linkName: string) => {
      const [download] = await Promise.all([
        popup.waitForEvent('download'),
        popup.getByRole('link', { name: linkName }).click(),
      ]);
      await download.cancel();
    };

    await clickAndCancel('NGA Digital Elevation Content');
    await clickAndCancel('Defence Gridded Elevation');
    await clickAndCancel('NGA Release Guidance');
    await clickAndCancel('ArcGIS Pro Elevation User');
    await clickAndCancel('GDC - 3D Analysis User');
  });
});