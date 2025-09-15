import { Page } from "@playwright/test";
import { baseURL } from "../playwright.config";

export const waitForApiResponse = async (page: Page, endpoint: string) => {
  await page.waitForResponse(`${baseURL}/api/drf/${endpoint}`);
}