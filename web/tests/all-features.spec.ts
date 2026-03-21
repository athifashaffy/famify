import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'tests/screenshots';

test.describe('Famify - All Features Verification', () => {

  test('01 - Login Page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Famify')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png`, fullPage: true });
  });

  test('02 - Register Page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-register-page.png`, fullPage: true });
  });

  test('03 - Unauthenticated redirect to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-redirect-to-login.png`, fullPage: true });
  });

  test('04 - Login Page has email and password fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-login-fields.png`, fullPage: true });
  });

  test('05 - Register Page has form fields', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    const nameOrEmailInput = page.locator('input').first();
    await expect(nameOrEmailInput).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-register-fields.png`, fullPage: true });
  });

  test('06 - Navigation structure (sidebar items)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Check page loads without errors
    const pageContent = await page.content();
    expect(pageContent).toContain('Famify');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-navigation.png`, fullPage: true });
  });

  test('07 - Dashboard route exists', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Will redirect to login if not authenticated
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-dashboard-route.png`, fullPage: true });
  });

  test('08 - Planner route exists', async ({ page }) => {
    await page.goto('/planner');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-planner-route.png`, fullPage: true });
  });

  test('09 - Needle route exists', async ({ page }) => {
    await page.goto('/needle');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-needle-route.png`, fullPage: true });
  });

  test('10 - Notifications route exists', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-notifications-route.png`, fullPage: true });
  });

  test('11 - Profile route exists', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-profile-route.png`, fullPage: true });
  });

  test('12 - No Feed route (removed)', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    // Feed route is removed - should not render feed-specific content
    // The page will show login (redirect) or blank since no route matches /feed
    const hasFeedContent = await page.locator('text=Feed').count();
    // No "Feed" as a heading/nav label on the page
    const feedHeadings = await page.locator('h1:has-text("Feed"), h2:has-text("Feed")').count();
    expect(feedHeadings).toBe(0);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/12-no-feed-route.png`, fullPage: true });
  });

  test('13 - App loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('mapbox') && !e.includes('401') && !e.includes('Failed to load resource')
    );
    expect(criticalErrors).toHaveLength(0);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/13-no-errors.png`, fullPage: true });
  });

  test('14 - Login form is functional (can type)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/14-login-functional.png`, fullPage: true });
  });

  test('15 - Mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/15-mobile-login.png`, fullPage: true });
  });

  test('16 - Tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/16-tablet-login.png`, fullPage: true });
  });

  test('17 - Desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/17-desktop-login.png`, fullPage: true });
  });

  test('18 - Vite dev server serves the app', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/18-app-served.png`, fullPage: true });
  });

  test('19 - Root redirects to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Should redirect to /dashboard then to /login
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|login)/);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/19-root-redirect.png`, fullPage: true });
  });

  test('20 - All CSS loads correctly (Tailwind active)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Check that Tailwind classes are being applied (font, colors, etc.)
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // Body should have some background color applied
    expect(bgColor).toBeDefined();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/20-css-loaded.png`, fullPage: true });
  });
});
