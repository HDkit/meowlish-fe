# engapp-v2 Style Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle english-prep's frontend to match engapp-v2's nature-inspired visual identity — green/amber palette, 3 switchable themes, custom fonts, frosted glass navbar, and warm cream landing page.

**Architecture:** Replace CSS variables in `globals.css` with engapp-v2's HSL-based green/amber palette. Add a `ThemeContext` with `data-app-theme` attribute for 3 themes (Default Green, Mint Productivity, Forest Focus). Sweep 35 component files to replace 452 hardcoded blue/purple Tailwind classes with semantic tokens.

**Tech Stack:** Next.js 15, Tailwind CSS 3.4, shadcn/ui, next-themes, React Context API

**Spec:** `docs/superpowers/specs/2026-04-28-engapp-v2-style-alignment-design.md`

---

## File Structure

### New Files
- `src/contexts/ThemeContext.tsx` — App theme context (Default/Mint/Forest), `data-app-theme` attr, localStorage persistence
- `src/components/theme/ThemeSwitcher.tsx` — Dropdown with gradient swatches per theme
- `public/fonts/monda.otf` — Copied from engapp-v2

### Modified Files
- `src/app/globals.css` — Full palette replacement, 3 theme blocks, dark mode, fonts, shadows, animations
- `tailwind.config.ts` — Font families, container config
- `src/app/layout.tsx` — Wrap app in `AppThemeProvider`
- `src/components/MainNavbar.tsx` — Frosted glass, color sweep, ThemeSwitcher
- `src/components/LandingPage.tsx` — Full restyling (28 color occurrences)
- `src/components/Dashboard.tsx` — Color sweep (20 occurrences)
- `src/components/AuthForm.tsx` — Color sweep (20 occurrences)
- 31 additional component files — Color sweep (384 remaining occurrences)

---

## Task 1: Copy Font File and Update globals.css Palette

**Files:**
- Create: `public/fonts/monda.otf` (copy from engapp-v2)
- Modify: `src/app/globals.css`

- [ ] **Step 1: Copy the Monda font file**

```bash
mkdir -p /home/culove/english-prep/public/fonts
cp /home/culove/engapp-v2/Frontend/public/fonts/monda.otf /home/culove/english-prep/public/fonts/monda.otf
```

- [ ] **Step 2: Replace the `:root` block in globals.css (lines 7-46)**

Replace the hex-based `:root` block with HSL-based green/amber palette:

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
  --input-background: hsl(144 100% 96%);
  --switch-background: hsl(144 20% 80%);
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --ring: 144 46% 55%;
  --chart-1: 144 46% 55%;
  --chart-2: 32 87% 61%;
  --chart-3: 46 92% 71%;
  --chart-4: 170 77% 27%;
  --chart-5: 16 88% 64%;
  --radius: 1rem;
  --shadow-soft: 0 4px 20px hsl(220 15% 15% / 0.08);
  --shadow-medium: 0 8px 30px hsl(220 15% 15% / 0.12);
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --sidebar: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 144 46% 55%;
}
```

- [ ] **Step 3: Replace the `.dark` block (lines 48-83)**

```css
.dark {
  --background: 220 20% 10%;
  --foreground: 0 0% 98%;
  --card: 220 20% 12%;
  --card-foreground: 0 0% 98%;
  --popover: 220 20% 12%;
  --popover-foreground: 0 0% 98%;
  --primary: 84 86% 48%;
  --primary-foreground: 220 20% 10%;
  --secondary: 230 62% 61%;
  --secondary-foreground: 0 0% 98%;
  --muted: 220 20% 18%;
  --muted-foreground: 220 10% 70%;
  --accent: 56 100% 81%;
  --accent-foreground: 220 20% 10%;
  --destructive: 0 62.8% 50%;
  --destructive-foreground: 0 0% 98%;
  --border: 220 20% 20%;
  --input: 220 20% 20%;
  --ring: 84 86% 48%;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --sidebar: 240 5.9% 10%;
  --sidebar-foreground: 240 4.8% 95.9%;
  --sidebar-primary: 224.3 76.3% 48%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 240 3.7% 15.9%;
  --sidebar-accent-foreground: 240 4.8% 95.9%;
  --sidebar-border: 240 3.7% 15.9%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}
```

- [ ] **Step 4: Update the `@theme inline` block (lines 85-115)**

Replace with `hsl()` wrappers for all tokens:

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
  --color-sidebar: hsl(var(--sidebar));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-primary: hsl(var(--sidebar-primary));
  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));
  --color-sidebar-accent: hsl(var(--sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));
  --color-sidebar-border: hsl(var(--sidebar-border));
  --color-sidebar-ring: hsl(var(--sidebar-ring));
  --border-radius-lg: var(--radius);
  --border-radius-md: calc(var(--radius) - 2px);
  --border-radius-sm: calc(var(--radius) - 4px);
}
```

- [ ] **Step 5: Add `@font-face` and update body styles**

Add before the `@layer base` block (after the `@theme inline` block):

```css
@font-face {
  font-family: 'Monda';
  src: url('/fonts/monda.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

Replace the `body` block (lines 128-134) — remove the inline `font-family` declaration:

```css
body {
  font-size: var(--font-size);
  background: var(--background);
  color: var(--foreground);
}
```

Update the `@layer base` block (lines 136-144):

```css
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-body;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}
```

- [ ] **Step 6: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

Expected: Build completes (may have warnings about unused classes, that's fine).

- [ ] **Step 7: Commit**

```bash
git add public/fonts/monda.otf src/app/globals.css
git commit -m "feat: replace blue/purple palette with engapp-v2 green/amber theme"
```

---

## Task 2: Add Three-Theme CSS Blocks

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add Mint Productivity theme block**

Add after the `.dark` block, before the `@theme inline` block:

```css
:root[data-app-theme='mint-productivity'] {
  --background: 150 55% 96%;
  --foreground: 168 38% 16%;
  --card: 0 0% 100%;
  --card-foreground: 168 38% 16%;
  --popover: 0 0% 100%;
  --popover-foreground: 168 38% 16%;
  --primary: 170 77% 27%;
  --primary-foreground: 0 0% 100%;
  --secondary: 43 93% 58%;
  --secondary-foreground: 164 40% 15%;
  --muted: 150 32% 90%;
  --muted-foreground: 170 22% 38%;
  --accent: 158 60% 43%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 160 22% 82%;
  --input: 160 22% 82%;
  --ring: 170 77% 27%;
  --sidebar: 152 46% 93%;
  --sidebar-foreground: 168 32% 20%;
  --sidebar-primary: 170 77% 27%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 152 24% 88%;
  --sidebar-accent-foreground: 168 32% 20%;
  --sidebar-border: 160 22% 80%;
  --sidebar-ring: 170 77% 27%;
}
```

- [ ] **Step 2: Add Forest Focus theme block**

Add after the Mint Productivity block:

```css
:root[data-app-theme='forest-focus'] {
  --background: 142 28% 95%;
  --foreground: 156 32% 18%;
  --card: 0 0% 100%;
  --card-foreground: 156 32% 18%;
  --popover: 0 0% 100%;
  --popover-foreground: 156 32% 18%;
  --primary: 146 45% 31%;
  --primary-foreground: 0 0% 100%;
  --secondary: 16 88% 64%;
  --secondary-foreground: 156 40% 12%;
  --muted: 143 20% 88%;
  --muted-foreground: 156 18% 35%;
  --accent: 16 88% 64%;
  --accent-foreground: 156 40% 12%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 145 18% 79%;
  --input: 145 18% 79%;
  --ring: 146 45% 31%;
  --sidebar: 142 24% 91%;
  --sidebar-foreground: 156 32% 20%;
  --sidebar-primary: 146 45% 31%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 142 15% 85%;
  --sidebar-accent-foreground: 156 32% 20%;
  --sidebar-border: 145 18% 74%;
  --sidebar-ring: 146 45% 31%;
}
```

- [ ] **Step 3: Add utility animation classes from engapp-v2**

Add after the existing `@layer base` block:

```css
@layer utilities {
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-delay-100 {
    animation-delay: 0.1s;
  }

  .animate-delay-200 {
    animation-delay: 0.2s;
  }

  .animate-delay-300 {
    animation-delay: 0.3s;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes blob-morph {
    0%, 100% {
      border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
      transform: rotate(6deg) scale(1);
    }
    25% {
      border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%;
      transform: rotate(8deg) scale(1.02);
    }
    50% {
      border-radius: 50% 60% 30% 60% / 50% 40% 70% 50%;
      transform: rotate(4deg) scale(0.98);
    }
    75% {
      border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
      transform: rotate(10deg) scale(1.01);
    }
  }

  @keyframes blob-morph-alt {
    0%, 100% {
      border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
      transform: rotate(-4deg) scale(1);
    }
    33% {
      border-radius: 30% 60% 70% 40% / 50% 70% 30% 50%;
      transform: rotate(-8deg) scale(0.97);
    }
    66% {
      border-radius: 70% 40% 50% 60% / 40% 60% 50% 60%;
      transform: rotate(-2deg) scale(1.03);
    }
  }

  .animate-blob-morph {
    animation: blob-morph 12s ease-in-out infinite;
  }

  .animate-blob-morph-alt {
    animation: blob-morph-alt 10s ease-in-out infinite;
  }
}
```

- [ ] **Step 4: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add mint-productivity and forest-focus theme CSS blocks"
```

---

## Task 3: Update Tailwind Config

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add font families and container config**

Add `fontFamily` inside `theme.extend` and add `container` inside `theme` (before `extend`). Update the `colors` block to use `hsl()` wrappers consistently. The full updated file:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
	darkMode: ['class'],
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	safelist: [
		'bg-green-100',
		'text-green-800',
		'bg-green-500',
		'bg-yellow-200',
		'text-yellow-900',
		'bg-yellow-500',
		'bg-red-100',
		'text-red-800',
		'bg-red-500',
		'bg-gray-100',
		'text-gray-800',
		'bg-gray-400',
		'bg-gray-600',
		'bg-gray-800',
		'bg-black',
		'text-white',
		'text-gray-900',
		'text-gray-600',
		'shadow-sm',
		'shadow-md',
		'hover:bg-gray-800',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			fontFamily: {
				heading: ['Momo Trust Display', 'sans-serif'],
				body: ['Google Sans Flex', 'sans-serif'],
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};

export default config;
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add font families and container config to tailwind"
```

---

## Task 4: Create ThemeContext

**Files:**
- Create: `src/contexts/ThemeContext.tsx`

- [ ] **Step 1: Create the contexts directory and ThemeContext**

```tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeKey = 'default' | 'mint' | 'forest';

interface ThemeConfig {
  key: ThemeKey;
  name: string;
  subtitle: string;
  attributeValue: string | null;
  swatchClass: string;
}

export const themeConfigs: Record<ThemeKey, ThemeConfig> = {
  default: {
    key: 'default',
    name: 'Default Green',
    subtitle: 'Fresh and natural',
    attributeValue: null,
    swatchClass: 'bg-gradient-to-br from-[#56c271] to-[#f2c94c]',
  },
  mint: {
    key: 'mint',
    name: 'Mint Productivity',
    subtitle: 'Bright and focused',
    attributeValue: 'mint-productivity',
    swatchClass: 'bg-gradient-to-br from-[#0f766e] to-[#34d399]',
  },
  forest: {
    key: 'forest',
    name: 'Forest Focus',
    subtitle: 'Executive and premium',
    attributeValue: 'forest-focus',
    swatchClass: 'bg-gradient-to-br from-[#1f5136] to-[#ff8b6a]',
  },
};

interface ThemeContextValue {
  currentTheme: ThemeKey;
  setCurrentTheme: (theme: ThemeKey) => void;
  theme: ThemeConfig;
  themeList: ThemeConfig[];
}

const STORAGE_KEY = 'englishprep.theme';
const DATA_ATTR = 'data-app-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getInitialTheme = (): ThemeKey => {
  if (typeof window === 'undefined') return 'default';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'mint' || stored === 'forest' || stored === 'default') {
    return stored;
  }
  return 'default';
};

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    const config = themeConfigs[currentTheme];

    if (config.attributeValue) {
      root.setAttribute(DATA_ATTR, config.attributeValue);
    } else {
      root.removeAttribute(DATA_ATTR);
    }

    localStorage.setItem(STORAGE_KEY, currentTheme);
  }, [currentTheme]);

  const value = useMemo(
    () => ({
      currentTheme,
      setCurrentTheme,
      theme: themeConfigs[currentTheme],
      themeList: Object.values(themeConfigs),
    }),
    [currentTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
};
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/contexts/ThemeContext.tsx
git commit -m "feat: add AppThemeProvider context for 3-theme switching"
```

---

## Task 5: Create ThemeSwitcher Component

**Files:**
- Create: `src/components/theme/ThemeSwitcher.tsx`

- [ ] **Step 1: Create the ThemeSwitcher component**

```tsx
'use client';

import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { currentTheme, setCurrentTheme, themeList } = useAppTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? 'sm' : 'default'}
          className={cn(
            'gap-2 border-border/60 bg-background/80 hover:bg-muted/60',
            compact ? 'h-8 px-2.5' : 'h-9 px-3',
          )}
        >
          <Palette className="h-4 w-4" />
          {!compact && <span className="text-xs font-medium">Theme</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="leading-tight">
          <p className="text-sm">Theme</p>
          <p className="text-xs text-muted-foreground font-normal">Choose style</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 pb-2 flex items-center gap-2">
          {themeList.map((themeItem) => {
            const isActive = currentTheme === themeItem.key;
            return (
              <button
                key={themeItem.key}
                type="button"
                aria-label={`Switch to ${themeItem.name}`}
                title={themeItem.name}
                onClick={() => setCurrentTheme(themeItem.key)}
                className={cn(
                  'relative h-8 w-8 rounded-full transition-all duration-300',
                  themeItem.swatchClass,
                  isActive
                    ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'opacity-80 hover:opacity-100 hover:scale-105',
                )}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-full ring-4 ring-primary/20 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {themeList.map((themeItem) => {
          const isActive = currentTheme === themeItem.key;
          return (
            <DropdownMenuItem
              key={themeItem.key}
              onClick={() => setCurrentTheme(themeItem.key)}
              className={cn('py-2', isActive && 'bg-primary/10')}
            >
              <div className="flex items-center gap-2 w-full">
                <span className={cn('h-3 w-3 rounded-full', themeItem.swatchClass)} />
                <div className="leading-tight">
                  <p className="text-xs font-semibold">{themeItem.name}</p>
                  <p className="text-[11px] text-muted-foreground">{themeItem.subtitle}</p>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/theme/ThemeSwitcher.tsx
git commit -m "feat: add ThemeSwitcher dropdown component"
```

---

## Task 6: Integrate ThemeProvider in Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add AppThemeProvider import and wrap the app**

Add the import at the top of the file:

```tsx
import { AppThemeProvider } from '@/contexts/ThemeContext';
```

Wrap the content inside the next-themes `<ThemeProvider>`:

```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <AppThemeProvider>
    <ApiClientProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <MainNavbar />
        <main className="flex-1 mx-auto relative w-full">
          {children}
        </main>
        <Toaster />
      </div>
    </ApiClientProvider>
  </AppThemeProvider>
</ThemeProvider>
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: integrate AppThemeProvider in root layout"
```

---

## Task 7: Restyle MainNavbar

**Files:**
- Modify: `src/components/MainNavbar.tsx`

- [ ] **Step 1: Add ThemeSwitcher import**

Add at the top with other imports:

```tsx
import { ThemeSwitcher } from './theme/ThemeSwitcher';
```

- [ ] **Step 2: Update `getNavClass` function (lines 59-63)**

Replace the blue-600 colors with primary:

```tsx
const getNavClass = (path: string) => {
  return isActive(path)
    ? 'text-primary bg-transparent hover:bg-muted relative after:absolute after:-bottom-[17px] after:left-0 after:h-[3px] after:w-full after:bg-primary after:rounded-t-md'
    : 'text-muted-foreground hover:text-foreground bg-transparent hover:bg-muted relative after:absolute after:-bottom-[17px] after:left-0 after:h-[3px] after:w-full after:bg-transparent';
};
```

- [ ] **Step 3: Update header element (line 66)**

Replace the solid background with frosted glass:

```tsx
<header className='bg-white/90 backdrop-blur-md border-b border-border/60 sticky top-0 z-50'>
```

- [ ] **Step 4: Add ThemeSwitcher to the right side of navbar**

Inside the user buttons area (line 142), add the ThemeSwitcher before the user/auth buttons:

```tsx
<div className='flex items-center space-x-4 ml-auto'>
  <ThemeSwitcher compact />
  {user ? (
```

- [ ] **Step 5: Update guest CTA buttons (lines 246-258)**

Replace the purple/blue gradient buttons:

```tsx
<Button
  variant='outline'
  onClick={() => router.push('/auth')}
  className='border-2 border-primary text-primary hover:bg-primary/10 font-semibold transition-all shadow-sm hover:shadow-md'
>
  Đăng nhập
</Button>
<Button
  onClick={() => router.push('/auth?mode=register')}
  className='bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all'
>
  Đăng ký
</Button>
```

- [ ] **Step 6: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

- [ ] **Step 7: Commit**

```bash
git add src/components/MainNavbar.tsx
git commit -m "feat: restyle navbar with frosted glass and green theme"
```

---

## Task 8: Restyle LandingPage

**Files:**
- Modify: `src/components/LandingPage.tsx`

- [ ] **Step 1: Update Hero section (lines 30-71)**

Replace the entire hero section with nature-themed colors:

```tsx
<div className='min-h-screen bg-background font-sans overflow-hidden'>
  {/* Hero Section */}
  <section className='relative pt-24 pb-20 md:pt-32 md:pb-32 lg:pt-40 lg:pb-40'>
    <div className='absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10'></div>
    {/* Organic Background Shapes */}
    <div className='absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-blob-morph'></div>
    <div className='absolute top-40 right-20 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-blob-morph-alt'></div>
    <div className='absolute -bottom-10 left-1/3 w-80 h-80 bg-secondary/15 rounded-full blur-3xl animate-blob-morph'></div>

    <div className='container relative z-10 mx-auto px-4 md:px-6 lg:px-8 text-center'>
      <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-foreground drop-shadow-sm'>
        Chinh phục IELTS & TOEIC
        <br />
        với <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">trí tuệ nhân tạo</span>
      </h1>
      <p className='text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto px-4 leading-relaxed font-medium'>
        Hệ thống luyện thi tiếng Anh chuẩn mực với công nghệ AI chấm điểm tự động. Xây dựng lộ trình cá nhân hóa, dự đoán điểm số và giúp bạn đạt mục tiêu nhanh hơn gấp 3 lần.
      </p>
      <div className='flex flex-col sm:flex-row gap-4 justify-center mb-16 px-4'>
        <Button size='lg' onClick={onGetStarted} className='text-lg px-8 py-7 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_8px_30px_hsl(144_46%_55%/0.24)] hover:shadow-[0_8px_30px_hsl(144_46%_55%/0.4)] transition-all hover:-translate-y-1 w-full sm:w-auto font-bold'>
          Bắt đầu học ngay
          <ArrowRight className='ml-2 h-5 w-5' />
        </Button>
        <Button size='lg' variant='outline' className='text-lg px-8 py-7 rounded-2xl border-2 border-border text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all w-full sm:w-auto font-bold bg-white/50 backdrop-blur-sm'>
          <Play className='mr-2 h-5 w-5' />
          Xem video demo
        </Button>
      </div>
```

- [ ] **Step 2: Update Statistics section (lines 73-95)**

Replace hardcoded color classes:

```tsx
{/* Statistics */}
<section className='py-8 md:py-12 bg-background relative -mt-16 z-20'>
  <div className='container mx-auto px-4 md:px-6 lg:px-8'>
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center'>
      <div className='p-8 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 transition-transform'>
        <div className='text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary mb-2'>98%</div>
        <p className='text-muted-foreground font-medium text-sm md:text-base tracking-wide'>TỶ LỆ CẢI THIỆN ĐIỂM</p>
      </div>
      <div className='p-8 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 transition-transform'>
        <div className='text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary mb-2'>50K+</div>
        <p className='text-muted-foreground font-medium text-sm md:text-base tracking-wide'>HỌC VIÊN TÍN NHIỆM</p>
      </div>
      <div className='p-8 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 transition-transform'>
        <div className='text-3xl md:text-4xl lg:text-5xl font-extrabold text-secondary mb-2'>1.2M+</div>
        <p className='text-muted-foreground font-medium text-sm md:text-base tracking-wide'>BÀI THI ĐÃ CHẤM</p>
      </div>
      <div className='p-8 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 transition-transform'>
        <div className='text-3xl md:text-4xl lg:text-5xl font-extrabold text-accent mb-2'>7.5+</div>
        <p className='text-muted-foreground font-medium text-sm md:text-base tracking-wide'>ĐIỂM TRUNG BÌNH THỰC TẾ</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Update Features section (lines 97-132)**

Replace the feature card colors and add warm cream background:

```tsx
{/* Features */}
<section className='py-20 md:py-28 bg-[#fff6dc]'>
  <div className='container mx-auto px-4 md:px-6 lg:px-8'>
    <div className='text-center mb-16 md:mb-20'>
      <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground tracking-tight'>
        Giải pháp <span className='text-primary'>toàn diện</span>
      </h2>
      <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
        Công nghệ định hình lại phương pháp tự học. Mang đến cho bạn trải nghiệm luyện thi như có Gia Sư 1 kèm 1 bên cạnh.
      </p>
    </div>

    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
      {[
        { icon: Brain, title: "AI Chấm Mốc Nhanh Chóng", desc: "Chấm điểm Writing & Speaking chỉ trong 5 giây với độ chính xác theo barem chuẩn.", bgIcon: "bg-primary/15", textIcon: "text-primary" },
        { icon: Target, title: "Cá Nhân Hóa Đề Trắc Nghiệm", desc: "Thuật toán tự động tìm ra điểm yếu và xoáy sâu bài tập vào các kỹ năng còn kém.", bgIcon: "bg-secondary/15", textIcon: "text-secondary" },
        { icon: BarChart, title: "Biểu Đồ Theo Dõi Tiến Độ", desc: "Báo cáo năng lực đa chiều, dự báo điểm thi tương lai để bạn tự tin đăng ký lịch thi.", bgIcon: "bg-accent/15", textIcon: "text-accent" },
        { icon: BookOpen, title: "Kho Tàng Đề Khổng Lồ", desc: "+20,000 bài tập cập nhật xu hướng ra đề mới nhất từ các nhà xuất bản hàng đầu.", bgIcon: "bg-primary/15", textIcon: "text-primary" },
        { icon: Clock, title: "Giao Diện Giả Lập Thi Thật", desc: "Ép thời gian, tắt hỗ trợ ngôn ngữ. Vượt qua tâm lý hoảng loạn trong phòng thi thật.", bgIcon: "bg-secondary/15", textIcon: "text-secondary" },
        { icon: Users, title: "Xếp Hạng & Thi Đua", desc: "Hệ thống Bảng Xếp Hạng khơi dậy tinh thần tranh đua lành mạnh giữa hàng ngàn User.", bgIcon: "bg-accent/15", textIcon: "text-accent" },
      ].map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <Card key={idx} className='p-8 border-0 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group'>
            <div className={`w-14 h-14 rounded-2xl ${feature.bgIcon} flex items-center justify-center mb-6`}>
              <Icon className={`h-7 w-7 ${feature.textIcon}`} />
            </div>
            <h3 className='text-xl font-bold mb-3 text-foreground'>{feature.title}</h3>
            <p className='text-muted-foreground font-medium leading-relaxed'>{feature.desc}</p>
            <div className='absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-primary/10'></div>
          </Card>
        )
      })}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Update How It Works section (lines 134-174)**

Replace all blue/purple/pink gradients with nature-themed greens:

```tsx
{/* How it works */}
<section className='py-12 md:py-16 lg:py-20 bg-[#fff6dc]'>
  <div className='container mx-auto px-4 md:px-6 lg:px-8'>
    <div className='text-center mb-10 md:mb-12 lg:mb-16'>
      <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-foreground'>Cách thức hoạt động</h2>
      <p className='text-base md:text-lg lg:text-xl text-muted-foreground px-4'>
        3 bước đơn giản để bắt đầu hành trình chinh phục IELTS & TOEIC
      </p>
    </div>

    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8'>
      <div className='text-center p-4 md:p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-primary/10 to-white hover:scale-105 transform border-2 border-transparent hover:border-primary/30'>
        <div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4 md:mb-6 shadow-2xl ring-4 ring-primary/20 hover:ring-primary/30 transition-all'>
          1
        </div>
        <h3 className='text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>Đánh giá trình độ</h3>
        <p className='text-sm md:text-base text-muted-foreground px-2 leading-relaxed'>
          Làm bài test đầu vào để AI phân tích chính xác trình độ hiện tại của bạn
        </p>
      </div>
      <div className='text-center p-4 md:p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-secondary/10 to-white hover:scale-105 transform border-2 border-transparent hover:border-secondary/30'>
        <div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/70 text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4 md:mb-6 shadow-2xl ring-4 ring-secondary/20 hover:ring-secondary/30 transition-all'>
          2
        </div>
        <h3 className='text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent'>Luyện thi cá nhân hóa</h3>
        <p className='text-sm md:text-base text-muted-foreground px-2 leading-relaxed'>
          AI tạo lộ trình học tập riêng với các bài thi phù hợp với trình độ và mục tiêu
        </p>
      </div>
      <div className='text-center p-4 md:p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-accent/10 to-white hover:scale-105 transform border-2 border-transparent hover:border-accent/30'>
        <div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-accent via-accent/90 to-accent/70 text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4 md:mb-6 shadow-2xl ring-4 ring-accent/20 hover:ring-accent/30 transition-all'>
          3
        </div>
        <h3 className='text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent'>Đạt mục tiêu</h3>
        <p className='text-sm md:text-base text-muted-foreground px-2 leading-relaxed'>
          Theo dõi tiến độ và điều chỉnh chiến lược để đạt band điểm mong muốn
        </p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Update Testimonials section (lines 176-248)**

Replace blue/purple card tints with nature palette:

```tsx
{/* Testimonials */}
<section className='py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-muted'>
  <div className='container mx-auto px-4 md:px-6 lg:px-8'>
    <div className='text-center mb-10 md:mb-12 lg:mb-16'>
      <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-foreground'>
        <span className='bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'>Học viên</span>{' '}
        <span className='bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent'>nói gì về chúng tôi</span>
      </h2>
    </div>

    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8'>
      <Card className='border-2 hover:border-primary/30 hover:shadow-xl transition-all bg-gradient-to-br from-primary/5 to-white'>
```

(The card content stays the same, just replace `hover:border-blue-200` → `hover:border-primary/30`, `from-blue-50/30` → `from-primary/5`, `from-purple-50/30` → `from-secondary/5`, `from-pink-50/30` → `from-accent/5` for the 3 cards.)

- [ ] **Step 6: Update CTA section (lines 250-270)**

Replace the blue-600 background with primary:

```tsx
{/* CTA Section */}
<section className='relative py-20 lg:py-32 bg-primary overflow-hidden'>
  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
  <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-secondary rounded-full blur-[100px] opacity-50 translate-x-1/2 -translate-y-1/2"></div>
  <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-accent rounded-full blur-[100px] opacity-40 -translate-x-1/3 translate-y-1/3"></div>

  <div className='relative z-10 container px-4 mx-auto text-center'>
    <h2 className='text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-primary-foreground tracking-tight'>Tương lai của bạn bắt đầu ở đây</h2>
    <p className='text-lg md:text-xl mb-10 text-primary-foreground/80 px-4 font-medium max-w-2xl mx-auto'>Đừng để ngoại ngữ là rào cản. Hãy đăng ký ngay hôm nay để trải nghiệm miễn phí 10 bài test toàn diện.</p>

    <div className='flex flex-col sm:flex-row gap-4 justify-center'>
      <Button size='lg' onClick={onGetStarted} className='text-lg px-8 py-7 rounded-2xl bg-white text-primary hover:bg-white/90 shadow-xl transition-all font-bold'>
        Tạo tài khoản miễn phí
        <ArrowRight className='ml-2 h-5 w-5' />
      </Button>
      <Button size='lg' variant='outline' onClick={onLogin} className='text-lg px-8 py-7 rounded-2xl border-white/30 text-primary-foreground bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all font-bold'>
        Đăng nhập
      </Button>
    </div>
  </div>
</section>
```

- [ ] **Step 7: Update the hero fade gradient (line 61)**

```tsx
<div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 h-32 bottom-0 top-auto pointer-events-none"></div>
```

- [ ] **Step 8: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

- [ ] **Step 9: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat: restyle landing page with nature-inspired green/amber theme"
```

---

## Task 9: Color Sweep — High-Priority Components (Dashboard, AuthForm)

**Files:**
- Modify: `src/components/Dashboard.tsx` (20 occurrences)
- Modify: `src/components/AuthForm.tsx` (20 occurrences)

- [ ] **Step 1: Sweep Dashboard.tsx**

Run the following replacements across the file:
- `text-blue-600` → `text-primary`
- `text-blue-500` → `text-primary/80`
- `bg-blue-600` → `bg-primary`
- `bg-blue-500` → `bg-primary`
- `bg-blue-100` → `bg-primary/15`
- `bg-blue-50` → `bg-primary/10`
- `hover:bg-blue-700` → `hover:bg-primary/90`
- `text-indigo-600` → `text-primary`
- `bg-indigo-600` → `bg-primary`
- `text-purple-600` → `text-secondary`
- `bg-purple-600` → `bg-secondary`
- `bg-purple-100` → `bg-secondary/15`
- `from-blue-600 via-indigo-600 to-purple-600` → `from-primary to-primary/80`
- `from-blue-600 to-purple-600` → `from-primary to-secondary`
- `border-blue-600` → `border-primary`
- `ring-blue-600` → `ring-primary`
- `text-pink-600` → `text-secondary`

- [ ] **Step 2: Sweep AuthForm.tsx**

Apply the same mapping as Step 1 to AuthForm.tsx.

- [ ] **Step 3: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard.tsx src/components/AuthForm.tsx
git commit -m "feat: color sweep Dashboard and AuthForm to green/amber palette"
```

---

## Task 10: Color Sweep — Medium-Priority Components

**Files (8 files, 10-38 occurrences each):**
- Modify: `src/components/TestDetail.tsx` (38)
- Modify: `src/components/ExamCreationPage.tsx` (32)
- Modify: `src/components/TestInterface.tsx` (29)
- Modify: `src/components/UserPage.tsx` (28)
- Modify: `src/components/BlogPage.tsx` (28)
- Modify: `src/components/SpeakingResults.tsx` (20)
- Modify: `src/components/FlashcardListDetail.tsx` (20)
- Modify: `src/components/SpeakingTest.tsx` (19)

- [ ] **Step 1: Apply the color mapping from Task 9 Step 1 to all 8 files**

For each file, apply the same blue→primary, purple→secondary, indigo→primary, pink→secondary replacements.

- [ ] **Step 2: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TestDetail.tsx src/components/ExamCreationPage.tsx src/components/TestInterface.tsx src/components/UserPage.tsx src/components/BlogPage.tsx src/components/SpeakingResults.tsx src/components/FlashcardListDetail.tsx src/components/SpeakingTest.tsx
git commit -m "feat: color sweep 8 medium-priority components to green/amber"
```

---

## Task 11: Color Sweep — Remaining Components

**Files (19 files, 1-17 occurrences each):**
- Modify: `src/components/SpeakingSession.tsx` (17)
- Modify: `src/components/ResultsView.tsx` (14)
- Modify: `src/components/FlashcardPage.tsx` (14)
- Modify: `src/components/AdminDashboard.tsx` (14)
- Modify: `src/components/TestResult.tsx` (13)
- Modify: `src/components/TextHighlighter.tsx` (12)
- Modify: `src/components/ExamManagementPage.tsx` (11)
- Modify: `src/components/BlogManagementPage.tsx` (11)
- Modify: `src/components/UserManagementPage.tsx` (9)
- Modify: `src/components/TestSelection.tsx` (9)
- Modify: `src/components/SpeakingWritingPage.tsx` (6)
- Modify: `src/components/ExamApprovalPage.tsx` (6)
- Modify: `src/components/WritingTest.tsx` (5)
- Modify: `src/components/ui/toast.tsx` (4)
- Modify: `src/components/ProgressTracker.tsx` (4)
- Modify: `src/components/EditGoalBtn.tsx` (4)
- Modify: `src/components/admin/AdminTagManager.tsx` (4)
- Modify: `src/components/AddGoalBtn.tsx` (4)
- Modify: `src/components/History.tsx` (2)
- Modify: `src/components/ExamApproval.tsx` (2)
- Modify: `src/components/QuestionCard.tsx` (1)
- Modify: `src/components/ui/tabs.tsx` (1)
- Modify: `src/lib/store/StoreProvider.tsx` (if needed)

- [ ] **Step 1: Apply the color mapping from Task 9 Step 1 to all remaining files**

For each file, apply the same blue→primary, purple→secondary, indigo→primary, pink→secondary replacements.

- [ ] **Step 2: Verify zero remaining blue/purple references**

```bash
grep -rn "blue-\|indigo-\|purple-\|violet-" /home/culove/english-prep/src/components --include="*.tsx" --include="*.ts" | grep -v "node_modules" | wc -l
```

Expected: `0` (or close to zero — some may be intentional like `bg-blue-500` in status badges within the safelist).

- [ ] **Step 3: Verify the build compiles**

```bash
cd /home/culove/english-prep && npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ src/lib/store/
git commit -m "feat: complete color sweep — all components use green/amber palette"
```

---

## Task 12: Visual Verification and Final Polish

**Files:**
- Possibly modify: any file from previous tasks

- [ ] **Step 1: Start the dev server**

```bash
cd /home/culove/english-prep && npm run dev
```

- [ ] **Step 2: Visual check — Landing page**

Open `http://localhost:3000/landing` and verify:
- Hero gradient is green-to-amber (not blue-to-purple)
- Background blobs are green/amber organic shapes
- Feature and How It Works sections have warm cream (#fff6dc) backgrounds
- CTA buttons are green primary
- Stats show primary/secondary/accent colors
- Footer remains dark
- No residual blue/purple colors

- [ ] **Step 3: Visual check — Navbar**

Verify:
- Frosted glass effect (translucent white with blur)
- ThemeSwitcher dropdown appears with 3 gradient swatches
- Switching themes changes colors across the page
- Active nav item uses green indicator (not blue)
- Guest buttons use green (not purple/blue)

- [ ] **Step 4: Visual check — Theme switching**

Click each theme swatch and verify:
- Default Green: mint green background, green primary
- Mint Productivity: teal primary, golden secondary
- Forest Focus: dark forest green primary, coral accents
- Each theme persists after page reload (localStorage)

- [ ] **Step 5: Visual check — Auth page**

Navigate to `/auth` and verify no blue/purple colors.

- [ ] **Step 6: Visual check — Dashboard**

Log in and verify Dashboard uses green/amber palette, no blue/purple residuals.

- [ ] **Step 7: Fix any visual issues found**

Address any remaining hardcoded colors or visual inconsistencies.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "fix: visual polish after style alignment review"
```

---

## Summary

| Task | Description | Files | Est. |
|------|-------------|-------|------|
| 1 | Font + CSS palette swap | globals.css, monda.otf | 10 min |
| 2 | Three-theme CSS blocks | globals.css | 5 min |
| 3 | Tailwind config update | tailwind.config.ts | 3 min |
| 4 | ThemeContext | ThemeContext.tsx (new) | 3 min |
| 5 | ThemeSwitcher | ThemeSwitcher.tsx (new) | 3 min |
| 6 | Layout integration | layout.tsx | 2 min |
| 7 | Navbar restyle | MainNavbar.tsx | 5 min |
| 8 | Landing page restyle | LandingPage.tsx | 10 min |
| 9 | Color sweep — high priority | Dashboard, AuthForm | 10 min |
| 10 | Color sweep — medium priority | 8 components | 15 min |
| 11 | Color sweep — remaining | 19+ components | 20 min |
| 12 | Visual verification | all | 15 min |
