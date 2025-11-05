import { test as baseTest, expect } from '@playwright/test';
import fs from 'fs';
import { baseURL, GRID } from './playwright.config';

export * from '@playwright/test';
export const test = baseTest.extend<{}, { workerStorageState: string }>({
  // Use the same storage state for all tests in this worker.
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Authenticate once per worker with a worker-scoped fixture.
  workerStorageState: [async ({ browser }, use) => {
    // Use parallelIndex as a unique identifier for each worker.
    const fileName = `.auth/${GRID}-cookies.json`;

    if (fs.existsSync(fileName)) {
      // Reuse existing authentication state if any.
      await use(fileName);
      return;
    }

    // Important: make sure we authenticate in a clean environment by unsetting storage state.
    const page = await browser.newPage({ storageState: undefined });

    await page.goto(baseURL);
    await page.getByRole('link', { name: 'CAC / GEOAxIS Signup / Login' }).click();
    await page.getByRole('link', { name: 'Sign in with PKI Certificate' }).click();

    // Wait for user input
    await page.waitForTimeout(10000);
    await page.getByText('Continue to application').click();

    // Wait until the page receives the cookies.
    await expect(page.locator('#navbarToggle').getByRole('link', { name: 'Map' })).toBeVisible();
    // End of authentication steps.

    await page.context().storageState({ path: fileName });
    await page.close();
    await use(fileName);
  }, { scope: 'worker' }],
});