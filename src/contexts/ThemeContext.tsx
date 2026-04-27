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
