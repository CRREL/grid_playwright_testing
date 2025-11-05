import { expect, Page } from "@playwright/test";

export const enableDataLayer = async (page: Page, layer: string) => {
  await page.getByRole('button', { name: 'Standard Data' }).click();
  if (!(await page.getByRole('heading', { name: 'Data Layers' }).isVisible())) {
    await page.getByRole('button', { name: 'Data Layers' }).click();
  }
  await page.getByRole('button', { name: 'Reset all filters' }).click();
  const check = page.getByText(layer).locator('//preceding-sibling::*').getByLabel('check');
  await expect(check).toBeVisible();
  await check.click();
  await page.getByRole('button', { name: 'Close' }).click();
}