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
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform" />
      <span className="sr-only">Chuyển đổi giao diện</span>
    </Button>
  );
}
