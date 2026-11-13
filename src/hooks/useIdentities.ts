'use client';

import { useEffect, useMemo, useState } from 'react';
import { AuthService } from '@/lib/api/services/AuthService';
import { type Identity, missingIdentityIds } from '@/lib/identity-cache';

// Shared across components and pages for the session: authors repeat a lot on forum/blog pages.
const cache = new Map<string, Identity>();
const pending = new Set<string>();
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(l => l());

const fetchIdentities = async (ids: string[]) => {
  ids.forEach(id => pending.add(id));
  try {
    const res = await AuthService.authGatewayControllerHydrateIdentitiesV1(ids);
    const identities = ((res as { data?: { identities?: Identity[] } | null })?.data?.identities ?? []);
    identities.forEach(identity => cache.set(identity.id, identity));
    // Unknown ids (deleted accounts) resolve to a placeholder so they are not re-requested.
    ids.filter(id => !cache.has(id)).forEach(id => cache.set(id, { id: id }));
  } catch {
    // Leave them uncached: a later render retries. Names fall back to "Người dùng" meanwhile.
  } finally {
    ids.forEach(id => pending.delete(id));
    notify();
  }
};

/** Hydrated identities (name, avatar) for the given user ids, fetched in one batch and cached. */
export function useIdentities(ids: readonly (string | undefined | null)[]): Record<string, Identity> {
  const [version, setVersion] = useState(0);
  const key = [...new Set(ids.filter(Boolean))].sort().join(',');

  useEffect(() => {
    const listener = () => setVersion(v => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const missing = missingIdentityIds(key ? key.split(',') : [], cache, pending);
    // hydrate-many takes the ids in the query string; keep each request reasonably short.
    for (let i = 0; i < missing.length; i += 50) void fetchIdentities(missing.slice(i, i + 50));
  }, [key]);

  return useMemo(() => {
    const out: Record<string, Identity> = {};
    for (const id of key ? key.split(',') : []) {
      const identity = cache.get(id);
      if (identity) out[id] = identity;
    }
    return out;
    // `version` re-reads the cache after each fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);
}
