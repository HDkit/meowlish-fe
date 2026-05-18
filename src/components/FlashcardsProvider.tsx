'use client';

import { useEffect, useRef, useCallback } from 'react';
import { FlashcardListService } from '@/lib/api/services/FlashcardListService';
import type { FlashCardListResponse } from '@/lib/api/services/FlashcardListService';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setFlashcardLists } from '@/components/store/flashcardListSlice';
import type { FlashcardList } from '@/types/client';

const POLL_INTERVAL = 60_000;

function mapList(l: FlashCardListResponse): FlashcardList {
  return {
    id: l.id,
    authorId: l.authorId,
    name: l.name,
    description: l.description || undefined,
    isPublic: l.isPublic,
    tags: l.tags ?? [],
    createdAt: new Date(l.createdAt).getTime(),
    updatedAt: l.updatedAt ? new Date(l.updatedAt).getTime() : undefined,
  };
}

export function FlashcardsProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const currUser = useAppSelector(
    (s) => (s as any).currUser?.entity ?? (s as any).currUser?.current ?? null,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLists = useCallback(async () => {
    if (!currUser?.id) return;
    try {
      const res = await FlashcardListService.listFlashCardLists(currUser.id);
      if (res?.lists) {
        dispatch(setFlashcardLists(res.lists.map(mapList)));
      }
    } catch (err) {
      console.error('[FlashcardsProvider] fetch error:', err);
    }
  }, [currUser?.id, dispatch]);

  useEffect(() => {
    if (!currUser?.id) return;
    fetchLists();
    intervalRef.current = setInterval(fetchLists, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currUser?.id, fetchLists]);

  return <>{children}</>;
}
