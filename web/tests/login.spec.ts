import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display Famify branding and title', async ({ page }) => {
    // Check for Famify title
    await expect(page.locator('h1').filter({ hasText: 'Famify' })).toBeVisible();
    await expect(page.locator('h1').filter({ hasText: 'Famify' })).toHaveCSS('color', 'rgb(5, 150, 105)'); // emerald-600

    // Check for tagline
    await expect(page.getByText('Manage your family, together')).toBeVisible();
  });

  test('should have emerald gradient background', async ({ page }) => {
    // #root has no styles of its own; the gradient is on the page container inside it
    const bgContainer = page.locator('.bg-gradient-to-br').first();
    const bgStyle = await bgContainer.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.background || styles.backgroundImage;
    });

    // Check that gradient is applied (contains gradient keyword)
    expect(bgStyle).toContain('gradient');
  });

  test('should display Sign In heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should have email input field', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');
  });

  test('should have password input field', async ({ page }) => {
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
  });

  test('should have Sign In button with emerald styling', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();

    // Check emerald background color
    const bgColor = await signInButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBe('rgb(16, 185, 129)'); // emerald-500
  });

  test('should have Try Demo button with outline styling', async ({ page }) => {
    const demoButton = page.getByRole('button', { name: 'Try Demo' });
    await expect(demoButton).toBeVisible();

    // Check it has border (outline variant)
    const borderWidth = await demoButton.evaluate((el) => {
      return window.getComputedStyle(el).borderWidth;
    });
    expect(borderWidth).not.toBe('0px');
  });

  test('should have Create Account link', async ({ page }) => {
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('should navigate to register page when Create Account is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('should fill in form fields', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    await expect(page.getByLabel('Email')).toHaveValue('test@example.com');
    await expect(page.getByLabel('Password')).toHaveValue('password123');
  });

  test('should show an error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('wrong-password-123');

    await page.getByRole('button', { name: 'Sign In' }).click();

    // Supabase rejects the credentials and the error box appears
    await expect(page.locator('.text-rose-600')).toBeVisible({ timeout: 15000 });
  });

  test('Try Demo button signs in with the demo account', async ({ page }) => {
    await page.getByRole('button', { name: 'Try Demo' }).click();

    // Demo login goes straight to the dashboard (no form fill step anymore)
    await expect(page).toHaveURL('/dashboard', { timeout: 20000 });
  });
});
