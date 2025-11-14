import { Download, expect, test } from '../../../fixtures';
import { baseURL } from '../../../playwright.config';
import { updateCookies } from '../../../utils/update-cookies';

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
    const page1Promise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'GeoData Cooperative' }).click();
    const page1 = await page1Promise;

    page1.on('download', (download: Download) => {
      download.cancel();
    });

    await page1.getByRole('link', { name: 'NGA Digital Elevation Content' }).click();
    await page1.getByRole('link', { name: 'Defence Gridded Elevation' }).click();
    await page1.getByRole('link', { name: 'NGA Release Guidance' }).click();
    await page1.getByRole('link', { name: 'ArcGIS Pro Elevation User' }).click();
    await page1.getByRole('link', { name: 'GDC - 3D Analysis User' }).click();
  });
});