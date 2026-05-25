import { useEffect, useRef, useCallback, useState } from 'react';
import { extractApiErrorMessage } from '@/lib/api-response';

const BACKOFF_STEPS = [5_000, 10_000, 20_000];

export interface BackoffPollingState {
  error: string | null;
  isRetrying: boolean;
}

export function useBackoffPolling(
  fetchFn: () => Promise<void>,
  pollInterval: number,
  enabled = true,
) {
  const [state, setState] = useState<BackoffPollingState>({
    error: null,
    isRetrying: false,
  });

  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const pollIntervalRef = useRef(pollInterval);
  pollIntervalRef.current = pollInterval;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const scheduleRetry = useCallback((err: unknown) => {
    clearTimers();
    const count = retryCountRef.current;
    const delay = BACKOFF_STEPS[Math.min(count, BACKOFF_STEPS.length - 1)];
    retryCountRef.current = count + 1;
    setState({
      error: extractApiErrorMessage(err),
      isRetrying: true,
    });
    retryTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      doFetchAndPoll();
    }, delay);
  }, [clearTimers]); // eslint-disable-line react-hooks/exhaustive-deps

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        await fetchRef.current();
        if (!mountedRef.current) return;
        retryCountRef.current = 0;
        setState({ error: null, isRetrying: false });
      } catch (err) {
        if (!mountedRef.current) return;
        scheduleRetry(err);
      }
    }, pollIntervalRef.current);
  }, [scheduleRetry]);

  const doFetchAndPoll = useCallback(async () => {
    setState((s) => ({ ...s, isRetrying: true }));
    try {
      await fetchRef.current();
      if (!mountedRef.current) return;
      retryCountRef.current = 0;
      setState({ error: null, isRetrying: false });
      startPolling();
    } catch (err) {
      if (!mountedRef.current) return;
      setState((s) => ({ ...s, isRetrying: false }));
      scheduleRetry(err);
    }
  }, [startPolling, scheduleRetry]);

  const manualRetry = useCallback(() => {
    clearTimers();
    retryCountRef.current = 0;
    doFetchAndPoll();
  }, [clearTimers, doFetchAndPoll]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) doFetchAndPoll();
    return () => {
      mountedRef.current = false;
      clearTimers();
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, manualRetry };
}
