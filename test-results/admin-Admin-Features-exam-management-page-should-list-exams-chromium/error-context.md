# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Features >> exam management page should list exams
- Location: e2e/admin.spec.ts:20:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/quản lý đề|exam|bài thi/i).first()
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/quản lý đề|exam|bài thi/i).first()

```

```yaml
- button "Lingriser":
  - img "Lingriser"
- text: HỌC TẬP
- list:
  - listitem:
    - button "Dashboard":
      - img
      - text: Dashboard
  - listitem:
    - button "Chọn đề thi":
      - img
      - text: Chọn đề thi
  - listitem:
    - button "Flashcards":
      - img
      - text: Flashcards
  - listitem:
    - button "Luyện Nói":
      - img
      - text: Luyện Nói
  - listitem:
    - button "Tiến độ":
      - img
      - text: Tiến độ
  - listitem:
    - button "Blog":
      - img
      - text: Blog
  - listitem:
    - button "Phòng Chat":
      - img
      - text: Phòng Chat
  - listitem:
    - button "Thông báo":
      - img
      - text: Thông báo
- list:
  - listitem:
    - button "Tài khoản":
      - img
      - text: Tài khoản
  - listitem:
    - button "Đăng xuất":
      - img
      - text: Đăng xuất
- main:
  - button "Toggle Sidebar":
    - img
    - text: Toggle Sidebar
  - heading "Dashboard" [level=1]
  - button:
    - img
  - main
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Admin Features', () => {
  4  |   test.use({
  5  |     storageState: {
  6  |       cookies: [{ name: 'user_authenticated', value: 'true', domain: 'localhost', path: '/' }],
  7  |       origins: [],
  8  |     },
  9  |   });
  10 | 
  11 |   test('exam creation page should have form elements', async ({ page }) => {
  12 |     await page.goto('/exam-creation');
  13 |     await page.waitForTimeout(2000);
  14 |     const hasForm = await page.getByRole('heading', { name: /tạo đề|exam|đề thi/i }).isVisible()
  15 |       || await page.locator('form').isVisible()
  16 |       || await page.getByPlaceholder(/tên đề|title|name/i).isVisible();
  17 |     expect(hasForm).toBeTruthy();
  18 |   });
  19 | 
  20 |   test('exam management page should list exams', async ({ page }) => {
  21 |     await page.goto('/exam-management');
  22 |     await page.waitForTimeout(3000);
> 23 |     await expect(page.getByText(/quản lý đề|exam|bài thi/i).first()).toBeVisible();
     |                                                                      ^ Error: expect(locator).toBeVisible() failed
  24 |   });
  25 | 
  26 |   test('blog management page should have CRUD elements', async ({ page }) => {
  27 |     await page.goto('/blog-management');
  28 |     await page.waitForTimeout(2000);
  29 |     await expect(page.getByRole('button', { name: /tạo bài viết|thêm|new/i }).or(page.getByText(/quản lý blog/i))).toBeVisible();
  30 |   });
  31 | 
  32 |   test('user management page should render', async ({ page }) => {
  33 |     await page.goto('/user-management');
  34 |     await page.waitForTimeout(2000);
  35 |     await expect(page.getByText(/quản lý người dùng|user|thành viên/i).first()).toBeVisible();
  36 |   });
  37 | 
  38 |   test('report management page should render', async ({ page }) => {
  39 |     await page.goto('/report-management');
  40 |     await page.waitForTimeout(2000);
  41 |     await expect(page.getByText(/quản lý báo cáo|report/i).first()).toBeVisible();
  42 |   });
  43 | 
  44 |   test('exam approval page should render for staff', async ({ page }) => {
  45 |     await page.goto('/exam-approval');
  46 |     await page.waitForTimeout(2000);
  47 |     const pageContent = page.getByText(/phê duyệt|approve|duyệt đề/i).first();
  48 |     if (await pageContent.isVisible()) {
  49 |       await expect(pageContent).toBeVisible();
  50 |     }
  51 |   });
  52 | 
  53 |   test('admin sidebar should have admin links', async ({ page }) => {
  54 |     await page.goto('/dashboard');
  55 |     const adminLinks = page.getByText(/tạo đề|quản lý đề|blog|người dùng|báo cáo|phê duyệt/i);
  56 |     if (await adminLinks.first().isVisible()) {
  57 |       await expect(adminLinks.first()).toBeVisible();
  58 |     }
  59 |   });
  60 | 
  61 |   test('exam management page should have filter/search', async ({ page }) => {
  62 |     await page.goto('/exam-management');
  63 |     await page.waitForTimeout(2000);
  64 |     const searchInput = page.getByPlaceholder(/tìm kiếm|search|lọc|filter/i);
  65 |     if (await searchInput.isVisible()) {
  66 |       await expect(searchInput).toBeVisible();
  67 |     }
  68 |   });
  69 | });
  70 | 
```