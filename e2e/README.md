# E2E Test Suite — Lingriser

## Overview

**83 Playwright test cases** covering the core user flows of the Lingriser English prep platform.

## Setup

```bash
# Playwright is already installed as a devDependency.
# If not, run:
npm install --save-dev @playwright/test

# Install Chromium browser (already done):
npx playwright install chromium

# Start the dev server:
npm run dev

# In another terminal, run the tests:
npx playwright test

# With UI mode:
npx playwright test --ui

# View the HTML report:
npx playwright show-report
```

## Test Files (83 tests total)

| File | Tests | Area |
|------|-------|------|
| `auth.spec.ts` | 12 | Login, register, form validation, Google OAuth, protected routes |
| `landing.spec.ts` | 6 | Hero section, navbar, CTA buttons, navigation to auth |
| `navigation.spec.ts` | 8 | Public redirects, sidebar links, page transitions |
| `dashboard.spec.ts` | 8 | Stats, calendar, quick actions, profile, sidebar highlight |
| `test-selection.spec.ts` | 10 | Exam list, skill filter, type filter, search, detail navigation |
| `flashcards.spec.ts` | 8 | List view, create dialog, validation, tags, public toggle |
| `writing.spec.ts` | 5 | Page render, textarea, submit button, word count |
| `blog.spec.ts` | 5 | Article list, search, empty state, report button |
| `progress.spec.ts` | 5 | Stats, charts, calendar heatmap, skill breakdown |
| `admin.spec.ts` | 8 | Exam management, blog CRUD, user management, reports, approval |
| `notifications.spec.ts` | 3 | Empty state, filters |
| `error-handling.spec.ts` | 5 | 404, invalid params, long queries, edge cases |

## Test Descriptions

### Authentication (12 tests) — `auth.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | Login form renders by default | Heading, email input, password input, submit button |
| 2 | Switch to register mode | URL query param, username field, confirm password field |
| 3 | Empty login validation | Field-level "required" error messages |
| 4 | Invalid email format | "Email không hợp lệ" shown for bad email |
| 5 | Register password length | Error when password < 6 characters |
| 6 | Confirm password mismatch | "Mật khẩu xác nhận không khớp" error |
| 7 | Failed login shows error alert | Alert component appears after bad credentials |
| 8 | Google OAuth button visible | "Google" button present on form |
| 9 | Password visibility toggle | `type="password"` toggles to `type="text"` |
| 10 | Protected route redirects | `/dashboard` → `/auth` when not logged in |
| 11 | Landing navbar on auth page | Lingriser logo/link visible |
| 12 | Processing state for login token | Loading spinner shown when `loginToken` param present |

### Landing Page (6 tests) — `landing.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | Hero section renders | Main tagline visible |
| 2 | Navbar with logo | Lingriser link present |
| 3 | CTA button exists | "Bắt đầu" link visible |
| 4 | Login link present | "Đăng nhập" link visible |
| 5 | Navigate to auth | Click login → `/auth` |
| 6 | Footer/features section | Footer or "tính năng" section present |

### Navigation (8 tests) — `navigation.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | `/` redirects to `/landing` | Root URL redirect (unauth) |
| 2 | No sidebar for public routes | Guest users don't see sidebar |
| 3 | Sidebar links visible (auth) | Dashboard, Thi thử, Flashcards in sidebar |
| 4 | Navigate to test-selection | Sidebar link → `/test-selection` |
| 5 | Navigate to flashcards | Sidebar link → `/flashcards` |
| 6 | Navigate to progress | Sidebar link → `/progress` |
| 7 | Navigate to blog | Sidebar link → `/blog` |
| 8 | Navigate to chat | Sidebar link → `/chat` |

### Dashboard (8 tests) — `dashboard.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | Dashboard renders | Heading visible |
| 2 | User greeting or stats | Welcome text or stats visible |
| 3 | Study calendar | Weekly layout visible if data exists |
| 4 | Quick action buttons | Links to test/flashcards visible |
| 5 | Score summary | Score/IELTS/TOEIC section present |
| 6 | Recent activity | Activity/history section |
| 7 | Profile link | User profile link visible |
| 8 | Sidebar highlights dashboard | Active state on dashboard link |

### Test Selection (10 tests) — `test-selection.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | Page title | "Kho đề thi" or similar heading |
| 2 | Skill filter tabs | Reading/Listening/Writing/Speaking tabs |
| 3 | Exam listing | "Đề thi" or exam cards present |
| 4 | Filter by skill | Clicking Reading tab highlights it |
| 5 | Test type filter | IELTS/TOEIC filter present |
| 6 | Exam cards with details | Cards with text "đề" visible |
| 7 | Navigate to exam detail | Click → `/test/[id]` |
| 8 | Start button on detail | "Bắt đầu" button on exam detail page |
| 9 | Search input | Search bar visible |
| 10 | Empty state | "Không tìm thấy" when no match |

### Flashcards (8 tests) — `flashcards.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | Page title | "Quản lý Flashcards" heading |
| 2 | Create button | "Tạo Bộ Mới" button |
| 3 | Mine/Discover tabs | Both tab buttons present |
| 4 | Empty state | "Chưa có bộ flashcard" text |
| 5 | Create dialog opens | Dialog with "Tạo bộ flashcard mới" title |
| 6 | Name validation | Error when saving without name |
| 7 | Tags input | Tag input + "Thêm" button |
| 8 | Public toggle | "Công khai" switch present |

### Writing (5 tests) — `writing.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | Page renders | "Luyện viết"/"Writing" heading |
| 2 | Writing task prompt | "Đề bài" or task description |
| 3 | Essay textarea | Input field for writing |
| 4 | Submit button | "Nộp bài" or "Kiểm tra" button |
| 5 | Word count | Counter visible after typing |

### Blog (5 tests) — `blog.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | Blog list renders | "Blog"/"Bài viết" heading |
| 2 | Article cards | Card/article elements visible |
| 3 | Search/filter | Search input present |
| 4 | Empty state | "Không tìm thấy" for no-match search |
| 5 | Report button on detail | "Báo cáo" button on article detail |

### Progress (5 tests) — `progress.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | Page renders | "Tiến độ"/"Thống kê" heading |
| 2 | Study statistics | "Bài thi"/"Số câu" stats visible |
| 3 | Charts | recharts SVG elements visible if data exists |
| 4 | Calendar heatmap | Calendar/heatmap element if data exists |
| 5 | Skill breakdown | Reading/Listening/Writing text |

### Admin (8 tests) — `admin.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | Exam creation form | Heading, form, or input present |
| 2 | Exam management list | "Quản lý đề" page renders |
| 3 | Blog management CRUD | "Tạo bài viết" button or heading |
| 4 | User management | "Quản lý người dùng" heading |
| 5 | Report management | "Quản lý báo cáo" heading |
| 6 | Exam approval | "Phê duyệt" text if accessible |
| 7 | Admin sidebar links | Admin navigation links visible |
| 8 | Management search/filter | Search input on management pages |

### Notifications (3 tests) — `notifications.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | Page renders | "Thông báo" heading |
| 2 | Empty state | "Không có thông báo" text |
| 3 | Filter tabs | Category tabs (Hệ thống, Báo cáo) |

### Error Handling (5 tests) — `error-handling.spec.ts`

| # | Test | What it checks |
|---|------|----------------|
| 1 | 404 page | Unknown route returns 404 |
| 2 | Invalid auth mode | Graceful fallback to login |
| 3 | Long search query | No crash with 500-char search |
| 4 | Invalid flashcard list ID | Error response, not crash |
| 5 | Invalid result ID | Error response, not crash |

## Running Specific Tests

```bash
# Run a single file
npx playwright test e2e/auth.spec.ts

# Run tests matching a name pattern
npx playwright test -g "login|register"

# Run with visible browser
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## Configuration

See `playwright.config.ts` at the project root:
- **Base URL**: `http://localhost:6767`
- **Browser**: Chromium (Desktop Chrome, locale `vi-VN`)
- **Retries**: 1 (2 in CI)
- **Workers**: 1 (sequentially for state-dependent auth tests)
- **Traces**: on first retry
- **Screenshots**: on failure
- **Video**: on failure
