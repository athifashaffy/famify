import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('root path shows the landing page instead of redirecting', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/famify/i);
  });

  test('shows user reviews with at least 3 testimonial cards', async ({ page }) => {
    await page.goto('/');
    const reviews = page.getByTestId('reviews-section');
    await expect(reviews).toBeVisible();
    await expect(reviews.getByRole('heading')).toContainText(/families|reviews|say/i);
    const cards = reviews.getByTestId('testimonial-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
    await expect(cards.first()).toBeVisible();
  });

  test('has a video section beside the hero (player or placeholder)', async ({ page }) => {
    await page.goto('/');
    const videoSlot = page.getByTestId('hero-video');
    await expect(videoSlot).toBeVisible();
    const hasPlayerOrFallback = await videoSlot.evaluate((el) =>
      Boolean(el.querySelector('video') || el.querySelector('[data-testid="video-fallback"]'))
    );
    expect(hasPlayerOrFallback).toBe(true);
  });

  test('Get started navigates to register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /get started/i }).first().click();
    await expect(page).toHaveURL('/register');
  });

  test('Sign in navigates to login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await expect(page).toHaveURL('/login');
  });

  test('favicon is the Famify logo, not the Vite default', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="icon"]').first().getAttribute('href');
    expect(href).not.toContain('vite.svg');
    expect(href).toContain('logo');
    const res = await page.request.get(href!);
    expect(res.ok()).toBe(true);
  });
});
