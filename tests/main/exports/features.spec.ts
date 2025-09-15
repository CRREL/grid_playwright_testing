import { expect, test } from '../../../fixtures';
import { isSorted, useDefaultAoi } from '../../../utils/aois';
import { enableDataLayer } from '../../../utils/layers';
import { waitForApiResponse } from '../../../utils/network';
import { updateCookies } from '../../../utils/update-cookies';

test.beforeEach(async ({ page, context }) => {
  await page.goto('/grid/map');
  await page.waitForTimeout(1000);
  updateCookies(await context.cookies());
});

test.describe('export features', () => {
  test.describe.configure({ mode: 'default' });

  test('features map table sort', async ({ page }) => {
    await enableDataLayer(page, "features");
    await useDefaultAoi(page);

    await page.getByRole('button', { name: 'Program' }).click();
    await waitForApiResponse(page, 'maptable?*');

    const programsBefore = await page.locator('td#program').allTextContents();
    expect(isSorted(programsBefore, 'ascending')).toBeTruthy();

    await page.getByRole('button', { name: 'Program' }).click();
    await waitForApiResponse(page, 'maptable?*');

    const programsAfter = await page.locator('td#program').allTextContents();
    expect(isSorted(programsAfter, 'descending')).toBeTruthy();
  });

  test('features download tile', async ({ page }) => {
    test.setTimeout(300000);

    await enableDataLayer(page, "features");
    await useDefaultAoi(page);

    await page.getByText('Data Tiles').click();
    await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
    await page.getByRole('link', { name: 'Download selected' }).click();
    await expect(page.getByText('Download initiated.')).toBeVisible();

    const download = await page.waitForEvent('download');
    await download.cancel();
  });
});