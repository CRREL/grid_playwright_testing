import { Page } from "@playwright/test";

const defaultAoiName = "DEFAULT_TEST_AOI";

export const isSorted = (elements: string[], order: 'ascending' | 'descending', type: 'string' | 'number' = 'string') => {
  for (let i = 1; i < elements.length; i++) {
    const val1 = type === 'string' ? elements[i-1] : Number(elements[i-1]);
    const val2 = type === 'string' ? elements[i] : Number(elements[i]);
    const sorted = order === 'ascending' ? (val1 <= val2) : (val1 >= val2)
    if (!sorted) return false;
  }
  return true;
}

export const createDefaultAoiByCoordinates = async (page: Page) => {
  await page.getByTitle('Change AOI creation tool').click();
  await page.getByRole('button', { name: 'AOI By Coordinates' }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForResponse(response => response.status() === 201
    && response.request().method() === 'POST'
  );
}

export const useLastAoi = async (page: Page) => {
  await page.getByRole('button', { name: 'Saved AOIs' }).click();
  await page.getByRole('button', { name: 'Sort' }).click();
  await page.getByRole('button', { name: 'Activity (Newest – Oldest)' }).click();
  await page.locator('.row-checkbox > .svg-inline--fa').first().click();
  const mostRecent = await page.locator('.tree-row').first().innerText();
  await page.getByRole('button', { name: `Go to AOI: ${mostRecent}` }).click();
}

export const useDefaultAoi = async (page: Page) => {
  await page.getByRole('button', { name: 'Saved AOIs', exact: true, }).click();
  if (await page.getByRole('checkbox', { name: 'Filter by map view' }).isChecked()) {
    await page.getByRole('checkbox', { name: 'Filter by map view' }).uncheck();
  }
  await page.locator('div').filter({ hasText: /^CheckDEFAULT_TEST_AOI$/ }).getByLabel('Check').click();
  await page.getByRole('button', { name: `Go to AOI: ${defaultAoiName}` }).click();
}

export const useSavedAoi = async (page: Page, aoi: string) => {
  const regex = new RegExp("^Check" + aoi + "$");
  await page.getByRole('button', { name: 'Saved AOIs', exact: true, }).click();
  if (await page.getByRole('checkbox', { name: 'Filter by map view' }).isChecked()) {
    await page.getByRole('checkbox', { name: 'Filter by map view' }).uncheck();
  }
  await page.locator('div').filter({ hasText: regex }).getByLabel('Check').click();
  await page.getByRole('button', { name: `Go to AOI: ${aoi}` }).click();
}