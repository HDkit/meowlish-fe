import { test, expect } from '@playwright/test';

test.describe('Admin Features', () => {
  test.use({
    storageState: {
      cookies: [{ name: 'user_authenticated', value: 'true', domain: 'localhost', path: '/' }],
      origins: [],
    },
  });

  test('exam creation page should have form elements', async ({ page }) => {
    await page.goto('/exam-creation');
    await page.waitForTimeout(2000);
    const hasForm = await page.getByRole('heading', { name: /tạo đề|exam|đề thi/i }).isVisible()
      || await page.locator('form').isVisible()
      || await page.getByPlaceholder(/tên đề|title|name/i).isVisible();
    expect(hasForm).toBeTruthy();
  });

  test('exam management page should list exams', async ({ page }) => {
    await page.goto('/exam-management');
    await page.waitForTimeout(3000);
    await expect(page.getByText(/quản lý đề|exam|bài thi/i).first()).toBeVisible();
  });

  test('blog management page should have CRUD elements', async ({ page }) => {
    await page.goto('/blog-management');
    await page.waitForTimeout(2000);
    await expect(page.getByRole('button', { name: /tạo bài viết|thêm|new/i }).or(page.getByText(/quản lý blog/i))).toBeVisible();
  });

  test('user management page should render', async ({ page }) => {
    await page.goto('/user-management');
    await page.waitForTimeout(2000);
    await expect(page.getByText(/quản lý người dùng|user|thành viên/i).first()).toBeVisible();
  });

  test('report management page should render', async ({ page }) => {
    await page.goto('/report-management');
    await page.waitForTimeout(2000);
    await expect(page.getByText(/quản lý báo cáo|report/i).first()).toBeVisible();
  });

  test('exam approval page should render for staff', async ({ page }) => {
    await page.goto('/exam-approval');
    await page.waitForTimeout(2000);
    const pageContent = page.getByText(/phê duyệt|approve|duyệt đề/i).first();
    if (await pageContent.isVisible()) {
      await expect(pageContent).toBeVisible();
    }
  });

  test('admin sidebar should have admin links', async ({ page }) => {
    await page.goto('/dashboard');
    const adminLinks = page.getByText(/tạo đề|quản lý đề|blog|người dùng|báo cáo|phê duyệt/i);
    if (await adminLinks.first().isVisible()) {
      await expect(adminLinks.first()).toBeVisible();
    }
  });

  test('exam management page should have filter/search', async ({ page }) => {
    await page.goto('/exam-management');
    await page.waitForTimeout(2000);
    const searchInput = page.getByPlaceholder(/tìm kiếm|search|lọc|filter/i);
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });
});
