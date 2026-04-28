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
