import { Page } from "@playwright/test";

export const enableDataLayer = async (page: Page, layer: string) => {
  const regex = new RegExp("^CheckLayer color" + layer + "Layer filtering$", "i");
  await page.getByRole('button', { name: 'Standard Data' }).click();
  if (!(await page.getByRole('heading', { name: 'Data Layers' }).isVisible())) {
    await page.getByRole('button', { name: 'Data Layers' }).click();
  }
  await page.getByRole('button', { name: 'Reset all filters' }).click();
  await page.locator('div').filter({ hasText: regex }).getByLabel('Check').click();
  await page.getByRole('button', { name: 'Close' }).click();
}