import { Page, Route } from "@playwright/test";
import { baseURL } from "../playwright.config";

export const waitForApiResponse = async (page: Page, endpoint: string) => {
  await page.waitForResponse(`${baseURL}/api/drf/${endpoint}`);
}

export const getJSON = (route: Route) => {
  const payload = route.request().postData();
  return payload !== null ? JSON.parse(payload) : null
}