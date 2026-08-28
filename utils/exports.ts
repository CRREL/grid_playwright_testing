import { baseURL } from "@playwright.config";
import { Page, expect } from "@playwright/test";
import { finishExport } from "./network";

export const finishAndExpectExport = async (page: Page) => {
  await page.getByRole('button', { name: 'Finish' }).click();
  await page.waitForResponse(response => response.status() === 201 && response.request().method() === 'POST');
  await expect(page.getByText('Export successfully submitted!')).toBeVisible();
}

export const selectFileFormat = async (page: Page, fileType: string) => {
  await page.getByText('File Format').locator('//following-sibling::*').getByRole('button').click();
  await page.getByRole('button', { name: fileType }).click();
}

export const exportFileType = async (page: Page, fileType: string) => {
  await page.route(`${baseURL}/api/drf/mapexport/export/*/`, async route => await finishExport(route));

  await page.getByRole('checkbox', { name: 'Select row' }).first().check();
  await page.getByRole('button', { name: 'Export', exact: true }).click();

  await selectFileFormat(page, fileType);
  await finishAndExpectExport(page);
}

export const showAdvancedSettings = async (page: Page, fileType?: string) => {
  await page.getByRole('button', { name: 'Show advanced settings' }).click();
  if (fileType) {
    await selectFileFormat(page, fileType);
  }
}

export const specifyCellSize = async (page: Page, cellSize: string) => {
  await page.getByRole('checkbox', { name: 'Use source file cell size(s)' }).uncheck();
  const targetResolution = page.getByPlaceholder('enter value');
  await targetResolution.click();
  await targetResolution.fill(cellSize);
}