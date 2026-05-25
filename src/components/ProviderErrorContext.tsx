'use client';

import React, { createContext, useContext, useCallback, useSyncExternalStore } from 'react';

interface ProviderError {
  label: string;
  error: string | null;
  isRetrying: boolean;
  manualRetry: () => void;
}

type ErrorMap = Record<string, ProviderError>;

function createErrorStore() {
  let state: ErrorMap = {};
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => state,
    subscribe: (cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    set: (key: string, entry: ProviderError) => {
      state = { ...state, [key]: entry };
      listeners.forEach((cb) => cb());
    },
    remove: (key: string) => {
      const { [key]: _, ...rest } = state;
      state = rest;
      listeners.forEach((cb) => cb());
    },
  };
}

const store = createErrorStore();

const ProviderErrorContext = createContext(store);

export function ProviderErrorContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <ProviderErrorContext.Provider value={store}>
      {children}
    </ProviderErrorContext.Provider>
  );
}

export function useProviderErrorRegister() {
  const ctx = useContext(ProviderErrorContext);
  const register = useCallback(
    (key: string, entry: ProviderError) => ctx.set(key, entry),
    [ctx],
  );
  const unregister = useCallback((key: string) => ctx.remove(key), [ctx]);
  return { register, unregister };
}

export function useProviderErrors(): ProviderError[] {
  const ctx = useContext(ProviderErrorContext);
  const snap = useSyncExternalStore(ctx.subscribe, ctx.getSnapshot, ctx.getSnapshot);
  return Object.values(snap).filter((e) => e.error !== null);
}
