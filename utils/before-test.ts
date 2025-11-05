import { BrowserContext, Page } from "@playwright/test";
import { updateCookies } from "./update-cookies";
import { GRID } from "../playwright.config";

export const navigateToMap = async (page: Page, context: BrowserContext) => {
  await page.goto(`/${GRID}/map`);
  await page.waitForTimeout(1000);
  if (await page.locator('.walkthrough-container').isVisible()) {
    await page.getByRole('button', { name: 'Close' }).click();
  }
  updateCookies(await context.cookies());
}