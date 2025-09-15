import path from 'path';
import { test, expect } from '../../fixtures';
import { createDefaultAoiByCoordinates } from '../../utils/aois';
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

test.describe('aoi creation', () => {
  test.describe.configure({ mode: 'default' });

  test('aoi delete from map', async ({ page }) => {
    await createDefaultAoiByCoordinates(page);

    const aoiName = await page.getByRole('textbox', { name: 'AOI Name:' }).innerText();
    await page.getByRole('button', { name: 'Delete AOI' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await page.waitForResponse(response => response.status() === 204
      && response.request().method() === 'DELETE'
    );
    await expect(page.getByText(`Deleted AOI. ${aoiName}`)).toBeVisible();
  });

  test('aoi delete from exports', async ({ page }) => {
    await createDefaultAoiByCoordinates(page);

    await page.getByRole('link', { name: 'Exports' }).click();
    await page.getByRole('checkbox').nth(1).check();
    await page.getByRole('rowgroup').filter({ hasText: 'Delete selected Clear data notifications Name Recent Activity (UTC) Date' }).locator('input[type="button"]').click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Selected aoi(s) have been')).toBeVisible();
  });

  test('aoi by country', async ({ page }) => {
    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'AOI By Country' }).click();
    await page.getByRole('radio', { name: 'Andorra' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForResponse(response => response.status() === 201
      && response.request().method() === 'POST'
    );
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    createdAois++;
  });

  test('aoi by geojson', async ({ page }) => {
    const geojsonPoly = '{"type": "Polygon","coordinates": [[[-77.173, 38.893],[-77.042, 38.996],[-76.909, 38.893],[-77.040, 38.791],[-77.173, 38.893]]]}'

    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'AOI By Coordinates' }).click();
    await page.getByRole('radio', { name: 'GeoJSON' }).check();
    await page.getByRole('textbox', { name: 'Coordinate' }).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).fill(geojsonPoly);
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForResponse(response => response.status() === 201
      && response.request().method() === 'POST'
    );
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    createdAois++;
  });

  test('aoi by wkt', async ({ page }) => {
    const wktPoly = 'POLYGON((-77.173 38.893, -77.042 38.996, -76.909 38.893, -77.040 38.791, -77.173 38.893))'

    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'AOI By Coordinates' }).click();
    await page.getByRole('radio', { name: 'Well Known Text (WKT)' }).check();
    await page.getByRole('textbox', { name: 'Coordinate' }).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).fill(wktPoly);
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForResponse(response => response.status() === 201
      && response.request().method() === 'POST'
    );
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    createdAois++;
  });

  test('aoi by coordinates', async ({ page }) => {
    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'AOI By Coordinates' }).click();

    await page.getByRole('textbox', { name: 'Coordinate' }).first().click();
    await page.getByRole('textbox', { name: 'Coordinate' }).first().press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Coordinate' }).first().fill('38.983, -77.146');

    await page.getByRole('textbox', { name: 'Coordinate' }).nth(1).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(1).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(1).fill('38.985, -76.945');

    await page.getByRole('textbox', { name: 'Coordinate' }).nth(2).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(2).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(2).fill('38.876, -77.156');

    await page.getByRole('textbox', { name: 'Coordinate' }).nth(3).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(3).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Coordinate' }).nth(3).fill('38.870, -76.931');

    await page.locator('li:nth-child(4) > svg').dragTo(page.locator('li:nth-child(3) > svg'));
    await waitForApiResponse(page, 'verifygeom');
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForResponse(response => response.status() === 201
      && response.request().method() === 'POST'
    );
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    createdAois++;
  });

  test('aoi by radius', async ({ page }) => {
    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'AOI By Coordinates' }).click();
    await page.getByRole('radio', { name: 'Coordinate - Radius' }).check();

    await page.getByRole('spinbutton', { name: 'Buffer (m):' }).click();
    await page.getByRole('spinbutton', { name: 'Buffer (m):' }).press('ControlOrMeta+a');
    await page.getByRole('spinbutton', { name: 'Buffer (m):' }).fill('500');

    await waitForApiResponse(page, 'verifygeom');
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForResponse(response => response.status() === 201
      && response.request().method() === 'POST'
    );
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    createdAois++;
  });

  test('aoi upload polygon', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'Upload AOI' }).click();
    await page.getByText('Browse').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../../test-files/polygon.geojson'));

    await page.getByRole('button', { name: 'Upload' }).click();
    await page.locator('#upload-name-checkbox').check();
    await page.getByRole('button', { name: 'Import AOIs' }).click();

    await page.waitForResponse(response => response.status() === 201
      && response.request().method() === 'POST'
    );
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    createdAois++;
  });

  test('aoi upload line', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'Upload AOI' }).click();
    await page.getByRole('radio', { name: 'Point or Line' }).check();
    await page.getByRole('spinbutton', { name: 'Enter a buffer value in' }).click();
    await page.getByRole('spinbutton', { name: 'Enter a buffer value in' }).fill('100');
    await page.getByText('Browse').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../../test-files/line.geojson'));

    await page.getByRole('button', { name: 'Upload' }).click();
    await page.locator('#upload-name-checkbox').check();
    await page.getByRole('button', { name: 'Import AOIs' }).click();

    await page.waitForResponse(response => response.status() === 201
      && response.request().method() === 'POST'
    );
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    createdAois++;
  });

  test('aoi upload point', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'Upload AOI' }).click();
    await page.getByRole('radio', { name: 'Point or Line' }).check();
    await page.getByRole('spinbutton', { name: 'Enter a buffer value in' }).click();
    await page.getByRole('spinbutton', { name: 'Enter a buffer value in' }).fill('500');
    await page.getByText('Browse').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../../test-files/point.geojson'));

    await page.getByRole('button', { name: 'Upload' }).click();
    await page.locator('#upload-name-checkbox').check();
    await page.getByRole('button', { name: 'Import AOIs' }).click();

    await page.waitForResponse(response => response.status() === 201
      && response.request().method() === 'POST'
    );
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    createdAois++;
  });
});