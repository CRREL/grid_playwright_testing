import { test, expect } from '../../../fixtures';
import { useDefaultAoi } from '../../../utils/aois';
import { navigateToMap } from '../../../utils/before-test';
import { waitForApiResponse } from '../../../utils/network';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

test.describe('map functions', () => {
  test('filter by map view', async ({ page }) => {
    for(let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: 'Zoom out' }).click();
    }

    await page.getByRole('button', { name: 'Saved AOIs' }).click();
    if (await page.getByRole('checkbox', { name: 'Filter by map view' }).isChecked()) {
      await page.getByRole('checkbox', { name: 'Filter by map view' }).check();
    }
    await waitForApiResponse(page, 'aois?*');
    const defaultAoi = page.locator('#drawer-container').getByText('at_aoi_default_washington', { exact: true }).first();
    const aoi2 = page.locator('#drawer-container').getByText('at_aoi_ukraine', { exact: true }).first();
    await expect(defaultAoi).toBeVisible();
    await expect(aoi2).toBeVisible();

    await useDefaultAoi(page);

    await page.getByRole('button', { name: 'Saved AOIs' }).click();
    await page.getByRole('checkbox', { name: 'Filter by map view' }).check();
    await waitForApiResponse(page, 'aois?*');
    await expect(defaultAoi).toBeVisible();
    await expect(aoi2).not.toBeVisible();
  });

  test('distance unit preference', async ({ page }) => {
    await page.getByRole('button', { name: 'Preferences' }).click();
    const scale = page.locator('.grid-scale.sidebar-closed-inner');
    if (await page.getByRole('radio', { name: 'mi' }).isChecked()) {
      await page.getByRole('radio', { name: 'km' }).check();
      await page.waitForTimeout(250);

      const kmVisible = await scale.filter({hasText: 'km'}).isVisible();
      const mVisible = await scale.filter({hasText: 'm'}).isVisible();

      expect(kmVisible || mVisible).toBeTruthy();
    } else {
      await page.getByRole('radio', { name: 'mi' }).check();
      await page.waitForTimeout(250);
      
      const miVisible = await scale.filter({hasText: 'mi'}).isVisible();
      const ftVisible = await scale.filter({hasText: 'ft'}).isVisible();
      
      expect(miVisible || ftVisible).toBeTruthy();
    }
  });

  test('replay tutorial', async ({ page }) => {
    await page.getByRole('button', { name: 'Standard Data' }).click();
    await page.getByRole('button', { name: 'Preferences' }).click();
    await page.getByRole('button', { name: 'Replay tutorial' }).click();
    await expect(page.locator('div').filter({ hasText: /^Welcome to GRiD Map$/ })).toBeVisible();
    await page.locator('div').filter({ hasText: /^Welcome to GRiD Map$/ }).getByRole('button').click();
    await page.waitForResponse(response => response.status() === 200
      && response.request().method() === 'PATCH'
    );
    await expect(page.locator('div').filter({ hasText: /^Welcome to GRiD Map$/ })).not.toBeVisible();
  });

  test('coordinate readout', async ({ page }) => {
    await page.getByRole('button', { name: 'Preferences' }).click();
    const canvas = page.locator('body');
    const box = await canvas.boundingBox();

    if (!(await page.getByRole('radio', { name: 'All' }).isChecked())) {
      await page.getByRole('radio', { name: 'All' }).check();
    }
    if (box !== null) await page.mouse.move(box.width / 2, box.height / 2);
    await expect(page.getByText('DD:')).toBeVisible();
    await expect(page.getByText('DMS:')).toBeVisible();
    await expect(page.getByText('MGRS:')).toBeVisible();
    await expect(page.getByText('UTM:')).toBeVisible();

    if (!(await page.getByRole('radio', { name: 'UTM' }).isChecked())) {
      await page.getByRole('radio', { name: 'UTM' }).check();
    }
    if (box !== null) await page.mouse.move(box.width / 2, box.height / 2);
    await expect(page.getByText('DD:')).not.toBeVisible();
    await expect(page.getByText('DMS:')).not.toBeVisible();
    await expect(page.getByText('MGRS:')).not.toBeVisible();
    await expect(page.getByText('UTM:')).toBeVisible();

    if (!(await page.getByRole('radio', { name: 'MGRS' }).isChecked())) {
      await page.getByRole('radio', { name: 'MGRS' }).check();
    }
    if (box !== null) await page.mouse.move(box.width / 2, box.height / 2);
    await expect(page.getByText('DD:')).not.toBeVisible();
    await expect(page.getByText('DMS:')).not.toBeVisible();
    await expect(page.getByText('MGRS:')).toBeVisible();
    await expect(page.getByText('UTM:')).not.toBeVisible();

    if (!(await page.getByRole('radio', { name: 'DMS' }).isChecked())) {
      await page.getByRole('radio', { name: 'DMS' }).check();
    }
    if (box !== null) await page.mouse.move(box.width / 2, box.height / 2);
    await expect(page.getByText('DD:')).not.toBeVisible();
    await expect(page.getByText('DMS:')).toBeVisible();
    await expect(page.getByText('MGRS:')).not.toBeVisible();
    await expect(page.getByText('UTM:')).not.toBeVisible();

    if (!(await page.getByRole('radio', { name: 'DD' }).isChecked())) {
      await page.getByRole('radio', { name: 'DD' }).check();
    }
    if (box !== null) await page.mouse.move(box.width / 2, box.height / 2);
    await expect(page.getByText('DD:')).toBeVisible();
    await expect(page.getByText('DMS:')).not.toBeVisible();
    await expect(page.getByText('MGRS:')).not.toBeVisible();
    await expect(page.getByText('UTM:')).not.toBeVisible();
  });
});