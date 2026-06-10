import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/landing');
  });

  test('should render hero section', async ({ page }) => {
    await expect(page.getByText(/hệ thống luyện thi thông minh/i)).toBeVisible();
  });

  test('should have navigation bar with Lingriser logo', async ({ page }) => {
    await expect(page.getByRole('link', { name: /lingriser/i }).first()).toBeVisible();
  });

  test('should have CTA button to get started', async ({ page }) => {
    await expect(page.getByRole('link', { name: /bắt đầu/i })).toBeVisible();
  });

  test('should have login link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /đăng nhập/i })).toBeVisible();
  });

  test('should navigate to auth page on login click', async ({ page }) => {
    await page.getByRole('link', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/auth/);
  });

  test('should have footer or features section', async ({ page }) => {
    await expect(page.locator('footer').or(page.getByText(/tính năng/i))).toBeVisible();
  });
});
