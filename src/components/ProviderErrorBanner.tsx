'use client';

import { useEffect, useRef } from 'react';
import { useProviderErrors } from './ProviderErrorContext';
import { useToast } from './ui/use-toast';

export function ProviderErrorBanner() {
  const errors = useProviderErrors();
  const { toast } = useToast();
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const e of errors) {
      const key = `${e.label}:${e.error}`;
      if (shownRef.current.has(key)) continue;
      shownRef.current.add(key);
      toast({
        title: e.label,
        description: e.error ?? 'Đã xảy ra lỗi',
        variant: 'destructive',
      });
    }
    const activeKeys = new Set(errors.map((e) => `${e.label}:${e.error}`));
    for (const key of shownRef.current) {
      if (!activeKeys.has(key)) shownRef.current.delete(key);
    }
  }, [errors, toast]);

  return null;
}
