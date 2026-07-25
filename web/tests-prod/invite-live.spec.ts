import { test, expect } from '@playwright/test';

test('production: join link routes visitors to register with invite banner', async ({ page }) => {
  await page.goto('/join/e96108cf');
  await expect(page).toHaveURL('/register', { timeout: 15000 });
  await expect(page.getByTestId('invite-banner')).toBeVisible();
});
