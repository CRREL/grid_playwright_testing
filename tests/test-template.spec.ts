import { test, expect, Page } from '../fixtures';
import { navigateToMap } from '../utils/before-test';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
});

// Insert test(s) here
//--------------------

//--------------------