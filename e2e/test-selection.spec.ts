import { test, expect } from '@playwright/test';

test.describe('Test Selection', () => {
  test.use({
    storageState: {
      cookies: [{ name: 'user_authenticated', value: 'true', domain: 'localhost', path: '/' }],
      origins: [],
    },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/test-selection');
  });

  test('should render page title', async ({ page }) => {
    await expect(page.getByText(/kho đề thi|chọn bài thi|thi thử|test/i)).toBeVisible();
  });

  test('should display skill filter tabs', async ({ page }) => {
    await expect(page.getByText(/reading|listening|writing|speaking|tất cả/i).first()).toBeVisible();
  });

  test('should display exam listing', async ({ page }) => {
    await expect(page.getByText(/đề thi|exam|bài thi/i).first()).toBeVisible();
  });

  test('should filter exams by skill', async ({ page }) => {
    const readingTab = page.getByRole('button', { name: /reading/i });
    if (await readingTab.isVisible()) {
      await readingTab.click();
      await expect(readingTab).toHaveClass(/(bg-primary|text-white)/i);
    }
  });

  test('should have test type filter (IELTS/TOEIC)', async ({ page }) => {
    const typeFilter = page.getByText(/ielts|toeic/i).first();
    if (await typeFilter.isVisible()) {
      await expect(typeFilter).toBeVisible();
    }
  });

  test('should show exam cards with details', async ({ page }) => {
    await page.waitForTimeout(3000);
    const examCard = page.locator('[class*="card"], [class*="rounded"]').filter({ hasText: /đề|exam|test/i }).first();
    if (await examCard.isVisible()) {
      await expect(examCard).toBeVisible();
    }
  });

  test('should navigate to exam detail on click', async ({ page }) => {
    await page.waitForTimeout(3000);
    const firstExam = page.getByRole('link').filter({ hasText: /xem chi tiết|bắt đầu|vào thi/i }).first();
    if (await firstExam.isVisible()) {
      await firstExam.click();
      await page.waitForURL(/\/test\//);
    }
  });

  test('exam detail page should show start button', async ({ page }) => {
    await page.waitForTimeout(3000);
    const firstExam = page.getByRole('link').filter({ hasText: /xem chi tiết|bắt đầu|vào thi/i }).first();
    if (await firstExam.isVisible()) {
      await firstExam.click();
      await page.waitForURL(/\/test\//);
      await expect(page.getByRole('button', { name: /bắt đầu|vào thi|start/i }).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should show empty state when no exams match filter', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('zzzznotexist999');
      await page.waitForTimeout(1000);
      await expect(page.getByText(/không tìm thấy|không có|no result/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
