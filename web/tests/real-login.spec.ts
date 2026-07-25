import { test, expect } from '@playwright/test';

test('Real login with demo credentials', async ({ page }) => {
  await page.goto('/login');

  // Fill in demo credentials
  await page.getByLabel('Email').fill('john@famify-demo.com');
  await page.getByLabel('Password').fill('Demo123!');

  // Click sign in
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for redirect to dashboard or family setup
  await page.waitForURL(/\/(dashboard|family-setup)/, { timeout: 10000 });

  // Take screenshot
  await page.screenshot({ path: 'login-success.png', fullPage: true });

  // Check if we're on dashboard or family-setup
  const url = page.url();
  console.log('✅ Login successful! Redirected to:', url);

  // Verify we're authenticated
  expect(url).toMatch(/\/(dashboard|family-setup)/);
});

test('Try Demo button auto-login', async ({ page }) => {
  await page.goto('/login');

  // Try Demo signs in directly with the demo account (no form-fill step)
  await page.getByRole('button', { name: 'Try Demo' }).click();
  await page.waitForURL(/\/(dashboard|family-setup)/, { timeout: 20000 });

  console.log('✅ Try Demo login successful!');
});
