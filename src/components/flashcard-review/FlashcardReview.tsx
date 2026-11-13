'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Brain, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppSelector, useIsStoreHydrated } from '@/lib/store/hooks';
import {
	buildRestartQueue,
	createSession,
	reviewReducer,
	type ReviewAction,
	type ReviewSession,
} from '@/lib/flashcard-review/session';
import { clearSession, loadSession, saveSession } from '@/lib/flashcard-review/storage';
import type { ReviewCard, ReviewSettings } from '@/lib/flashcard-review/types';
import { ReviewPlay } from './ReviewPlay';
import { ReviewSetup } from './ReviewSetup';
import { ReviewSummary } from './ReviewSummary';

type View = 'boot' | 'setup' | 'session';

export function FlashcardReview() {
	const router = useRouter();
	const params = useSearchParams();
	const preselectId = params?.get('list') ?? undefined;
	const currentUser = useAppSelector(state => state.currUser.current);
	const isHydrated = useIsStoreHydrated();
	const userId: string | undefined = currentUser?.id;

	const [view, setView] = useState<View>('boot');
	const [session, setSession] = useState<ReviewSession | null>(null);
	/** A stored, unfinished session the setup screen offers to resume. */
	const [stored, setStored] = useState<ReviewSession | null>(null);
	const [lastSettings, setLastSettings] = useState<ReviewSettings | undefined>();
	const [startError, setStartError] = useState('');

	useEffect(() => {
		if (isHydrated && !currentUser) router.push('/auth');
	}, [isHydrated, currentUser, router]);

	// pick up a session that survived a refresh
	useEffect(() => {
		if (!userId || view !== 'boot') return;
		const saved = loadSession(userId);
		if (saved && !preselectId) {
			setSession(saved);
			setView('session');
		} else {
			setStored(saved && saved.phase !== 'summary' ? saved : null);
			setLastSettings(saved?.settings);
			setView('setup');
		}
	}, [userId, view, preselectId]);

	useEffect(() => {
		if (session) saveSession(session);
	}, [session]);

	// a new card or round starts at the top of the page
	useEffect(() => {
		if (view === 'session') window.scrollTo({ top: 0 });
	}, [view, session?.index, session?.round]);

	const dispatch = useCallback((action: ReviewAction) => {
		setSession(s => (s ? reviewReducer(s, action) : s));
	}, []);

	/** Leaves `?list=` behind so a refresh resumes the session instead of the setup. */
	const enterSession = (s: ReviewSession) => {
		setSession(s);
		setStored(null);
		setView('session');
		if (preselectId) router.replace('/flashcards/review');
	};

	const start = (cards: ReviewCard[], settings: ReviewSettings) => {
		if (!userId) return;
		const s = createSession(userId, cards, settings, Math.random);
		if (!s) {
			setStartError('Không có thẻ nào phù hợp để ôn tập.');
			return;
		}
		setStartError('');
		enterSession(s);
	};

	const backToSetup = () => {
		if (session) setLastSettings(session.settings);
		clearSession();
		setSession(null);
		setStored(null);
		setView('setup');
	};

	const restart = () => {
		if (!session) return;
		dispatch({ type: 'restart', queue: buildRestartQueue(session, Math.random) });
	};

	if (!isHydrated || !currentUser || !userId || view === 'boot') {
		return (
			<div className="flex min-h-[50vh] items-center justify-center text-slate-500" role="status">
				<Loader2 className="mr-2 h-5 w-5 motion-safe:animate-spin" aria-hidden /> Đang tải…
			</div>
		);
	}

	const playing = view === 'session' && session && session.phase !== 'summary';

	return (
		<div className="min-h-screen bg-slate-50/50 pb-20">
			<div className={`relative mb-6 border-b border-slate-200 bg-white ${playing ? 'py-3' : 'pb-8 pt-5'}`}>
				<div className="absolute inset-0 bg-primary/5 pointer-events-none" aria-hidden />
				<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<Button
						variant="ghost"
						onClick={() => router.push(preselectId ? `/flashcards/${preselectId}` : '/flashcards')}
						className="-ml-2 gap-2 font-semibold text-slate-500 hover:text-primary"
					>
						<ArrowLeft className="h-4 w-4" aria-hidden /> Flashcards
					</Button>
					{!playing && (
						<div className="mt-3 flex items-center gap-4">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<Brain className="h-6 w-6" aria-hidden />
							</div>
							<div>
								<h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">Ôn tập flashcards</h1>
								<p className="text-sm font-medium text-slate-500">
									Xem một mặt của thẻ, gõ mặt còn lại, rồi so sánh với nội dung đã lưu.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{view === 'setup' && (
				<>
					{startError && (
						<p role="alert" className="mx-auto mb-4 max-w-6xl px-4 text-sm font-medium text-rose-600 sm:px-6 lg:px-8">
							{startError}
						</p>
					)}
					<ReviewSetup
						userId={userId}
						preselectId={preselectId}
						initialSettings={lastSettings}
						resumable={stored ? { position: Math.min(stored.index + 1, stored.queue.length), total: stored.queue.length } : null}
						onResume={() => stored && enterSession(stored)}
						onStart={start}
					/>
				</>
			)}

			{view === 'session' && session && session.phase !== 'summary' && (
				<ReviewPlay
					session={session}
					userId={userId}
					dispatch={dispatch}
					onExit={() => {
						if (window.confirm('Kết thúc lượt ôn tập này? Tiến độ hiện tại sẽ không được lưu.')) backToSetup();
					}}
				/>
			)}

			{view === 'session' && session && session.phase === 'summary' && (
				<ReviewSummary
					session={session}
					onRestart={restart}
					onChooseOther={backToSetup}
				/>
			)}
		</div>
	);
}
