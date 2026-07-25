import { test, expect } from '@playwright/test';
import { DEMO_CREDENTIALS } from '../src/lib/constants';

test('login never flashes the family-setup screen while family is loading', async ({ page }) => {
  // Slow the family lookup so the loading window is wide enough to observe
  await page.route('**/rest/v1/family_members*', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill(DEMO_CREDENTIALS.email);
  await page.getByLabel('Password').fill(DEMO_CREDENTIALS.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Mid-transition (family fetch still in flight) the setup screen must not appear.
  // Instant snapshot — expect().not.toBeVisible() would retry until the flash ends.
  await page.waitForTimeout(1000);
  expect(await page.getByText('Welcome to Famify').isVisible()).toBe(false);
  expect(page.url()).not.toContain('/family-setup');

  await expect(page).toHaveURL('/dashboard', { timeout: 20000 });
});
