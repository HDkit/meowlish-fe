import { Brain } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { LoadingRegion } from '../skeletons';

/** Review page shell (header + setup columns) shown before the store and session are restored. */
export function ReviewPageSkeleton() {
	return (
		<LoadingRegion label="Đang tải ôn tập…" className="min-h-screen bg-slate-50/50 pb-20">
			<div className="relative mb-6 border-b border-slate-200 bg-white pb-8 pt-5">
				<div className="absolute inset-0 bg-primary/5 pointer-events-none" aria-hidden />
				<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<Skeleton className="h-9 w-32" />
					<div className="mt-3 flex items-center gap-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<Brain className="h-6 w-6" aria-hidden />
						</div>
						<div>
							<p className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl" aria-hidden>Ôn tập flashcards</p>
							<p className="text-sm font-medium text-slate-500" aria-hidden>
								Xem một mặt của thẻ, gõ mặt còn lại, rồi so sánh với nội dung đã lưu.
							</p>
						</div>
					</div>
				</div>
			</div>
			<div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
				<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
					<Skeleton className="mb-4 h-7 w-36" />
					<Skeleton className="mb-5 h-11 w-full rounded-xl" />
					<ReviewListRowsSkeleton />
				</div>
				<div className="space-y-6">
					<div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
						<Skeleton className="h-7 w-32" />
						<Skeleton className="mb-2 h-4 w-full" />
						{Array.from({ length: 3 }, (_, i) => (
							<Skeleton key={i} className="h-[58px] w-full rounded-xl" />
						))}
					</div>
					<Skeleton className="h-[120px] w-full rounded-2xl" />
					<Skeleton className="h-[148px] w-full rounded-2xl" />
				</div>
			</div>
		</LoadingRegion>
	);
}

/** Rows shaped like the list picker's checkbox rows. */
export function ReviewListRowsSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<div className="space-y-2" aria-hidden>
			{Array.from({ length: rows }, (_, i) => (
				<div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
					<Skeleton className="size-4 shrink-0 rounded-sm" />
					<div className="flex-1 space-y-1.5">
						<Skeleton className={i % 2 ? 'h-4 w-1/2' : 'h-4 w-2/3'} />
						<Skeleton className="h-3 w-1/3" />
					</div>
					<Skeleton className="h-5 w-12 rounded-full" />
				</div>
			))}
		</div>
	);
}
