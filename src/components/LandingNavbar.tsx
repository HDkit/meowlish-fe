'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useAuth } from '@/lib/hooks/useAuth';

export function LandingNavbar() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-border/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <button
          onClick={() => router.push('/landing')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Image src="/logos/logo.svg" alt="Lingriser" width={110} height={30} priority />
        </button>

        <div className="flex items-center gap-3 ml-auto">
          {!hydrated ? (
            <div className="w-24 h-9" />
          ) : isAuthenticated ? (
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm"
            >
              Dashboard
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
