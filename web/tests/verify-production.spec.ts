import { test, expect } from '@playwright/test';

const PROD = 'https://famify.co';

test('verify production deployment', async ({ page }) => {
  await page.goto(PROD);

  await expect(page).toHaveTitle(/Famify/);
  console.log('✅ Page loaded with title');

  // Root serves the public landing page
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/famify/i);
  await expect(page.locator('img[alt="Famify logo"]').first()).toBeVisible();
  await expect(page.getByTestId('reviews-section')).toBeVisible();
  console.log('✅ Landing page renders');

  // Demo login works end to end
  await page.goto(`${PROD}/login`);
  await page.getByRole('button', { name: 'Try Demo' }).click();
  await page.waitForURL(/dashboard/, { timeout: 30000 });
  console.log('✅ Demo login reaches dashboard');
});

test('test manual login', async ({ page }) => {
  await page.goto(`${PROD}/login`);

  await page.fill('input[type="email"]', 'john@famify-demo.com');
  await page.fill('input[type="password"]', 'Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL(/dashboard|family-setup/, { timeout: 30000 });
  console.log('✅ Manual login OK:', page.url());
});
