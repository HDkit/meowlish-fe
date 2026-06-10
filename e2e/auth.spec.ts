import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should render login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /chào mừng bạn trở lại/i })).toBeVisible();
    await expect(page.getByPlaceholder(/nhập email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/nhập mật khẩu/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /đăng nhập vào hệ thống/i })).toBeVisible();
  });

  test('should switch to register mode', async ({ page }) => {
    await page.getByRole('link', { name: /đăng ký ngay/i }).click();
    await page.waitForURL(/\?mode=register/);
    await expect(page.getByRole('heading', { name: /tạo tài khoản mới/i })).toBeVisible();
    await expect(page.getByPlaceholder(/nhập username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/nhập lại mật khẩu/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /đăng ký tài khoản/i })).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.getByRole('button', { name: /đăng nhập vào hệ thống/i }).click();
    await expect(page.getByText(/email là bắt buộc/i)).toBeVisible();
    await expect(page.getByText(/mật khẩu là bắt buộc/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByPlaceholder(/nhập email/i).fill('invalid-email');
    await page.getByPlaceholder(/nhập mật khẩu/i).fill('password123');
    await page.getByRole('button', { name: /đăng nhập vào hệ thống/i }).click();
    await expect(page.getByText(/email không hợp lệ/i)).toBeVisible();
  });

  test('should validate password length on register', async ({ page }) => {
    await page.goto('/auth?mode=register');
    await page.getByPlaceholder(/nhập username/i).fill('Test User');
    await page.getByPlaceholder(/nhập email/i).fill('test@example.com');
    await page.getByPlaceholder(/nhập mật khẩu/i).fill('12345');
    await page.getByPlaceholder(/nhập lại mật khẩu/i).fill('12345');
    await page.getByRole('button', { name: /đăng ký tài khoản/i }).click();
    await expect(page.getByText(/mật khẩu phải dài/i)).toBeVisible();
  });

  test('should validate confirm password match on register', async ({ page }) => {
    await page.goto('/auth?mode=register');
    await page.getByPlaceholder(/nhập username/i).fill('Test User');
    await page.getByPlaceholder(/nhập email/i).fill('test@example.com');
    await page.getByPlaceholder(/nhập mật khẩu/i).fill('password123');
    await page.getByPlaceholder(/nhập lại mật khẩu/i).fill('different');
    await page.getByRole('button', { name: /đăng ký tài khoản/i }).click();
    await expect(page.getByText(/mật khẩu xác nhận không khớp/i)).toBeVisible();
  });

  test('should show error on failed login', async ({ page }) => {
    await page.getByPlaceholder(/nhập email/i).fill('wrong@example.com');
    await page.getByPlaceholder(/nhập mật khẩu/i).fill('wrongpassword');
    await page.getByRole('button', { name: /đăng nhập vào hệ thống/i }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15000 });
  });

  test('should have Google OAuth button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/nhập mật khẩu/i);
    await passwordInput.fill('secret123');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.locator('button').filter({ has: page.locator('.lucide-eye-off') }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should redirect to auth when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/auth/);
  });

  test('should render landing navbar on auth page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /lingriser/i }).first()).toBeVisible();
  });

  test('should show processing state for login token', async ({ page }) => {
    await page.goto('/auth?loginToken=sample-token');
    await expect(page.getByText(/đang xử lý đăng nhập/i)).toBeVisible({ timeout: 5000 });
  });
});
