import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.use({ storageState: undefined });
  test.describe('Unauthenticated', () => {
    test('should redirect from root to /landing', async ({ page }) => {
      await page.goto('/');
      await page.waitForURL('/landing');
    });

    test('should show public routes without sidebar', async ({ page }) => {
      await page.goto('/landing');
      await expect(page.getByRole('button', { name: /sidebar/i })).not.toBeVisible();
    });
  });

  test.describe('Authenticated', () => {
    test.use({
      storageState: {
        cookies: [{ name: 'user_authenticated', value: 'true', domain: 'localhost', path: '/' }],
        origins: [],
      },
    });

    test.beforeEach(async ({ page }) => {
      await page.goto('/test-selection');
    });

    test('should show sidebar with navigation links', async ({ page }) => {
      await expect(page.getByText(/dashboard/i)).toBeVisible();
      await expect(page.getByText(/thi thử/i)).toBeVisible();
      await expect(page.getByText(/flashcards/i)).toBeVisible();
    });

    test('should navigate to test-selection via sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      await page.getByRole('link', { name: /thi thử/i }).click();
      await page.waitForURL(/\/test-selection/);
    });

    test('should navigate to flashcards via sidebar', async ({ page }) => {
      await page.getByRole('link', { name: /flashcards/i }).click();
      await page.waitForURL(/\/flashcards/);
    });

    test('should navigate to progress page', async ({ page }) => {
      await page.getByRole('link', { name: /tiến độ/i }).click();
      await page.waitForURL(/\/progress/);
    });

    test('should navigate to blog page', async ({ page }) => {
      await page.getByRole('link', { name: /blog/i }).click();
      await page.waitForURL(/\/blog/);
    });

    test('should navigate to chat page', async ({ page }) => {
      await page.getByRole('link', { name: /trò chuyện/i }).click();
      await page.waitForURL(/\/chat/);
    });
  });
});
