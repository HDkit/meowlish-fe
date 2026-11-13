'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExamPracticeService } from '@/lib/api';
import type { UserActivityDto } from '@/lib/api/models/UserActivityDto';
import type { UserSkillStatsDto } from '@/lib/api/models/UserSkillStatsDto';
import { extractApiErrorMessage } from '@/lib/api-response';

export type AsyncState<T> = {
	data: T | null;
	loading: boolean;
	/** user-facing message, never raw error JSON */
	error: string | null;
	reload: () => void;
};

function useApiData<T>(fetcher: () => Promise<{ data?: unknown } | null | undefined>, key: string): AsyncState<T> {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [nonce, setNonce] = useState(0);
	const fetcherRef = useRef(fetcher);
	fetcherRef.current = fetcher;

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		fetcherRef
			.current()
			.then(res => {
				if (cancelled) return;
				setData(((res?.data as T | undefined) ?? null));
			})
			.catch(err => {
				if (cancelled) return;
				setError(extractApiErrorMessage(err, 'Không tải được dữ liệu. Vui lòng thử lại.'));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [key, nonce]);

	const reload = useCallback(() => setNonce(n => n + 1), []);
	return { data: data, loading: loading, error: error, reload: reload };
}

/** Finished attempts per UTC day for the last `days` days, plus all-time streaks. */
export function usePracticeActivity(days: number, enabled = true): AsyncState<UserActivityDto> {
	return useApiData<UserActivityDto>(
		() =>
			enabled
				? ExamPracticeService.examPracticeGatewayControllerGetUserActivityV1(days)
				: Promise.resolve(null),
		`${enabled}:${days}`,
	);
}

/** Per-skill scores and per-tag accuracy over the latest attempts. */
export function useSkillStats(enabled = true): AsyncState<UserSkillStatsDto> {
	return useApiData<UserSkillStatsDto>(
		() =>
			enabled
				? ExamPracticeService.examPracticeGatewayControllerGetUserSkillStatsV1()
				: Promise.resolve(null),
		String(enabled),
	);
}
