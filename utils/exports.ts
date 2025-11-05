import { Page, expect } from "@playwright/test";

export const finishAndExpectExport = async (page: Page) => {
  const finish = page.getByRole('button', { name: 'Finish' });
  await expect(finish).toBeVisible();
  await finish.click();
  await page.waitForResponse(response => response.status() === 202 && response.request().method() === 'POST');
  await expect(page.getByText('Export SubmittedView exportOK')).toBeVisible();
}