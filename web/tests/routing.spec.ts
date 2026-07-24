import { test, expect } from '@playwright/test';

test.describe('Routing and Navigation', () => {
  test('should show the landing page at the root path', async ({ page }) => {
    await page.goto('/');
    // Root now serves the public landing page for everyone
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/famify/i);
  });

  test('should access login page directly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should access register page directly', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  });

  test('should show emerald gradient background on auth pages', async ({ page }) => {
    await page.goto('/login');
    // #root itself has no styles; the gradient lives on the page container inside it
    const container = page.locator('.bg-gradient-to-br').first();
    const bgStyle = await container.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });
    expect(bgStyle).toContain('gradient');
  });
});
