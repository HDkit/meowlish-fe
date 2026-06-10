import { test, expect } from '@playwright/test';

test.describe('Error Handling & Edge Cases', () => {
  test('should show 404 for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    expect(response?.status()).toBe(404);
  });

  test('should handle auth page with invalid mode param gracefully', async ({ page }) => {
    await page.goto('/auth?mode=invalid');
    await expect(page.getByRole('heading', { name: /chào mừng bạn trở lại/i })).toBeVisible();
  });

  test('should handle very long search queries gracefully', async ({ page }) => {
    await page.goto('/blog?search=' + 'a'.repeat(500));
    await page.waitForTimeout(2000);
    const hasNoError = await page.getByText(/lỗi|error|500/i).isVisible();
    expect(hasNoError).toBeFalsy();
  });

  test('flashcard list page should handle invalid list id', async ({ page }) => {
    const response = await page.goto('/flashcards/invalid-id-12345');
    expect(response?.ok()).toBeFalsy();
  });

  test('result page should handle invalid attempt id', async ({ page }) => {
    const response = await page.goto('/results/invalid-id-12345');
    expect(response?.ok()).toBeFalsy();
  });
});
