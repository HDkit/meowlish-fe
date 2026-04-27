# Restyle english-prep to Match engapp-v2 Visual Identity

**Date:** 2026-04-28  
**Status:** Approved  
**Approach:** CSS Variable Swap + Theme Context (Approach 1)

## Summary

Align english-prep's frontend styles and themes with engapp-v2's nature-inspired, warm/organic aesthetic. Both projects share the same component foundation (shadcn/ui + Tailwind CSS + Radix UI), so the changes are primarily in CSS variables, fonts, a new theme system, and a hardcoded color sweep across 35 component files.

**Scope includes:** color palette, 3-theme switcher, fonts, custom shadows, border radius, landing page restyling, navbar frosted glass, and animations.  
**Scope excludes:** floating particle effects (user opted out), bilingual support.

---

## 1. CSS Variable Color Palette

Replace the `:root` block in `src/app/globals.css`. english-prep currently uses hex values with `@theme inline` (Tailwind CSS v4 style). engapp-v2 uses HSL values with `hsl()` wrappers in Tailwind config. To match engapp-v2 and maintain shadcn/ui convention, convert english-prep's CSS variables to HSL format and update the `@theme inline` block to use `hsl()` wrappers.

### Default Theme (`:root`)

```css
:root {
  --font-size: 16px;
  --background: 144 100% 96%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 144 46% 55%;
  --primary-foreground: 0 0% 100%;
  --secondary: 32 87% 61%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 144 30% 92%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 46 92% 71%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 144 46% 55%;
  --radius: 1rem;
  --shadow-soft: 0 4px 20px hsl(220 15% 15% / 0.08);
  --shadow-medium: 0 8px 30px hsl(220 15% 15% / 0.12);
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --switch-background: hsl(144 20% 80%);
  --input-background: hsl(144 100% 96%);
  /* Chart colors - nature palette */
  --chart-1: 144 46% 55%;
  --chart-2: 32 87% 61%;
  --chart-3: 46 92% 71%;
  --chart-4: 170 77% 27%;
  --chart-5: 16 88% 64%;
  /* Sidebar */
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 144 46% 55%;
}
```

### `@theme inline` Update

Update the `@theme inline` block to wrap CSS variables with `hsl()`. All tokens listed below:

```css
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: hsl(var(--ring));
  --color-chart-1: hsl(var(--chart-1));
  --color-chart-2: hsl(var(--chart-2));
  --color-chart-3: hsl(var(--chart-3));
  --color-chart-4: hsl(var(--chart-4));
  --color-chart-5: hsl(var(--chart-5));
  --border-radius-lg: var(--radius);
  --border-radius-md: calc(var(--radius) - 2px);
  --border-radius-sm: calc(var(--radius) - 4px);
}
```

Note: `--input-background` and `--switch-background` store pre-wrapped `hsl()` values (they include the `hsl()` call in `:root`), so the `@theme inline` mapping passes them through directly with `var()` instead of wrapping again.

---

## 2. Multi-Theme System

### 2a. Additional CSS Theme Blocks

Add to `globals.css` after `:root`:

**Mint Productivity** (`data-app-theme="mint-productivity"`):
- Background: `150 55% 96%` (crisper mint)
- Primary: `170 77% 27%` (deep teal)
- Secondary: `43 93% 58%` (golden yellow)
- Accent: `158 60% 43%` (teal-green)
- Sidebar tinted mint

**Forest Focus** (`data-app-theme="forest-focus"`):
- Background: `142 28% 95%` (pale forest)
- Primary: `146 45% 31%` (dark forest green)
- Secondary: `16 88% 64%` (coral/salmon)
- Accent: `16 88% 64%` (coral)
- Sidebar tinted forest

**Dark Mode** (`.dark` class):
- Background: `220 20% 10%` (dark navy)
- Primary: `84 86% 48%` (lime green)
- Secondary: `230 62% 61%` (periwinkle blue)
- Accent: `56 100% 81%` (pale yellow)

Full HSL values for all tokens in each theme are sourced directly from engapp-v2's `index.css` (lines 97-261).

### 2b. ThemeContext (`src/contexts/ThemeContext.tsx`)

Adapted from engapp-v2. Key elements:
- `ThemeKey` type: `"default" | "mint" | "forest"`
- `ThemeConfig` with `key`, `name`, `subtitle`, `attributeValue`, `swatchClass`
- `ThemeProvider` component that sets `data-app-theme` attribute on `document.documentElement`
- Persists to localStorage under `"englishprep.theme"` key
- `useTheme()` hook for consumer components
- No `LanguageContext` dependency (unlike engapp-v2's version)

### 2c. ThemeSwitcher (`src/components/theme/ThemeSwitcher.tsx`)

Adapted from engapp-v2. A dropdown menu (shadcn `DropdownMenu`) with:
- Palette icon trigger button
- Gradient swatch circles (color-coded per theme)
- Active theme ring indicator
- Theme name and subtitle per option

Swatch gradients:
- Default: `from-[#56c271] to-[#f2c94c]`
- Mint: `from-[#0f766e] to-[#34d399]`
- Forest: `from-[#1f5136] to-[#ff8b6a]`

### 2d. Integration

- Wrap app in `<ThemeProvider>` in `src/app/layout.tsx` (inside existing providers, alongside `next-themes` ThemeProvider)
- Add `<ThemeSwitcher>` to `MainNavbar` component (right side, near user menu)

**Interaction between next-themes and ThemeContext:** These are orthogonal systems. `next-themes` controls dark/light mode (via the `.dark` class). `ThemeContext` controls the app theme (Default/Mint/Forest) via the `data-app-theme` attribute. They compose naturally — a user can be in "Forest Focus" theme with dark mode enabled. The CSS cascade handles this: `data-app-theme` overrides `:root` for theme colors, and `.dark` overrides both for dark mode colors.

---

## 3. Fonts

### 3a. Font Files

Copy `/home/culove/engapp-v2/Frontend/public/fonts/monda.otf` to `/home/culove/english-prep/public/fonts/monda.otf`.

### 3b. CSS `@font-face`

Add to `globals.css`:

```css
@font-face {
  font-family: 'Monda';
  src: url('/fonts/monda.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

### 3c. Tailwind Config

Add `fontFamily` to `tailwind.config.ts`:

```ts
fontFamily: {
  heading: ['Momo Trust Display', 'sans-serif'],
  body: ['Google Sans Flex', 'sans-serif'],
},
```

Note: "Momo Trust Display" and "Google Sans Flex" are not bundled — they fall back to `sans-serif` unless installed on the user's system. This matches engapp-v2's behavior.

### 3d. Global Base Styles

In `@layer base`:

```css
body { @apply bg-background text-foreground font-body; }
h1, h2, h3, h4, h5, h6 { @apply font-heading; }
```

Remove the inline `font-family` declaration on `body` (line 129-130 of current globals.css).

---

## 4. Hardcoded Color Sweep

35 files contain hardcoded blue/purple/indigo Tailwind classes. Remap as follows:

### Color Mapping

| Old Pattern | New Replacement | Rationale |
|---|---|---|
| `text-blue-600` | `text-primary` | Semantic — respects theme |
| `bg-blue-600` | `bg-primary` | Semantic |
| `hover:bg-blue-700` | `hover:bg-primary/90` | Semantic with opacity |
| `text-indigo-600` | `text-primary` | Merge indigo into primary |
| `text-purple-600` | `text-secondary` | Purple was secondary |
| `bg-purple-600` | `bg-secondary` | Semantic |
| `from-blue-600 via-indigo-600 to-purple-600` | `from-primary to-primary/80` | Simplified green gradient |
| `from-blue-600 to-purple-600` (gradient text) | `from-primary to-secondary` | Nature gradient |
| `bg-blue-50` / `bg-blue-100` | `bg-primary/10` / `bg-primary/15` | Semantic light tints |
| `text-blue-500` | `text-primary/80` | Lighter semantic |
| `border-blue-*` | `border-primary` | Semantic |
| `ring-blue-*` | `ring-primary` | Semantic |
| `pink-600` | `text-secondary` | Remap to amber family |

### Files to Sweep (35 files)

All files in `src/components/` plus `src/lib/store/StoreProvider.tsx` and `src/components/ui/tabs.tsx`, `src/components/ui/toast.tsx`.

Priority order:
1. `LandingPage.tsx` — most visible, most hardcoded colors
2. `MainNavbar.tsx` — navigation, highly visible
3. `Dashboard.tsx` — user's main view
4. `AuthForm.tsx` — login/register flow
5. All remaining component files

---

## 5. Landing Page Restyling

### 5a. Hero Section

- Replace `from-blue-600 via-indigo-600 to-purple-600` gradient banner with `from-primary to-primary/80`
- Replace animated gradient blobs (`animate-blob`) with simpler organic shapes using the new green/amber palette
- Update CTA buttons from blue/purple gradient to green primary + amber secondary

### 5b. Section Backgrounds

Add warm cream backgrounds to alternating sections:

```css
/* Warm cream section background */
style={{ backgroundColor: '#fff6dc' }}
```

Or via a CSS class: `bg-[#fff6dc]`

Apply to: Features, How It Works, and similar sections (matching engapp-v2's pattern).

### 5c. Feature Cards

- Replace colored icon backgrounds (currently blue/purple/teal/amber mix) with nature-palette greens and ambers
- Update gradient text from `from-blue-600 to-purple-600` to `from-primary to-secondary`

### 5d. Stats Section

- Update glassmorphism cards to use green/amber tints instead of blue/white
- Dashboard stat cards: `bg-primary/10 backdrop-blur-md` instead of `bg-white/10`

### 5e. Footer

- Keep `bg-gray-900 text-white` dark footer (matches engapp-v2's dark footer pattern)

---

## 6. Navbar Restyling

Update `MainNavbar.tsx`:
- Change from solid `bg-background` to frosted glass: `bg-white/90 backdrop-blur-md`
- Keep `sticky top-0 z-50`
- Update active nav indicator from `text-blue-600` with blue bottom border to `text-primary` with green bottom border
- Add `<ThemeSwitcher compact />` to the right side of navbar
- Update guest CTA buttons: "Login" → `outline` variant, "Register" → `bg-primary`

---

## 7. Animations (from engapp-v2)

Add to `globals.css` / tailwind config:

### Utility animations (in `@layer utilities`)

```css
.animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
.animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-delay-100 { animation-delay: 0.1s; }
.animate-delay-200 { animation-delay: 0.2s; }
.animate-delay-300 { animation-delay: 0.3s; }
```

### Keyframes

- `fadeInUp`, `fadeIn`, `float` — already partially present in english-prep's tailwind config
- `blob-morph`, `blob-morph-alt` — organic shape animations for landing page decorations

---

## 8. Files Changed (Summary)

### Modified
- `src/app/globals.css` — full palette replacement, theme blocks, fonts, animations
- `tailwind.config.ts` — font families, animation additions
- `src/app/layout.tsx` — add ThemeProvider wrapper
- `src/components/MainNavbar.tsx` — frosted glass, theme switcher, color updates
- `src/components/LandingPage.tsx` — full restyling
- `src/components/Dashboard.tsx` — color sweep
- `src/components/AuthForm.tsx` — color sweep
- 31 additional component files — hardcoded color sweep

### New
- `src/contexts/ThemeContext.tsx`
- `src/components/theme/ThemeSwitcher.tsx`
- `public/fonts/monda.otf` (copied from engapp-v2)

---

## 9. Out of Scope

- Floating particle effects (user opted out)
- Bilingual language switching (engapp-v2 feature not needed)
- TipTap rich text editor integration
- ElevenLabs voice integration
- Shared design token system / monorepo tooling
