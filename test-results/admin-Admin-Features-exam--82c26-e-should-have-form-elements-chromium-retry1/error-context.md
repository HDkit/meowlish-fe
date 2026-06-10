# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Features >> exam creation page should have form elements
- Location: e2e/admin.spec.ts:11:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - button "Lingriser" [ref=e8] [cursor=pointer]:
        - img "Lingriser" [ref=e9]
      - generic [ref=e11]:
        - generic [ref=e12]: HỌC TẬP
        - list [ref=e14]:
          - listitem [ref=e15]:
            - button "Dashboard" [ref=e16] [cursor=pointer]:
              - img [ref=e17]
              - generic [ref=e22]: Dashboard
          - listitem [ref=e23]:
            - button "Chọn đề thi" [ref=e24] [cursor=pointer]:
              - img [ref=e25]
              - generic [ref=e28]: Chọn đề thi
          - listitem [ref=e29]:
            - button "Flashcards" [ref=e30] [cursor=pointer]:
              - img [ref=e31]
              - generic [ref=e33]: Flashcards
          - listitem [ref=e34]:
            - button "Luyện Nói" [ref=e35] [cursor=pointer]:
              - img [ref=e36]
              - generic [ref=e39]: Luyện Nói
          - listitem [ref=e40]:
            - button "Tiến độ" [ref=e41] [cursor=pointer]:
              - img [ref=e42]
              - generic [ref=e45]: Tiến độ
          - listitem [ref=e46]:
            - button "Blog" [ref=e47] [cursor=pointer]:
              - img [ref=e48]
              - generic [ref=e51]: Blog
          - listitem [ref=e52]:
            - button "Phòng Chat" [ref=e53] [cursor=pointer]:
              - img [ref=e54]
              - generic [ref=e56]: Phòng Chat
          - listitem [ref=e57]:
            - button "Thông báo" [ref=e58] [cursor=pointer]:
              - img [ref=e59]
              - generic [ref=e62]: Thông báo
      - list [ref=e65]:
        - listitem [ref=e66]:
          - button "Tài khoản" [ref=e67] [cursor=pointer]:
            - img [ref=e68]
            - generic [ref=e71]: Tài khoản
        - listitem [ref=e72]:
          - button "Đăng xuất" [ref=e73] [cursor=pointer]:
            - img [ref=e74]
            - generic [ref=e77]: Đăng xuất
    - main [ref=e78]:
      - generic [ref=e80]:
        - button "Toggle Sidebar" [ref=e81] [cursor=pointer]:
          - img
          - generic [ref=e82]: Toggle Sidebar
        - heading "Dashboard" [level=1] [ref=e83]
        - button [ref=e85] [cursor=pointer]:
          - img
      - main [ref=e86]
  - region "Notifications (F8)":
    - list
  - alert [ref=e90]
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
> 17 |     expect(hasForm).toBeTruthy();
     |                     ^ Error: expect(received).toBeTruthy()
  18 |   });
  19 | 
  20 |   test('exam management page should list exams', async ({ page }) => {
  21 |     await page.goto('/exam-management');
  22 |     await page.waitForTimeout(3000);
  23 |     await expect(page.getByText(/quản lý đề|exam|bài thi/i).first()).toBeVisible();
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