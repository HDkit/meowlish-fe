# Spring Garden Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full visual and structural redesign of english-prep: no gradients, organic nature aesthetic, hybrid navigation (landing top nav + app sidebar), simplified theming (light+dark only), anti-AI-slop design.

**Architecture:** CSS custom properties define the token layer (globals.css). Tailwind maps tokens to utilities (tailwind.config.ts). Components consume tokens via Tailwind classes. The redesign touches: globals.css (token + animation layer), 23 component files (gradient removal), layout.tsx (navigation restructure), and 4 deleted files (Vite-era leftovers + duplicate layout). A new AppSidebar component replaces the top navbar for authenticated app pages.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui, next-themes, Redux Toolkit, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-28-spring-garden-redesign-design.md`

---

## File Map

### Files to Create
- `src/components/AppSidebar.tsx` — collapsible sidebar for authenticated app pages
- `src/components/AppTopBar.tsx` — thin top bar for app pages (page title, theme toggle, user avatar)
- `src/components/ThemeToggle.tsx` — simple sun/moon dark mode toggle
- `src/components/FloatingLeaves.tsx` — subtle floating leaf particle component
- `src/components/LandingNavbar.tsx` — simplified top navbar for landing page only

### Files to Modify
- `src/app/globals.css` — remove mint/forest theme blocks, fix dark mode tokens, add shadow tokens, add leaf animation
- `src/app/layout.tsx` — restructure for hybrid navigation (conditional sidebar vs top nav)
- `src/components/ui/button.tsx` — restyle variants per spec (rounded-xl, hover lift)
- `src/components/LandingPage.tsx` — full rewrite per spec (anti-slop)
- `src/components/Dashboard.tsx` — redesign with sidebar layout, remove gradients
- `src/components/AdminDashboard.tsx` — redesign, remove gradients
- `src/components/AuthForm.tsx` — remove gradients
- `src/components/TestSelection.tsx` — remove gradients
- `src/components/TestDetail.tsx` — remove gradients (6 instances)
- `src/components/TestResult.tsx` — remove gradients
- `src/components/TestInterface.tsx` — remove gradients (6 instances)
- `src/components/FlashcardPage.tsx` — remove gradients (4 instances)
- `src/components/FlashcardListDetail.tsx` — remove gradients (3 instances)
- `src/components/BlogPage.tsx` — remove gradients (5 instances)
- `src/components/BlogManagementPage.tsx` — remove gradients (4 instances)
- `src/components/SpeakingWritingPage.tsx` — remove gradients
- `src/components/SpeakingTest.tsx` — remove gradients
- `src/components/ExamApprovalPage.tsx` — remove gradients (3 instances)
- `src/components/ExamManagementPage.tsx` — remove gradients
- `src/components/UserManagementPage.tsx` — remove gradients
- `src/components/ResultsView.tsx` — remove gradients
- `src/components/UserPage.tsx` — remove gradients
- `src/components/SpeakingSession.tsx` — remove gradients
- `src/components/SpeakingResults.tsx` — remove gradients
- `src/components/WritingTest.tsx` — remove gradients
- `src/components/ExamCreationPage.tsx` — remove gradients
- `tailwind.config.ts` — add font-display for Monda, update safelist

### Files to Delete
- `src/contexts/ThemeContext.tsx` — replaced by next-themes only
- `src/components/theme/ThemeSwitcher.tsx` — replaced by ThemeToggle
- `src/components/MainNavbar.tsx` — replaced by LandingNavbar + AppSidebar
- `src/app/(app)/layout.tsx` — duplicate layout causing double navbar
- `src/styles/globals.css` — Vite-era duplicate
- `src/App.tsx` — Vite-era leftover
- `src/main.tsx` — Vite-era leftover

---

## Task 1: CSS Foundation — Tokens, Shadows, Dark Mode

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Remove mint-productivity and forest-focus theme blocks from globals.css**

Delete lines 83–141 (the `:root[data-app-theme='mint-productivity']` and `:root[data-app-theme='forest-focus']` blocks).

- [ ] **Step 2: Fix dark mode tokens**

In the `.dark` block (lines 51–81), replace these values:

```css
.dark {
  --background: 220 20% 10%;
  --foreground: 0 0% 98%;
  --card: 220 20% 14%;
  --card-foreground: 0 0% 98%;
  --popover: 220 20% 14%;
  --popover-foreground: 0 0% 98%;
  --primary: 144 50% 50%;          /* was: 84 86% 48% (lime) → stays green */
  --primary-foreground: 0 0% 100%;
  --secondary: 32 80% 55%;         /* was: 230 62% 61% (blue-purple) → warm amber */
  --secondary-foreground: 0 0% 98%;
  --muted: 220 15% 18%;            /* was: 220 20% 18% */
  --muted-foreground: 220 10% 70%;
  --accent: 46 85% 65%;            /* was: 56 100% 81% → toned-down gold */
  --accent-foreground: 220 20% 10%;
  --destructive: 0 62.8% 50%;
  --destructive-foreground: 0 0% 98%;
  --border: 220 20% 20%;
  --input: 220 20% 20%;
  --ring: 144 50% 50%;             /* was: 84 86% 48% → matches primary */
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --sidebar: 220 20% 14%;          /* was: 240 5.9% 10% → matches card */
  --sidebar-foreground: 0 0% 98%;  /* was: 240 4.8% 95.9% → matches foreground */
  --sidebar-primary: 144 50% 50%;  /* was: 224.3 76.3% 48% → matches primary */
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 220 15% 18%;   /* was: 240 3.7% 15.9% → matches muted */
  --sidebar-accent-foreground: 0 0% 98%;
  --sidebar-border: 220 20% 20%;   /* was: 240 3.7% 15.9% → matches border */
  --sidebar-ring: 144 50% 50%;     /* was: 217.2 91.2% 59.8% → matches primary */
}
```

- [ ] **Step 3: Fix light mode sidebar tokens**

In the `:root` block, update sidebar tokens to match spec:

```css
  --sidebar: 0 0% 100%;                    /* was: 0 0% 98% → matches card */
  --sidebar-foreground: 222.2 84% 4.9%;    /* was: 240 5.3% 26.1% → matches foreground */
  --sidebar-primary: 144 46% 55%;          /* was: 240 5.9% 10% → matches primary */
  --sidebar-primary-foreground: 0 0% 100%; /* was: 0 0% 98% */
  --sidebar-accent: 144 30% 92%;           /* was: 240 4.8% 95.9% → matches muted */
  --sidebar-accent-foreground: 222.2 84% 4.9%; /* was: 240 5.9% 10% → matches foreground */
  --sidebar-border: 214.3 31.8% 91.4%;    /* was: 220 13% 91% → matches border */
```

- [ ] **Step 4: Add shadow system tokens**

In `:root`, update the shadow tokens:

```css
  --shadow-soft: 0 4px 20px hsl(144 46% 55% / 0.06);
  --shadow-medium: 0 8px 30px hsl(144 46% 55% / 0.12);
  --shadow-heavy: 0 8px 30px hsl(144 46% 55% / 0.24);
```

The existing `--shadow-soft` and `--shadow-medium` use `hsl(220 15% 15% / ...)` — replace with green-tinted values.

- [ ] **Step 5: Add leaf animation keyframes**

Add to the `@layer utilities` block in globals.css:

```css
  @keyframes leaf-drift {
    0%   { transform: translateX(0) translateY(0) rotate(0deg); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateX(150px) translateY(100vh) rotate(390deg); opacity: 0; }
  }
  .animate-leaf-drift {
    animation: leaf-drift var(--leaf-duration, 18s) linear infinite;
  }
```

- [ ] **Step 6: Add font-display to tailwind.config.ts**

In the `fontFamily` section of `tailwind.config.ts`, add `display`:

```ts
fontFamily: {
  heading: ['Momo Trust Display', 'sans-serif'],
  body:    ['Google Sans Flex', 'sans-serif'],
  display: ['Monda', 'sans-serif'],
},
```

- [ ] **Step 7: Build check**

Run: `npm run build`
Expected: Build succeeds with no errors. The removed theme blocks have no TypeScript dependencies (they're pure CSS).

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css tailwind.config.ts
git commit -m "style: CSS foundation — fix dark tokens, add shadow system, remove multi-theme blocks"
```

---

## Task 2: Theme Simplification

**Files:**
- Create: `src/components/ThemeToggle.tsx`
- Delete: `src/contexts/ThemeContext.tsx`
- Delete: `src/components/theme/ThemeSwitcher.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create ThemeToggle component**

Create `src/components/ThemeToggle.tsx`:

```tsx
'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9 rounded-xl"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

- [ ] **Step 2: Update layout.tsx — remove AppThemeProvider**

Replace the root layout to remove AppThemeProvider import and usage:

```tsx
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import StoreProvider from '@/lib/store/StoreProvider';
import { Toaster } from '@/components/ui/toaster';
import { ApiClientProvider } from '@/components/ApiClientProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI English Exam Prep System',
  description: 'AI-powered English exam preparation with speaking and writing practice',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <StoreProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <ApiClientProvider>
              {children}
              <Toaster />
            </ApiClientProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
```

Key changes: removed `AppThemeProvider` import and wrapper, removed `MainNavbar` (moved to page-level layouts), removed the wrapping `div` (pages control their own layout now).

- [ ] **Step 3: Delete old theme files**

```bash
rm src/contexts/ThemeContext.tsx
rm src/components/theme/ThemeSwitcher.tsx
```

- [ ] **Step 4: Find and remove all imports of deleted modules**

Search for any remaining imports of `ThemeContext`, `AppThemeProvider`, `useAppTheme`, or `ThemeSwitcher`:

```bash
grep -rn "ThemeContext\|AppThemeProvider\|useAppTheme\|ThemeSwitcher" src/ --include="*.tsx" --include="*.ts"
```

Fix each file by removing the import line. The only consumer should be `MainNavbar.tsx` (which we'll replace in Task 4).

- [ ] **Step 5: Build check**

Run: `npm run build`
Expected: Build succeeds. If any file still imports the deleted modules, fix them.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: simplify theming — light/dark only via next-themes"
```

---

## Task 3: Cleanup Leftover Files

**Files:**
- Delete: `src/styles/globals.css`
- Delete: `src/App.tsx`
- Delete: `src/main.tsx`
- Delete: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Verify no imports reference these files**

```bash
grep -rn "styles/globals\|from.*App\|from.*main" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next"
```

Check if any file imports from `src/styles/globals.css`, `src/App.tsx`, or `src/main.tsx`. If they do, remove those import lines first.

- [ ] **Step 2: Check which routes use the (app) layout group**

```bash
ls src/app/\(app\)/ 2>/dev/null
```

If there are page files inside `src/app/(app)/`, they need to be moved to `src/app/` or the layout must be kept but stripped down. If the directory is empty except for `layout.tsx`, simply delete it.

- [ ] **Step 3: Delete leftover files**

```bash
rm -f src/styles/globals.css src/App.tsx src/main.tsx
# Only delete (app)/layout.tsx if safe per Step 2:
rm -f "src/app/(app)/layout.tsx"
# Remove empty directories:
rmdir src/styles 2>/dev/null || true
rmdir "src/app/(app)" 2>/dev/null || true
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Vite-era leftovers and duplicate (app) layout"
```

---

## Task 4: Button Component Restyle

**Files:**
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Update button variants**

Replace the `buttonVariants` definition in `src/components/ui/button.tsx`:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        outline:
          "border-2 border-primary text-primary bg-transparent hover:bg-primary/5",
        secondary:
          "bg-secondary text-white shadow-sm hover:bg-secondary/90 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        ghost:
          "text-foreground hover:bg-muted",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm:      "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg:      "h-10 px-6 has-[>svg]:px-4",
        icon:    "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
```

Key changes from current:
- Base class: `rounded-md` → `rounded-xl`
- Default variant: added `shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0`
- Destructive: added same hover lift
- Outline: `border` → `border-2 border-primary text-primary`, removed bg, added `hover:bg-primary/5`
- Secondary: `text-secondary-foreground` → `text-white`, added hover lift
- Ghost: `hover:bg-accent hover:text-accent-foreground` → `hover:bg-muted` (simpler)

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "style: restyle button variants — rounded-xl, hover lift, solid fills"
```

---

## Task 5: Hybrid Navigation — LandingNavbar + AppSidebar + AppTopBar

**Files:**
- Create: `src/components/LandingNavbar.tsx`
- Create: `src/components/AppSidebar.tsx`
- Create: `src/components/AppTopBar.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/landing/page.tsx`
- Modify: every app page route that currently renders inside the root layout

This is the largest structural change. The root layout becomes a bare shell. Landing page gets its own navbar. App pages get sidebar + top bar.

- [ ] **Step 1: Create LandingNavbar**

Create `src/components/LandingNavbar.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';

export function LandingNavbar() {
  const router = useRouter();

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-border/60 sticky top-0 z-50 dark:bg-card/90">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <button
          onClick={() => router.push('/landing')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Leaf className="h-7 w-7 text-primary" />
          <span className="text-xl font-display font-semibold text-primary">
            EnglishPrep
          </span>
        </button>

        <div className="flex items-center gap-3 ml-auto">
          <ThemeToggle />
          <Button
            variant="outline"
            onClick={() => router.push('/auth')}
            className="border-2 border-primary text-primary hover:bg-primary/5 font-semibold"
          >
            Đăng nhập
          </Button>
          <Button
            onClick={() => router.push('/auth?mode=register')}
            className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm"
          >
            Đăng ký
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create AppSidebar**

Create `src/components/AppSidebar.tsx`:

```tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  LayoutDashboard, FileText, BookOpen, Mic, TrendingUp,
  Newspaper, FilePlus, ClipboardList, ClipboardCheck, Users,
  Settings, LogOut, Leaf, PanelLeftClose,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { clearUser } from './store/currUserSlice';
import { AuthService, clearApiToken } from '@/lib/api-client';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, useSidebar,
} from './ui/sidebar';

const learnerLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/test-selection', label: 'Chọn đề thi', icon: FileText },
  { href: '/flashcards', label: 'Flashcards', icon: BookOpen },
  { href: '/speaking-writing', label: 'Speaking & Writing', icon: Mic },
  { href: '/progress', label: 'Tiến độ', icon: TrendingUp },
  { href: '/history', label: 'Lịch sử', icon: ClipboardList },
  { href: '/blog', label: 'Blog', icon: Newspaper },
];

const staffLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/exam-creation', label: 'Tạo đề thi', icon: FilePlus },
  { href: '/exam-management', label: 'Quản lý đề thi', icon: ClipboardList },
  { href: '/blog-management', label: 'Quản lý Blog', icon: Newspaper },
];

const headStaffExtra = [
  { href: '/exam-approval', label: 'Duyệt đề thi', icon: ClipboardCheck },
  { href: '/user-management', label: 'Quản lý User', icon: Users },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isStaff, isHeadStaff } = useAuth();
  const user = useAppSelector((state) => state.currUser.current);
  const dispatch = useAppDispatch();
  const { toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    try {
      await AuthService.authGatewayControllerLogoutAllV1();
    } catch {}
    clearApiToken();
    document.cookie = 'user_authenticated=; path=/; max-age=0';
    dispatch(clearUser());
    window.location.href = '/auth';
  };

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + '/');

  const navLinks = isStaff || isHeadStaff ? staffLinks : learnerLinks;
  const managementLinks = isHeadStaff ? headStaffExtra : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
          >
            <Leaf className="h-6 w-6 text-primary shrink-0" />
            <span className="text-lg font-display font-semibold text-primary group-data-[collapsible=icon]:hidden">
              EnglishPrep
            </span>
          </button>
          <button onClick={toggleSidebar} className="group-data-[collapsible=icon]:hidden">
            <PanelLeftClose className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isStaff || isHeadStaff ? 'QUẢN LÝ' : 'HỌC TẬP'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    onClick={() => router.push(link.href)}
                    isActive={isActive(link.href)}
                    tooltip={link.label}
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {managementLinks.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>QUẢN LÝ HỆ THỐNG</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementLinks.map((link) => (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        onClick={() => router.push(link.href)}
                        isActive={isActive(link.href)}
                        tooltip={link.label}
                      >
                        <link.icon className="h-5 w-5" />
                        <span>{link.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => router.push('/user')}
              tooltip="Cài đặt"
            >
              <Settings className="h-5 w-5" />
              <span>{user?.fullName ?? 'Cài đặt'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Đăng xuất"
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 3: Create AppTopBar**

Create `src/components/AppTopBar.tsx`:

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { SidebarTrigger } from './ui/sidebar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/test-selection': 'Chọn đề thi',
  '/flashcards': 'Flashcards',
  '/speaking-writing': 'Speaking & Writing',
  '/progress': 'Tiến độ học tập',
  '/history': 'Lịch sử làm bài',
  '/blog': 'Blog',
  '/exam-creation': 'Tạo đề thi',
  '/exam-management': 'Quản lý đề thi',
  '/blog-management': 'Quản lý Blog',
  '/exam-approval': 'Duyệt đề thi',
  '/user-management': 'Quản lý User',
  '/user': 'Thông tin cá nhân',
};

export function AppTopBar() {
  const pathname = usePathname();
  const title = pageTitles[pathname ?? ''] ?? '';

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create app page layout wrapper**

The root `layout.tsx` was already simplified in Task 2. Now we need a layout that wraps authenticated app pages with the sidebar. Create `src/app/(app)/layout.tsx`:

```tsx
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AppTopBar } from '@/components/AppTopBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopBar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 5: Move app page routes into the (app) route group**

All authenticated pages must be inside `src/app/(app)/` to get the sidebar layout. Move these page files:

```bash
mkdir -p src/app/\(app\)/dashboard
mkdir -p src/app/\(app\)/test-selection
mkdir -p src/app/\(app\)/test/\[id\]
mkdir -p src/app/\(app\)/test/do/\[id\]
mkdir -p src/app/\(app\)/results/\[id\]
mkdir -p src/app/\(app\)/flashcards/\[listId\]
mkdir -p src/app/\(app\)/history
mkdir -p src/app/\(app\)/progress
mkdir -p src/app/\(app\)/blog
mkdir -p src/app/\(app\)/speaking-writing
mkdir -p src/app/\(app\)/user
mkdir -p src/app/\(app\)/user-management
mkdir -p src/app/\(app\)/exam-creation
mkdir -p src/app/\(app\)/exam-management
mkdir -p src/app/\(app\)/blog-management
mkdir -p src/app/\(app\)/exam-approval

# Move each page.tsx into the (app) group
mv src/app/dashboard/page.tsx src/app/\(app\)/dashboard/page.tsx
mv src/app/test-selection/page.tsx src/app/\(app\)/test-selection/page.tsx
# ... (repeat for all app pages)
```

The `/landing`, `/auth`, and root `/` page stay in `src/app/` (outside the `(app)` group) — they don't get the sidebar.

- [ ] **Step 6: Update landing page to include LandingNavbar**

Modify `src/app/landing/page.tsx` to render the LandingNavbar:

```tsx
import { LandingNavbar } from '@/components/LandingNavbar';
import { LandingPage } from '@/components/LandingPage';

export default function Landing() {
  return (
    <>
      <LandingNavbar />
      <LandingPage />
    </>
  );
}
```

- [ ] **Step 7: Delete old MainNavbar**

```bash
rm src/components/MainNavbar.tsx
```

Remove any remaining imports of `MainNavbar` from other files.

- [ ] **Step 8: Build check**

Run: `npm run build`
Expected: Build succeeds. All routes render correctly — landing gets top nav, app pages get sidebar.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: hybrid navigation — landing top navbar, app sidebar with collapsible layout"
```

---

## Task 6: Landing Page Redesign

**Files:**
- Modify: `src/components/LandingPage.tsx`

- [ ] **Step 1: Rewrite LandingPage.tsx**

Replace the entire file with the anti-AI-slop design per spec. The new structure:

1. **Hero** — `bg-background`, strong heading, one subtitle, CTA + text link, single morph blob, no stats/illustration/blobs
2. **What You Get** — `bg-[#fff6dc]`, asymmetric bento grid (4-5 items, NOT icon grid)
3. **How It Works** — `bg-card`, three numbered steps left-aligned, typography-driven
4. **CTA** — `bg-primary`, solid green, white text, one heading + one button
5. **Footer** — `bg-foreground text-background`

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { ArrowRight, Mic, BookOpen, BarChart, Brain } from 'lucide-react';

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-24 md:py-32 lg:py-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 animate-blob-morph pointer-events-none" />
        <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
            Luyện Thi <span className="text-primary">IELTS & TOEIC</span>
            <br />
            Hiệu Quả Hơn Mỗi Ngày
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Hệ thống luyện thi tiếng Anh với AI chấm điểm tự động, luyện Speaking & Writing thông minh.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/auth?mode=register')}
              className="text-lg px-8 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-[var(--shadow-heavy)] hover:shadow-[0_8px_30px_hsl(144_46%_55%/0.4)] hover:-translate-y-1"
            >
              Bắt Đầu Miễn Phí
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-muted-foreground hover:text-primary transition-colors text-lg font-medium"
            >
              Tìm hiểu thêm ↓
            </button>
          </div>
        </div>
      </section>

      {/* What You Get — Bento Grid */}
      <section className="py-16 md:py-24 bg-[#fff6dc] dark:bg-card">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-2xl md:text-4xl font-bold text-primary mb-12">
            Bạn sẽ nhận được gì?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large card — spans 2 columns */}
            <div className="md:col-span-2 bg-card rounded-2xl p-8 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Luyện Speaking & Writing với AI</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI phân tích phát âm, ngữ pháp, từ vựng và đưa ra nhận xét chi tiết theo tiêu chuẩn IELTS. Luyện tập không giới hạn, nhận feedback tức thì.
              </p>
            </div>

            {/* Small card */}
            <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Đề thi chuẩn format</h3>
              <p className="text-muted-foreground leading-relaxed">
                IELTS Academic, TOEIC Listening & Reading với đề thi được biên soạn chất lượng.
              </p>
            </div>

            {/* Small card */}
            <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Theo dõi tiến độ</h3>
              <p className="text-muted-foreground leading-relaxed">
                Biểu đồ chi tiết, activity heatmap, phân tích điểm mạnh/yếu từng kỹ năng.
              </p>
            </div>

            {/* Large card — spans 2 columns */}
            <div className="md:col-span-2 bg-card rounded-2xl p-8 border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flashcards & Học từ vựng</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tạo bộ flashcard riêng, ôn tập với spaced repetition. Ghi nhớ từ vựng hiệu quả hơn gấp 3 lần so với phương pháp truyền thống.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-2xl md:text-4xl font-bold text-primary mb-16">
            Bắt đầu như thế nào?
          </h2>
          <div className="space-y-12">
            {[
              { num: '01', title: 'Đăng ký tài khoản miễn phí', desc: 'Chỉ cần email hoặc tài khoản Google, bắt đầu trong 30 giây.' },
              { num: '02', title: 'Chọn bài thi phù hợp', desc: 'IELTS Academic, TOEIC, hoặc bài thi luyện tập theo trình độ.' },
              { num: '03', title: 'Luyện tập & theo dõi tiến độ', desc: 'Làm bài, nhận feedback AI, xem tiến bộ qua biểu đồ chi tiết.' },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-6">
                <span className="text-4xl font-display font-bold text-primary/30 shrink-0 w-16">
                  {step.num}
                </span>
                <div className="border-t border-border pt-4 flex-1">
                  <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-8">
            Bắt Đầu Ngay Hôm Nay
          </h2>
          <Button
            size="lg"
            onClick={() => router.push('/auth?mode=register')}
            className="text-lg px-8 py-4 rounded-2xl bg-white text-primary font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Tạo Tài Khoản Miễn Phí
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-display font-semibold">EnglishPrep</span>
              </div>
              <p className="text-background/60 text-sm">
                Hệ thống luyện thi tiếng Anh với AI
              </p>
            </div>
            <div className="flex gap-12 text-sm text-background/60">
              <div className="space-y-2">
                <p className="text-background font-medium">Sản phẩm</p>
                <p>Luyện thi IELTS</p>
                <p>Luyện thi TOEIC</p>
                <p>AI Speaking</p>
              </div>
              <div className="space-y-2">
                <p className="text-background font-medium">Liên hệ</p>
                <p>support@englishprep.vn</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-background/10 text-center text-sm text-background/40">
            © 2026 EnglishPrep. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "style: redesign landing page — anti-slop, bento grid, no gradients"
```

---

## Task 7: Dashboard Redesign

**Files:**
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: Replace gradient hero with clean welcome header**

Find the gradient hero section (around line 144):
```
bg-gradient-to-r from-primary to-secondary
```
Replace with:
```
bg-primary text-primary-foreground
```

Remove all decorative blur blobs inside the hero (`absolute` divs with `blur-3xl`).

- [ ] **Step 2: Replace page background gradient**

Find line 142:
```
bg-gradient-to-br from-slate-50 via-primary/5 to-cyan-50
```
Replace with:
```
bg-background
```

- [ ] **Step 3: Fix stat cards — remove glassmorphism, use solid fills**

Find stat cards inside the hero (around lines 160-200). Replace:
```
bg-white/10 backdrop-blur-md
```
with:
```
bg-white/20 rounded-2xl
```

- [ ] **Step 4: Fix activity heatmap colors**

Replace the `getHeatmapColor` function (lines 132-139):

```tsx
const getHeatmapColor = (count: number, isFuture: boolean) => {
  if (isFuture) return 'bg-transparent border border-dashed border-muted';
  if (count === 0) return 'bg-muted';
  if (count === 1) return 'bg-primary/20';
  if (count >= 2 && count <= 3) return 'bg-primary/40';
  if (count >= 4 && count <= 5) return 'bg-primary/60';
  return 'bg-primary';
};
```

Also fix the legend swatches (around lines 271-276) to match.

- [ ] **Step 5: Replace exam card gradient top bar**

Find line 305:
```
bg-gradient-to-r from-primary/80 to-cyan-400
```
Replace with:
```
bg-primary
```

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "style: redesign dashboard — solid colors, semantic heatmap, no gradients"
```

---

## Task 8: Admin Dashboard Redesign

**Files:**
- Modify: `src/components/AdminDashboard.tsx`

- [ ] **Step 1: Replace all gradients with solid fills**

This file has 10+ gradient instances. Apply these replacements:

| Line | Current gradient | Replacement |
|---|---|---|
| ~42 | `bg-gradient-to-br from-slate-50 to-primary/10` | `bg-background` |
| ~75 | `bg-gradient-to-br from-slate-50 via-primary/10 to-primary/10` | `bg-background` |
| ~77-80 | `bg-gradient-to-r from-primary to-primary/80` | `bg-primary` |
| ~79 | `bg-gradient-to-r from-primary/80 via-cyan-500 to-teal-500` | `bg-primary` |
| ~113 | `bg-gradient-to-r from-orange-400 to-amber-400` | `bg-secondary` |
| ~127 | `bg-gradient-to-r from-emerald-400 to-green-500` | `bg-primary` |
| ~141 | `bg-gradient-to-r from-red-400 to-rose-500` | `bg-destructive` |
| ~155 | `bg-gradient-to-r from-primary to-primary` | `bg-primary` |
| ~185 | `bg-gradient-to-r from-emerald-400 to-teal-500` | `bg-primary` |
| ~213 | `bg-gradient-to-r from-primary to-cyan-500` | `bg-primary` |
| ~309 | `bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400` | `bg-secondary` |

- [ ] **Step 2: Build check**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/AdminDashboard.tsx
git commit -m "style: admin dashboard — replace all gradients with solid fills"
```

---

## Task 9: Gradient Sweep — Auth, Test Selection, Test Detail, Test Result

**Files:**
- Modify: `src/components/AuthForm.tsx`
- Modify: `src/components/TestSelection.tsx`
- Modify: `src/components/TestDetail.tsx`
- Modify: `src/components/TestResult.tsx`

- [ ] **Step 1: AuthForm.tsx — replace 5 gradient instances**

```bash
# Find all gradients:
grep -n "gradient" src/components/AuthForm.tsx
```

Apply replacements:
- L291 page bg: `bg-gradient-to-br from-slate-50 via-primary/5 to-cyan-50` → `bg-background`
- L319 circle: `bg-gradient-to-br from-primary to-primary/80` → `bg-primary`
- L357 top bar: `bg-gradient-to-r from-primary to-secondary` → `bg-primary`
- L363 logo box: `bg-gradient-to-br from-primary to-primary` → `bg-primary`
- L367 gradient text: `bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent` → `text-primary` (remove bg-clip-text and text-transparent)

- [ ] **Step 2: TestSelection.tsx — replace gradients**

```bash
grep -n "gradient" src/components/TestSelection.tsx
```

Replace each gradient with the appropriate solid fill following the same pattern.

- [ ] **Step 3: TestDetail.tsx — replace 6 gradient instances**

Key replacements:
- L318 header overlay: `bg-gradient-to-r from-primary to-primary/80` → `bg-primary`
- L426 amber card: `bg-gradient-to-r from-amber-50 to-orange-50` → `bg-[#fff6dc]`
- L541 progress bar: `bg-gradient-to-r from-teal-400 to-emerald-500` → `bg-primary`
- L574 card bg: `bg-gradient-to-br from-primary/10 via-white to-primary/5` → `bg-card`
- L576 top bar: `bg-gradient-to-r from-primary to-primary/80` → `bg-primary`
- L665, L827 number circles: `bg-gradient-to-br from-primary/20 to-primary/10` → `bg-primary/15`

- [ ] **Step 4: TestResult.tsx — replace gradients**

- L123 header: `bg-gradient-to-r from-primary to-primary/80` → `bg-primary`
- L152 subtle overlay: `bg-gradient-to-br from-white/5 to-transparent` → remove entirely or replace with `bg-white/5`

- [ ] **Step 5: Build check**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/components/AuthForm.tsx src/components/TestSelection.tsx src/components/TestDetail.tsx src/components/TestResult.tsx
git commit -m "style: gradient sweep batch 1 — auth, test selection, test detail, test result"
```

---

## Task 10: Gradient Sweep — Flashcards, Blog, Blog Management

**Files:**
- Modify: `src/components/FlashcardPage.tsx`
- Modify: `src/components/FlashcardListDetail.tsx`
- Modify: `src/components/BlogPage.tsx`
- Modify: `src/components/BlogManagementPage.tsx`

- [ ] **Step 1: FlashcardPage.tsx — replace 4 gradient instances**

- L70 top bar: `bg-gradient-to-r from-primary to-primary` → `bg-primary`
- L192 overlay: `bg-gradient-to-r from-primary to-primary/80` → `bg-primary`
- L227 circle: `bg-gradient-to-br from-primary/10 to-primary/10` → `bg-primary/10`
- L265 icon box: `bg-gradient-to-br from-primary/10 to-primary/10` → `bg-primary/10`

- [ ] **Step 2: FlashcardListDetail.tsx — replace 3 gradient instances**

- L57 flipped card: `bg-gradient-to-br from-primary to-primary/80` → `bg-primary`
- L178 top bar: `bg-gradient-to-r from-primary to-primary/80` → `bg-primary`
- L377 overlay: `bg-gradient-to-br from-primary/5 via-primary/10 to-transparent` → `bg-primary/5`

- [ ] **Step 3: BlogPage.tsx — replace 5 gradient instances**

- L66 top bar: `bg-gradient-to-r from-primary to-primary/80` → `bg-primary`
- L170 header bg: `bg-gradient-to-b from-primary/90 to-primary` → `bg-primary`
- L302 page bg: `bg-gradient-to-br from-slate-50 via-primary/10 to-accent/10` → `bg-background`
- L304 hero: `bg-gradient-to-r from-primary via-primary/80 to-secondary` → `bg-primary`
- L322 blur behind button: `bg-gradient-to-r from-primary to-primary/80 rounded-full blur-md` → remove the blur div entirely
- L344 card top bar: `bg-gradient-to-r from-primary to-primary/80` → `bg-primary`

- [ ] **Step 4: BlogManagementPage.tsx — replace 4 gradient instances**

- L66 unauthorized bg: `bg-gradient-to-br from-slate-50 to-secondary/10` → `bg-background`
- L134 page bg: `bg-gradient-to-br from-slate-50 via-secondary/10 to-secondary/5` → `bg-background`
- L137 hero: `bg-gradient-to-r from-secondary to-secondary/80` → `bg-secondary`
- L206 button: `bg-gradient-to-r from-secondary to-secondary/80` → `bg-secondary`

- [ ] **Step 5: Build check**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/components/FlashcardPage.tsx src/components/FlashcardListDetail.tsx src/components/BlogPage.tsx src/components/BlogManagementPage.tsx
git commit -m "style: gradient sweep batch 2 — flashcards, blog pages"
```

---

## Task 11: Gradient Sweep — Speaking, Exam Management, User Management, Test Interface

**Files:**
- Modify: `src/components/SpeakingWritingPage.tsx`
- Modify: `src/components/SpeakingTest.tsx`
- Modify: `src/components/ExamApprovalPage.tsx`
- Modify: `src/components/ExamManagementPage.tsx`
- Modify: `src/components/UserManagementPage.tsx`
- Modify: `src/components/TestInterface.tsx`

- [ ] **Step 1: SpeakingWritingPage.tsx**

- L11 page bg: `bg-gradient-to-br from-slate-50 via-primary/10 to-cyan-50` → `bg-background`
- L13 hero: `bg-gradient-to-r from-primary to-primary/80` → `bg-primary`

- [ ] **Step 2: SpeakingTest.tsx**

- L145 top bar: `bg-gradient-to-r from-primary to-primary/80` → `bg-primary`

- [ ] **Step 3: ExamApprovalPage.tsx — 3 instances**

- L114 unauthorized bg: `bg-gradient-to-br from-slate-50 to-secondary/10` → `bg-background`
- L205 page bg: `bg-gradient-to-br from-slate-50 via-primary/10 to-cyan-50` → `bg-background`
- L207 hero: `bg-gradient-to-r from-primary via-cyan-600 to-teal-600` → `bg-primary`

- [ ] **Step 4: ExamManagementPage.tsx**

```bash
grep -n "gradient" src/components/ExamManagementPage.tsx
```
Replace all gradient instances with solid fills.

- [ ] **Step 5: UserManagementPage.tsx**

- L209 page bg: `bg-gradient-to-br from-slate-50 via-primary/10 to-accent/10` → `bg-background`
- L211 hero: `bg-gradient-to-r from-primary via-accent to-accent/80` → `bg-primary`

- [ ] **Step 6: TestInterface.tsx — 6 instances**

- L693, L743, L757 active question pill: `bg-gradient-to-br from-primary to-primary/80` → `bg-primary`
- L806 header bg: `bg-gradient-to-b from-primary/5 to-white` → `bg-muted/30`
- L825 submit button: `bg-gradient-to-r from-primary to-primary/80` + hover gradients → `bg-primary hover:bg-primary/90`
- L872 active page indicator: `bg-gradient-to-br from-primary to-primary/80` → `bg-primary`

- [ ] **Step 7: Build check**

Run: `npm run build`

- [ ] **Step 8: Commit**

```bash
git add src/components/SpeakingWritingPage.tsx src/components/SpeakingTest.tsx src/components/ExamApprovalPage.tsx src/components/ExamManagementPage.tsx src/components/UserManagementPage.tsx src/components/TestInterface.tsx
git commit -m "style: gradient sweep batch 3 — speaking, exam, user management, test interface"
```

---

## Task 12: Gradient Sweep — Remaining Files

**Files:**
- Modify: `src/components/ExamCreationPage.tsx`
- Modify: `src/components/ResultsView.tsx`
- Modify: `src/components/UserPage.tsx`
- Modify: `src/components/SpeakingSession.tsx`
- Modify: `src/components/SpeakingResults.tsx`
- Modify: `src/components/WritingTest.tsx`

- [ ] **Step 1: Find and replace all gradients in remaining files**

For each file:
```bash
grep -n "gradient" src/components/ExamCreationPage.tsx
grep -n "gradient" src/components/ResultsView.tsx
grep -n "gradient" src/components/UserPage.tsx
grep -n "gradient" src/components/SpeakingSession.tsx
grep -n "gradient" src/components/SpeakingResults.tsx
grep -n "gradient" src/components/WritingTest.tsx
```

Apply the standard replacement rules:
- `bg-gradient-to-br from-slate-50 via-…` (page bg) → `bg-background`
- `bg-gradient-to-r from-primary to-…` (hero/header) → `bg-primary`
- `bg-gradient-to-br from-primary/N to-…` (card bg) → `bg-primary/N` or `bg-card`
- `bg-gradient-to-r from-color to-color/80` (top bars) → `bg-color`
- Gradient text (`bg-clip-text text-transparent`) → `text-primary`

- [ ] **Step 2: Verify zero gradients remain**

```bash
grep -rn "gradient" src/components/ --include="*.tsx" | grep -v node_modules
```

Expected: zero results.

- [ ] **Step 3: Build check**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/ExamCreationPage.tsx src/components/ResultsView.tsx src/components/UserPage.tsx src/components/SpeakingSession.tsx src/components/SpeakingResults.tsx src/components/WritingTest.tsx
git commit -m "style: gradient sweep batch 4 — remaining files, zero gradients achieved"
```

---

## Task 13: Floating Leaves Component

**Files:**
- Create: `src/components/FloatingLeaves.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create FloatingLeaves component**

Create `src/components/FloatingLeaves.tsx`:

```tsx
'use client';

import { useMemo } from 'react';

interface FloatingLeavesProps {
  count?: number;
  opacity?: number;
}

export function FloatingLeaves({ count = 8, opacity = 0.25 }: FloatingLeavesProps) {
  const leaves = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const hue = 90 + Math.random() * 65;
      const sat = 40 + Math.random() * 20;
      const lit = 50 + Math.random() * 15;
      const size = 12 + Math.random() * 10;
      const left = Math.random() * 100;
      const delay = Math.random() * 18;
      const duration = 14 + Math.random() * 8;

      return { id: i, hue, sat, lit, size, left, delay, duration };
    });
  }, [count]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1, opacity }}
    >
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute animate-leaf-drift"
          style={{
            left: `${leaf.left}%`,
            top: '-20px',
            width: `${leaf.size}px`,
            height: `${leaf.size * 0.6}px`,
            backgroundColor: `hsl(${leaf.hue} ${leaf.sat}% ${leaf.lit}%)`,
            borderRadius: '0 80% 0 80%',
            animationDelay: `${leaf.delay}s`,
            ['--leaf-duration' as string]: `${leaf.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add FloatingLeaves to root layout**

In `src/app/layout.tsx`, add after the `<ThemeProvider>` opening:

```tsx
import { FloatingLeaves } from '@/components/FloatingLeaves';

// Inside the return, after <ThemeProvider>:
<FloatingLeaves count={8} opacity={0.2} />
```

- [ ] **Step 3: Build check**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/FloatingLeaves.tsx src/app/layout.tsx
git commit -m "feat: add subtle floating leaves particle effect"
```

---

## Task 14: Final Integration & Verification

**Files:**
- Verify: all modified files

- [ ] **Step 1: Full gradient audit**

```bash
grep -rn "gradient" src/ --include="*.tsx" --include="*.ts" --include="*.css" | grep -v node_modules | grep -v ".next"
```

Expected: zero results across the entire `src/` directory.

- [ ] **Step 2: Full build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Verify deleted files are gone**

```bash
test -f src/contexts/ThemeContext.tsx && echo "FAIL: ThemeContext exists" || echo "OK"
test -f src/components/theme/ThemeSwitcher.tsx && echo "FAIL: ThemeSwitcher exists" || echo "OK"
test -f src/components/MainNavbar.tsx && echo "FAIL: MainNavbar exists" || echo "OK"
test -f src/styles/globals.css && echo "FAIL: styles/globals.css exists" || echo "OK"
test -f src/App.tsx && echo "FAIL: App.tsx exists" || echo "OK"
test -f src/main.tsx && echo "FAIL: main.tsx exists" || echo "OK"
```

Expected: All "OK".

- [ ] **Step 4: Verify new files exist**

```bash
test -f src/components/AppSidebar.tsx && echo "OK" || echo "FAIL"
test -f src/components/AppTopBar.tsx && echo "OK" || echo "FAIL"
test -f src/components/ThemeToggle.tsx && echo "OK" || echo "FAIL"
test -f src/components/FloatingLeaves.tsx && echo "OK" || echo "FAIL"
test -f src/components/LandingNavbar.tsx && echo "OK" || echo "FAIL"
```

Expected: All "OK".

- [ ] **Step 5: Final commit if any loose changes**

```bash
git status
# If any uncommitted changes:
git add -A
git commit -m "style: Spring Garden redesign — final integration cleanup"
```
