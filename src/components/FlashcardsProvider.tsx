'use client';

import { useEffect, useCallback } from 'react';
import { FlashcardListService } from '@/lib/api/services/FlashcardListService';
import type { FlashCardListResponse } from '@/lib/api/services/FlashcardListService';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setFlashcardLists } from '@/components/store/flashcardListSlice';
import { useBackoffPolling } from '@/hooks/useBackoffPolling';
import { useProviderErrorRegister } from './ProviderErrorContext';
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
  const { register, unregister } = useProviderErrorRegister();
  const userId = currUser?.id;

  const fetchLists = useCallback(async () => {
    if (!userId) return;
    const res = await FlashcardListService.listFlashCardLists(userId);
    const data = (res as any)?.data ?? res;
    if (data?.lists) {
      dispatch(setFlashcardLists(data.lists.map(mapList)));
    }
  }, [userId, dispatch]);

  const { error, isRetrying, manualRetry } = useBackoffPolling(fetchLists, POLL_INTERVAL, !!userId);

  useEffect(() => {
    register('flashcards', { label: 'Thẻ ghi nhớ', error, isRetrying, manualRetry });
    return () => unregister('flashcards');
  }, [error, isRetrying, manualRetry, register, unregister]);

  return <>{children}</>;
}
