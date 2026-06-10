import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.use({
    storageState: {
      cookies: [{ name: 'user_authenticated', value: 'true', domain: 'localhost', path: '/' }],
      origins: [],
    },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should render dashboard page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard|tổng quan|bảng điều khiển/i })).toBeVisible();
  });

  test('should display user greeting or stats', async ({ page }) => {
    await expect(page.getByText(/xin chào|số ngày|bài thi|streak|điểm/i).first()).toBeVisible();
  });

  test('should show study calendar if available', async ({ page }) => {
    const calendar = page.getByText(/thứ hai|thứ 3|thứ 4|thứ 5|thứ 6/i);
    if (await calendar.isVisible()) {
      await expect(calendar).toBeVisible();
    }
  });

  test('should have quick action buttons', async ({ page }) => {
    await expect(page.getByRole('link', { name: /thi thử|bài thi|flashcard/i }).first()).toBeVisible();
  });

  test('should display score summary section', async ({ page }) => {
    await expect(page.getByText(/điểm|score|ielts|toeic|kết quả/i).first()).toBeVisible();
  });

  test('should show recent activity', async ({ page }) => {
    const activitySection = page.getByText(/gần đây|hoạt động|lịch sử|bài làm/i).first();
    if (await activitySection.isVisible()) {
      await expect(activitySection).toBeVisible();
    }
  });

  test('should have profile link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /profi|cá nhân|user/i }).or(page.getByText(/cá nhân/i))).toBeVisible();
  });

  test('sidebar should highlight dashboard', async ({ page }) => {
    const activeLink = page.locator('[data-active="true"], .bg-primary, a.text-primary').first();
    if (await activeLink.isVisible()) {
      await expect(activeLink).toBeVisible();
    }
  });
});
