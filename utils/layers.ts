import { Page } from "@playwright/test";

export const enableDataLayer = async (page: Page, layer: string) => {
  await page.getByRole('button', { name: 'Data' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Reset all filters' }).click();
  await page.getByText("Layers", { exact: true }).locator('//preceding-sibling::*').click();
  await page.getByText(layer).locator('//preceding-sibling::*').getByLabel('check').click();
  await page.getByRole('button', { name: 'Close' }).click();
}