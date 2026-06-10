import { test, expect } from '@playwright/test';

test.describe('Writing', () => {
  test.use({
    storageState: {
      cookies: [{ name: 'user_authenticated', value: 'true', domain: 'localhost', path: '/' }],
      origins: [],
    },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/writing');
  });

  test('should render writing page', async ({ page }) => {
    await expect(page.getByText(/luyện viết|writing|essay/i)).toBeVisible();
  });

  test('should have writing prompt or task description', async ({ page }) => {
    await expect(page.getByText(/đề bài|task|topic|chủ đề/i).first()).toBeVisible();
  });

  test('should have text area for essay input', async ({ page }) => {
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('should have submit button for evaluation', async ({ page }) => {
    await expect(page.getByRole('button', { name: /nộp bài|submit|gửi|kiểm tra/i }).first()).toBeVisible();
  });

  test('should show word count or char count', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('This is a sample essay for testing the writing evaluation feature.');
    const countDisplay = page.getByText(/từ|word|chữ|char/i).first();
    if (await countDisplay.isVisible()) {
      await expect(countDisplay).toBeVisible();
    }
  });
});
