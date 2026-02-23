import { expect, Page, Route } from "@playwright/test";
import { baseURL } from "@playwright.config";

export const waitForApiResponse = async (page: Page, endpoint: string) => await page.waitForResponse(`${baseURL}/api/drf/${endpoint}`);

export const getJSON = (route: Route) => {
  const payload = route.request().postData();
  return payload !== null ? JSON.parse(payload) : null
}

export const finishExport = async (route: Route) => {
  const json = getJSON(route);
  expect(json !== null).toBeTruthy();
  await route.continue({postData: JSON.stringify({ ...json, warn: false })});
}

export const verifyExport = async (route: Route, method: "POST" | "PATCH", validation: (json: any) => boolean) => {
  const json = getJSON(route);
  if (route.request().method() === method)
    expect(json !== null && validation(json)).toBeTruthy();
  await route.continue({postData: JSON.stringify({ ...json, warn: false })});
}