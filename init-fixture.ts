import { test as baseTest, expect } from '@playwright/test';
import fs from 'fs';
import { baseURL, GRID, MODE } from './playwright.config';
import * as OTPAuth from "otpauth";

export * from '@playwright/test';
export const test = baseTest.extend<{}, { workerStorageState: string }>({
  // Use the same storage state for all tests in this worker.
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Authenticate once per worker with a worker-scoped fixture.
  workerStorageState: [async ({ browser }, use) => {
    // Use parallelIndex as a unique identifier for each worker.
    const fileName = `.auth/${GRID}-cookies.json`;

    if (fs.existsSync(fileName)) {
      fs.unlink(fileName, (err) => {
        if (err) {
          console.error(`Error removing file: ${err}`);
          return;
        }
      
        console.log('Cookie file removed');
      });
    }

    // Important: make sure we authenticate in a clean environment by unsetting storage state.
    const page = await browser.newPage({ storageState: undefined });

    await page.goto(baseURL);

    if (MODE === 'dev') {
      if (process.env.EMAIL === undefined) {
        console.error('Error logging in: Email not in .env');
        return;
      }

      await page.getByRole('link', { name: 'Login' }).click();
      await page.getByRole('button', { name: 'Passkey Login' }).click();

      await page.getByRole('link', { name: 'Email Login' }).click();
      await page.getByRole('textbox', { name: 'Email:' }).click();
      await page.getByRole('textbox', { name: 'Email:' }).fill(process.env.EMAIL);
      await page.getByRole('button', { name: 'Request Code' }).click();

      // Wait for user input
      await page.waitForTimeout(15000);

      if (process.env.TOTP_SECRET !== undefined) {
        const totp = new OTPAuth.TOTP({
          secret: process.env.TOTP_SECRET,
        });
        const code = totp.generate();

        await page.getByRole('textbox', { name: 'Code:' }).fill(code);
        await page.getByRole('button', { name: 'Sign In' }).click();
      }
    } else {
      await page.getByRole('link', { name: 'CAC / GEOAxIS Signup / Login' }).click();
      await page.getByRole('link', { name: 'Sign in with PKI Certificate' }).click();
  
      // Wait for user input
      await page.waitForTimeout(10000);
      await page.getByText('Continue to application').click();
    }

    // Wait until the page receives the cookies.
    await expect(page.locator('#navbarToggle').getByRole('link', { name: 'Map' })).toBeVisible();
    // End of authentication steps.

    await page.context().storageState({ path: fileName });
    await page.close();
    await use(fileName);
    console.log(`Authentication complete. Cookie file created: ${fileName}`);
  }, { scope: 'worker' }],
});