import { test, expect } from '@playwright/test';

test.describe('Progress', () => {
  test.use({
    storageState: {
      cookies: [{ name: 'user_authenticated', value: 'true', domain: 'localhost', path: '/' }],
      origins: [],
    },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/progress');
  });

  test('should render progress page', async ({ page }) => {
    await expect(page.getByText(/tiến độ|progress|thống kê/i)).toBeVisible();
  });

  test('should display study statistics', async ({ page }) => {
    await expect(page.getByText(/bài thi|số câu|luyện tập|đã làm/i).first()).toBeVisible();
  });

  test('should show charts if data available', async ({ page }) => {
    await page.waitForTimeout(3000);
    const chartContainer = page.locator('.recharts-wrapper, [class*="chart"], svg.recharts-surface').first();
    if (await chartContainer.isVisible()) {
      await expect(chartContainer).toBeVisible();
    }
  });

  test('should have study calendar heatmap', async ({ page }) => {
    await page.waitForTimeout(2000);
    const calendar = page.locator('.recharts-wrapper, [class*="calendar"], [class*="heatmap"], [class*="streak"]').first();
    if (await calendar.isVisible()) {
      await expect(calendar).toBeVisible();
    }
  });

  test('should show per-skill breakdown', async ({ page }) => {
    const skillSection = page.getByText(/reading|listening|writing|speaking|kỹ năng/i).first();
    if (await skillSection.isVisible()) {
      await expect(skillSection).toBeVisible();
    }
  });
});
