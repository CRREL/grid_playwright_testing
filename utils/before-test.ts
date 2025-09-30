import { BrowserContext, Page } from "@playwright/test";
import { updateCookies } from "./update-cookies";

export const navigateToMap = async (page: Page, context: BrowserContext) => {
  await page.goto('/grid/map');
  await page.waitForTimeout(1000);
  if (await page.locator('.walkthrough-container').isVisible()) {
    await page.getByRole('button', { name: 'Close' }).click();
  }
  updateCookies(await context.cookies());
}