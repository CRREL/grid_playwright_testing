import { Page, expect } from "@playwright/test";

export const finishAndExpectExport = async (page: Page) => {
  await page.getByRole('button', { name: 'Finish' }).click();
  await page.waitForResponse(response => response.status() === 202 && response.request().method() === 'POST');
  await expect(page.getByText('Export SubmittedView exportOK')).toBeVisible();
}