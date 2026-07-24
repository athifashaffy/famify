import { test, expect } from '@playwright/test';
import { DEMO_CREDENTIALS } from '../src/lib/constants';

const ADMIN_EMAIL = 'claude-max+famify-beta-test@flemmings-iceland.de';
const ADMIN_PASSWORD = 'FamifyBeta2026!';

test.describe('Admin panel', () => {
  test('non-admin user is redirected away from /admin', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(DEMO_CREDENTIALS.email);
    await page.getByLabel('Password').fill(DEMO_CREDENTIALS.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 20000 });

    await page.goto('/admin');
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  // Requires migration 017_admin_panel.sql applied to the live database
  // (it flags the beta test account as admin). Enable with:
  //   ADMIN_MIGRATION_APPLIED=1 npx playwright test tests/admin.spec.ts
  test('admin user sees founder dashboard with stats and users', async ({ page }) => {
    test.skip(!process.env.ADMIN_MIGRATION_APPLIED, 'migration 017 not applied yet');

    await page.goto('/login');
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/dashboard|family-setup/, { timeout: 20000 });

    await page.goto('/admin');
    await expect(page.getByTestId('admin-page')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('admin-stats')).toBeVisible();
    await expect(page.getByText('Total users')).toBeVisible();
    const rows = page.getByTestId('admin-users-table').locator('tbody tr');
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  });
});
