import { test, expect } from '@playwright/test';

const DIR = 'tests/feature-screenshots';
const DEMO_EMAIL = 'john@famify-demo.com';
const DEMO_PASS = 'Demo123!';

test('Capture all feature pages', async ({ page }) => {
  test.setTimeout(120000);

  // 1. Login Page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${DIR}/01-login-page.png`, fullPage: true });

  // 2. Login with demo credentials
  await page.locator('input[type="email"], input[placeholder*="email" i]').fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').fill(DEMO_PASS);
  await page.screenshot({ path: `${DIR}/02-login-filled.png`, fullPage: true });

  // Submit login
  await page.locator('button[type="submit"], button:has-text("Sign In")').first().click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${DIR}/03-after-login.png`, fullPage: true });

  // 3. Dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${DIR}/04-dashboard.png`, fullPage: true });

  // 4. Planner - Calendar Tab (default)
  await page.goto('/planner');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${DIR}/05-planner-calendar.png`, fullPage: true });

  // 5. Planner - Tasks Tab
  const tasksBtn = page.locator('button', { hasText: 'Tasks' });
  if (await tasksBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await tasksBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/06-planner-tasks.png`, fullPage: true });
  }

  // 6. Planner - Routine Tab
  const routineBtn = page.locator('button', { hasText: 'Routine' });
  if (await routineBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await routineBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/07-planner-routine.png`, fullPage: true });
  }

  // 7. Planner - Lists Tab
  const listsBtn = page.locator('button', { hasText: 'Lists' });
  if (await listsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await listsBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/08-planner-lists.png`, fullPage: true });
  }

  // 8. Planner - Meals Tab
  const mealsBtn = page.locator('button', { hasText: 'Meals' });
  if (await mealsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mealsBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/09-planner-meals.png`, fullPage: true });
  }

  // 9. Planner - Reminders Tab
  const remindersBtn = page.locator('button', { hasText: 'Reminders' });
  if (await remindersBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await remindersBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/10-planner-reminders.png`, fullPage: true });
  }

  // 10. Planner - Notes Tab
  const notesBtn = page.locator('button', { hasText: 'Notes' });
  if (await notesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notesBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/11-planner-notes.png`, fullPage: true });
  }

  // 11. Needle - List View
  await page.goto('/needle');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${DIR}/12-needle-list.png`, fullPage: true });

  // 12. Needle - Map View toggle
  const mapToggle = page.locator('button').filter({ has: page.locator('svg') });
  // Find the view toggle buttons near the results count
  const viewButtons = page.locator('.rounded-lg.overflow-hidden button');
  if (await viewButtons.nth(1).isVisible({ timeout: 3000 }).catch(() => false)) {
    await viewButtons.nth(1).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${DIR}/13-needle-map.png`, fullPage: true });
  }

  // 13. Notifications
  await page.goto('/notifications');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${DIR}/14-notifications.png`, fullPage: true });

  // 14. Profile
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${DIR}/15-profile.png`, fullPage: true });

  // 15. Mobile views
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/16-mobile-dashboard.png`, fullPage: true });

  await page.goto('/planner');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/17-mobile-planner.png`, fullPage: true });

  await page.goto('/needle');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/18-mobile-needle.png`, fullPage: true });

  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/19-mobile-profile.png`, fullPage: true });
});
