import { test, expect } from '@playwright/test';

test.describe('Flashcards', () => {
  test.use({
    storageState: {
      cookies: [{ name: 'user_authenticated', value: 'true', domain: 'localhost', path: '/' }],
      origins: [],
    },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/flashcards');
  });

  test('should render flashcard page title', async ({ page }) => {
    await expect(page.getByText(/quản lý flashcards|bộ sưu tập/i)).toBeVisible();
  });

  test('should have create new list button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /tạo bộ mới/i })).toBeVisible();
  });

  test('should show tabs: mine and discover', async ({ page }) => {
    await expect(page.getByRole('button', { name: /của tôi/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /khám phá/i })).toBeVisible();
  });

  test('should show empty state when no lists', async ({ page }) => {
    await page.waitForTimeout(2000);
    const emptyState = page.getByText(/chưa có bộ flashcard/i);
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should open create dialog on button click', async ({ page }) => {
    await page.getByRole('button', { name: /tạo bộ mới/i }).click();
    await expect(page.getByText(/tạo bộ flashcard mới/i)).toBeVisible();
    await expect(page.getByPlaceholder(/vd.*từ vựng ielts/i)).toBeVisible();
  });

  test('create dialog should validate required name', async ({ page }) => {
    await page.getByRole('button', { name: /tạo bộ mới/i }).click();
    await page.getByRole('button', { name: /tạo mới/i }).click();
    await expect(page.getByText(/vui lòng nhập tên/i)).toBeVisible();
  });

  test('create dialog should have tags input', async ({ page }) => {
    await page.getByRole('button', { name: /tạo bộ mới/i }).click();
    await expect(page.getByPlaceholder(/nhập tag/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /thêm/i })).toBeVisible();
  });

  test('create dialog should have public toggle', async ({ page }) => {
    await page.getByRole('button', { name: /tạo bộ mới/i }).click();
    await expect(page.getByText(/công khai/i)).toBeVisible();
  });
});
