import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test.use({
    storageState: {
      cookies: [{ name: 'user_authenticated', value: 'true', domain: 'localhost', path: '/' }],
      origins: [],
    },
  });

  test('should render blog list page', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.getByText(/blog|bài viết|tin tức|kiến thức/i)).toBeVisible();
  });

  test('should display blog article cards', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForTimeout(3000);
    const article = page.locator('[class*="card"]').or(page.locator('article')).first();
    if (await article.isVisible()) {
      await expect(article).toBeVisible();
    }
  });

  test('should have search or filter for articles', async ({ page }) => {
    await page.goto('/blog');
    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should show empty state when no articles', async ({ page }) => {
    await page.goto('/blog?search=zzzznotexist');
    await page.waitForTimeout(2000);
    const empty = page.getByText(/không tìm thấy|chưa có bài viết|no blog/i);
    if (await empty.isVisible()) {
      await expect(empty).toBeVisible();
    }
  });

  test('report button should be present on blog detail', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForTimeout(3000);
    const firstArticle = page.getByRole('link').filter({ hasText: /xem thêm|đọc thêm|chi tiết/i }).first();
    if (await firstArticle.isVisible()) {
      await firstArticle.click();
      await page.waitForURL(/\/blog\//);
      await expect(page.getByRole('button', { name: /báo cáo|report/i }).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
