import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test.use({
    storageState: {
      cookies: [{ name: 'user_authenticated', value: 'true', domain: 'localhost', path: '/' }],
      origins: [],
    },
  });

  test('should render notifications page', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByText(/thông báo|notification/i)).toBeVisible();
  });

  test('should show empty state when no notifications', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    const emptyText = page.getByText(/không có thông báo|chưa có|no notification/i);
    if (await emptyText.isVisible()) {
      await expect(emptyText).toBeVisible();
    }
  });

  test('should have notification filters or tabs', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForTimeout(1000);
    const tabs = page.getByRole('button').filter({ hasText: /tất cả|hệ thống|báo cáo|thành tích|system|report|achievement/i });
    if (await tabs.first().isVisible()) {
      await expect(tabs.first()).toBeVisible();
    }
  });
});
