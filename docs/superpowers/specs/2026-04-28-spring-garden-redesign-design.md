# Spring Garden Redesign — english-prep

Full visual and structural redesign of the english-prep website. Organic nature aesthetic inspired by engapp-v2, with zero gradients and intentional anti-AI-slop design choices.

## Design Principles

1. **No gradients anywhere** — all depth via solid colors, shadows, and opacity layers
2. **No AI slop** — no icon spam, no generic feature grids, no decorative filler, no animated counters
3. **Organic nature spirit** — engapp-v2's warmth and growth metaphor, expressed through color, subtle particles, and natural shapes
4. **Typography-driven** — strong heading hierarchy as primary visual element, not decoration
5. **Purposeful simplicity** — every element earns its place

## Scope

- **Full redesign**: visual identity, layout structure, component design, navigation architecture
- **All ~20 pages** remain — same page set, redesigned presentation
- **Two themes**: Light + Dark only (drop 3-variant theme system)
- **Navigation change**: hybrid — top navbar on landing page, collapsible sidebar on app pages

---

## 1. Color System

### Light Theme

| Token | HSL | Purpose |
|---|---|---|
| `--background` | `144 100% 96%` | Page bg — pale mint |
| `--foreground` | `222.2 84% 4.9%` | Body text — near-black |
| `--card` | `0 0% 100%` | Card surfaces — white |
| `--card-foreground` | `222.2 84% 4.9%` | Card text |
| `--primary` | `144 46% 55%` | Brand green |
| `--primary-foreground` | `0 0% 100%` | Text on primary |
| `--secondary` | `32 87% 61%` | Warm amber |
| `--secondary-foreground` | `222.2 84% 4.9%` | Text on secondary |
| `--accent` | `46 92% 71%` | Golden yellow |
| `--accent-foreground` | `222.2 84% 4.9%` | Text on accent |
| `--muted` | `144 30% 92%` | Muted green-gray |
| `--muted-foreground` | `215.4 16.3% 46.9%` | Secondary text |
| `--destructive` | `0 84.2% 60.2%` | Error red |
| `--border` | `214.3 31.8% 91.4%` | Subtle borders |
| `--ring` | `144 46% 55%` | Focus ring = primary |
| `--radius` | `1rem` | 16px base corner radius |

Hardcoded warm surface: `#fff6dc` (butter cream for feature sections).

Additional shadcn tokens (derived from the above):

| Token | Value |
|---|---|
| `--popover` | same as `--card` |
| `--popover-foreground` | same as `--card-foreground` |
| `--input` | same as `--border` |
| `--sidebar-background` | same as `--card` |
| `--sidebar-foreground` | same as `--foreground` |
| `--sidebar-primary` | same as `--primary` |
| `--sidebar-accent` | same as `--muted` |
| `--sidebar-border` | same as `--border` |
| `--chart-1` through `--chart-5` | derived from primary/secondary/accent at varied saturations |

### Dark Theme

| Token | HSL | Purpose |
|---|---|---|
| `--background` | `220 20% 10%` | Deep charcoal |
| `--foreground` | `0 0% 98%` | Near-white text |
| `--card` | `220 20% 14%` | Lighter charcoal |
| `--primary` | `144 50% 50%` | Softer green (stays green, not lime) |
| `--secondary` | `32 80% 55%` | Muted amber |
| `--accent` | `46 85% 65%` | Toned-down gold |
| `--muted` | `220 15% 18%` | Dark muted surface |

Dark mode primary stays green (not lime shift like before) to maintain nature identity.

Dark mode warm surface: `#fff6dc` sections become `hsl(220 15% 14%)` (matches `--card` in dark). The butter cream loses meaning on dark backgrounds — sections that use warm-surface in light mode simply become card-colored in dark mode.

### Shadow System

| Token | Value |
|---|---|
| `--shadow-soft` | `0 4px 20px hsl(144 46% 55% / 0.06)` |
| `--shadow-medium` | `0 8px 30px hsl(144 46% 55% / 0.12)` |
| `--shadow-heavy` | `0 8px 30px hsl(144 46% 55% / 0.24)` |

Green-tinted shadows for the nature feel.

---

## 2. Typography

### Font Stack

| Role | Font | Usage |
|---|---|---|
| Headings | `Momo Trust Display` | All h1-h6, hero text, section titles |
| Body | `Google Sans Flex` | Paragraphs, labels, nav, UI text |
| Display | `Monda` (local OTF) | Logo, stat numbers, special callouts |

### Scale

| Element | Size | Weight | Color |
|---|---|---|---|
| Hero h1 | `text-3xl → text-5xl` | bold | foreground, keywords in `text-primary` |
| Section h2 | `text-2xl → text-4xl` | bold | `text-primary` |
| Card h3 | `text-xl → text-2xl` | semibold | foreground |
| Subtitle | `text-lg → text-xl` | normal | `text-muted-foreground` |
| Body | `text-base` | normal | foreground, `leading-relaxed` |
| Caption | `text-sm` | normal | `text-muted-foreground` |
| Stat number | `text-3xl` font-display | bold | `text-primary` |

No gradient text. Use `text-primary` or `text-secondary` for emphasis words.

---

## 3. Navigation

### Landing Page — Top Navbar

- `bg-white/90 backdrop-blur-md border-b border-border/60 sticky top-0 z-50`
- Height: `h-16`
- Logo: Monda font + leaf icon, `text-primary`
- Links: clean text, `hover:text-primary`, active = `border-b-2 border-primary`
- Right side: theme toggle (sun/moon) + login button (`bg-primary text-white rounded-xl`)
- Mobile: hamburger → Sheet drawer from right
- Scroll: shadow appears (`shadow-sm`)

### App Pages — Collapsible Sidebar

- Width: `w-64` expanded, `w-16` collapsed (icon-only)
- Style: `bg-card border-r border-border` — solid, no transparency
- Sections grouped by role with Vietnamese headers (HỌC TẬP, QUẢN LÝ)
- Active link: `bg-primary/10 text-primary border-r-2 border-primary`
- Hover: `bg-muted`
- Icons: Lucide, `h-5 w-5` — used functionally, not decoratively
- Top: logo + collapse toggle
- Bottom: settings + logout
- Role-based: staff/head-staff see QUẢN LÝ; learners see HỌC TẬP only
- Mobile: Sheet slide from left
- Top bar: thin `h-14` with page title, theme toggle, user avatar

Foundation: shadcn/ui `sidebar` component (already installed).

---

## 4. Component System

### Cards

**Standard:** `bg-card rounded-2xl border border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] hover:-translate-y-1 transition-all duration-300 p-6`

**Stat (dashboard):** `bg-primary text-primary-foreground rounded-2xl p-5 shadow-[var(--shadow-heavy)]` — solid green fill

**Warm:** `bg-[#fff6dc] rounded-2xl p-6 border border-amber-200/50` — butter cream

### Buttons

All solid fills. No gradients.

| Variant | Style |
|---|---|
| Primary | `bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md` |
| Secondary | `bg-secondary text-white rounded-xl hover:bg-secondary/90` |
| Outline | `border-2 border-primary text-primary bg-transparent rounded-xl hover:bg-primary/5` |
| Ghost | `text-foreground hover:bg-muted rounded-xl` |
| Destructive | `bg-destructive text-white rounded-xl hover:bg-destructive/90` |
| CTA | `bg-primary text-white rounded-2xl px-8 py-4 text-lg font-bold shadow-[var(--shadow-heavy)] hover:shadow-[0_8px_30px_hsl(144_46%_55%/0.4)] hover:-translate-y-1` |

### Inputs

`bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30 focus:border-primary`

### Badges

Default: `bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium`

### Icon Containers

`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary`

### Tables

`rounded-xl border border-border overflow-hidden`, header: `bg-muted/50`, hover row: `bg-muted/30`

### Dialogs

`bg-card rounded-2xl shadow-2xl border border-border/50`, backdrop: `bg-black/40 backdrop-blur-sm`

---

## 5. Page Layouts

### Landing Page

**Hero** — `bg-background`
- Strong heading (Momo Trust Display, `text-3xl → text-5xl`)
- One subtitle sentence
- Primary CTA + text link
- Single organic blob (`bg-primary/5`, morph animation, 5% opacity)
- Floating leaves (8-10 particles)
- NO stats counter, NO stock illustration, NO decorative blobs

**What You Get** — `bg-[#fff6dc]`
- Asymmetric bento-style grid (NOT 3-column icon grid)
- 4-5 items, different sizes based on content importance
- Icons only where they add meaning
- Each card has unique sizing

**How It Works** — `bg-card`
- Three numbered steps, left-aligned
- `01 ── Title` format with horizontal rule
- Typography-driven, no illustrations or arrows
- One description line each

**CTA** — `bg-primary`
- Solid green, white text
- One heading + one button
- No dot-grid, no blobs, no decoration

**Footer** — `bg-foreground text-background`
- Logo, links, contact — minimal

### Dashboard (Learner)

- Sidebar + thin top bar
- Welcome header (no gradient hero)
- 4 stat cards: solid `bg-primary` or `bg-card`
- 2-column: activity heatmap + quick actions
- Heatmap uses `--primary` with opacity steps (not hardcoded)
- Recommended exams below (max 3 cards)

### Admin Dashboard

- Same sidebar layout
- Exam status summary cards
- Quick links to Create/Manage/Approve
- Clean table for recent activity

### All App Pages

- Sidebar navigation (consistent)
- Thin top bar with page title
- Content: `max-w-6xl mx-auto` container
- Consistent card styling across pages
- Clean tables for list views

---

## 6. Animations & Effects

### Floating Particles

- **Type:** Leaves only
- **Count:** 10 (landing), 5 (app pages)
- **Opacity:** 0.25 (landing), 0.15 (app), 0.35 (dark mode)
- **Colors:** `hsl(90-155, 40-60%, 50-65%)` — natural green variation
- **Animation:** diagonal drift with tumbling, 14-22s infinite
- **Layer:** fixed, `z-index: 1`, `pointer-events-none`

### Hover States

| Element | Effect |
|---|---|
| Cards | `-translate-y-1 shadow-lg` (300ms) |
| Buttons | `-translate-y-0.5 shadow-md` (200ms) |
| Nav links | `text-primary` color transition |
| Sidebar links | `bg-muted` background |
| Table rows | `bg-muted/30` |

### Page Entrance

CSS-only `fadeInUp`: `opacity 0 → 1`, `translateY(20px → 0)`, 0.5s.
Staggered delays: 100ms, 200ms, 300ms on main content sections.
Initial page load only, not scroll-triggered.

### Hero Blob

Single decorative shape, landing page only:
- `bg-primary/5` (5% opacity)
- Organic border-radius morph, 12s infinite
- 400px × 400px, absolutely positioned
- No blobs on app pages

### Not Included

- No scroll-triggered IntersectionObserver animations
- No parallax effects
- No animated counters
- No multi-blob backgrounds
- No backdrop-blur as design crutch
- No animated/spinning icons

---

## 7. Theme Architecture

### Implementation

- `next-themes` with `attribute="class"` for dark mode
- Remove `data-app-theme` system (no more 3 variants)
- Remove `ThemeSwitcher` component (palette dropdown)
- Replace with simple sun/moon toggle in navbar/top bar
- Remove `ThemeContext.tsx` — `next-themes` handles everything
- CSS custom properties in `:root` (light) and `.dark` (dark)

### What Gets Removed

- `src/contexts/ThemeContext.tsx` — no longer needed
- `src/components/theme/ThemeSwitcher.tsx` — replace with simple toggle
- `mint-productivity` and `forest-focus` theme blocks from globals.css
- `data-app-theme` attribute handling
- `localStorage` key `englishprep.theme`

---

## 8. Cleanup

### Leftover Files to Remove

- `src/styles/globals.css` (Vite-era duplicate)
- `src/App.tsx` (Vite-era leftover)
- `src/main.tsx` (Vite-era leftover)
- `src/app/(app)/layout.tsx` (duplicate layout, potential double-navbar)

### Hardcoded Colors to Fix

- Activity heatmap: replace `#c6e48b/#7bc96f/#239a3b/#196127` with `--primary` opacity scale
- Footer: replace `bg-gray-900` with `bg-foreground`
- Feature sections: keep `#fff6dc` but document it as `warm-surface`
- Any remaining blue/purple hardcoded values from pre-migration

### Architecture Notes

- Button.tsx (shadcn) appears empty — needs regeneration with spec styles
- ProgressTracker uses mock data — visual redesign only, data connection is separate work
- Dual service directories remain — not in scope for visual redesign
