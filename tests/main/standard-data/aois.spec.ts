import { test, expect, Page } from '@fixtures';
import { createDefaultAoiByCoordinates, deleteAoi, lineFile, pointFile, polygonFile, renameAoi } from '@aois';
import { waitForApiResponse } from '@network';
import { navigateToMap } from '@before-test';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('aoi creation', () => {
  test('aoi delete from map', async ({ page }) => {
    await createDefaultAoiByCoordinates(page);

    await renameAoi(page, 'at_aoi_delete_from_map');
    await page.getByRole('button', { name: 'Edit AOI Details' }).click();
    await page.getByRole('button', { name: 'Delete AOI' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await page.waitForResponse(response => response.status() === 204 && response.request().method() === 'DELETE');
    await expect(page.getByText('Deleted AOI. at_aoi_delete_from_map')).toBeVisible();
  });

  test('aoi delete from exports', async ({ page }) => {
    await createDefaultAoiByCoordinates(page);
    await renameAoi(page, 'at_aoi_delete_from_exports');
    await deleteAoi(page, 'at_aoi_delete_from_exports');
  });

  test('aoi by country', async ({ page }) => {
    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'AOI By Country' }).click();
    await page.getByRole('radio', { name: 'Andorra' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForResponse(response => response.status() === 201 && response.request().method() === 'POST');
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    await renameAoi(page, 'at_aoi_by_country_andorra');
    await deleteAoi(page, 'at_aoi_by_country_andorra');
  });

  test('aoi by geojson', async ({ page }) => {
    const geojsonPoly = '{"type": "Polygon","coordinates": [[[-77.173, 38.893],[-77.042, 38.996],[-76.909, 38.893],[-77.040, 38.791],[-77.173, 38.893]]]}'

    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'AOI By Coordinates' }).click();
    await page.getByRole('radio', { name: 'GeoJSON' }).check();
    await page.getByRole('textbox', { name: 'Coordinate' }).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).fill(geojsonPoly);
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForResponse(response => response.status() === 201 && response.request().method() === 'POST');
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    await renameAoi(page, 'at_aoi_by_geojson');
    await deleteAoi(page, 'at_aoi_by_geojson');
  });

  test('aoi by wkt', async ({ page }) => {
    const wktPoly = 'POLYGON((-77.173 38.893, -77.042 38.996, -76.909 38.893, -77.040 38.791, -77.173 38.893))'

    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'AOI By Coordinates' }).click();
    await page.getByRole('radio', { name: 'Well Known Text (WKT)' }).check();
    await page.getByRole('textbox', { name: 'Coordinate' }).click();
    await page.getByRole('textbox', { name: 'Coordinate' }).fill(wktPoly);
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForResponse(response => response.status() === 201 && response.request().method() === 'POST');
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    await renameAoi(page, 'at_aoi_by_wkt');
    await deleteAoi(page, 'at_aoi_by_wkt');
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

    await page.waitForResponse(response => response.status() === 201 && response.request().method() === 'POST');
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    await renameAoi(page, 'at_aoi_by_coords');
    await deleteAoi(page, 'at_aoi_by_coords');
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

    await page.waitForResponse(response => response.status() === 201 && response.request().method() === 'POST');
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    await renameAoi(page, 'at_aoi_by_radius');
    await deleteAoi(page, 'at_aoi_by_radius');
  });

  test('aoi upload polygon', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.getByTitle('Change AOI creation tool').click();
    await page.getByRole('button', { name: 'Upload AOI' }).click();
    await page.getByText('Browse').click();
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(polygonFile);

    await page.getByRole('button', { name: 'Upload', exact: true }).click();
    await page.locator('#upload-name-checkbox').check();
    await page.getByRole('button', { name: 'Import AOIs' }).click();

    await page.waitForResponse(response => response.status() === 201 && response.request().method() === 'POST');
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    await renameAoi(page, 'at_aoi_by_upload_polygon');
    await deleteAoi(page, 'at_aoi_by_upload_polygon');
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
    await fileChooser.setFiles(lineFile);

    await page.getByRole('button', { name: 'Upload' }).click();
    await page.locator('#upload-name-checkbox').check();
    await page.getByRole('button', { name: 'Import AOIs' }).click();

    await page.waitForResponse(response => response.status() === 201 && response.request().method() === 'POST');
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    await renameAoi(page, 'at_aoi_by_upload_line');
    await deleteAoi(page, 'at_aoi_by_upload_line');
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
    await fileChooser.setFiles(pointFile);

    await page.getByRole('button', { name: 'Upload' }).click();
    await page.locator('#upload-name-checkbox').check();
    await page.getByRole('button', { name: 'Import AOIs' }).click();

    await page.waitForResponse(response => response.status() === 201 && response.request().method() === 'POST');
    await expect(page.locator('.tooltip-container > div:nth-child(2)')).toBeVisible();
    await renameAoi(page, 'at_aoi_by_upload_point');
    await deleteAoi(page, 'at_aoi_by_upload_point');
  });
});