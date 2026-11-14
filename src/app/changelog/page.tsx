import type { Metadata } from 'next';
import { TriangleAlert } from 'lucide-react';
import { LandingNavbar } from '@/components/LandingNavbar';
import { ReleaseChanges, ReleaseHeader } from '@/components/changelog/ReleaseNotes';
import { CURRENT_VERSION, RELEASES } from '@/lib/changelog';
import { AI_SERVICE_NOTICE, AI_SERVICE_OPERATIONAL } from '@/lib/service-status';

export const metadata: Metadata = {
	title: 'Có gì mới',
	description: 'Lịch sử cập nhật của Lingriser: tính năng mới, cải thiện và sửa lỗi qua từng phiên bản.',
};

export default function ChangelogPage() {
	return (
		<div className='min-h-screen'>
			<LandingNavbar />
			<main className='container mx-auto max-w-3xl px-4 py-10 md:py-14'>
				<header className='mb-8'>
					<p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary'>Nhật ký cập nhật</p>
					<h1 className='mt-2 text-3xl font-bold text-foreground md:text-4xl'>Có gì mới ở Lingriser</h1>
					<p className='mt-3 text-sm text-muted-foreground md:text-base'>
						Phiên bản hiện tại: <span className='font-semibold text-foreground'>v{CURRENT_VERSION}</span> ·{' '}
						{RELEASES.length} bản phát hành
					</p>
				</header>

				{!AI_SERVICE_OPERATIONAL && (
					<section
						aria-labelledby='ai-status-title'
						className='mb-10 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950'
					>
						<TriangleAlert className='mt-0.5 h-5 w-5 shrink-0 text-amber-600' aria-hidden='true' />
						<div>
							<h2 id='ai-status-title' className='font-semibold'>
								{AI_SERVICE_NOTICE.title}
							</h2>
							<p className='mt-1 text-sm leading-relaxed'>{AI_SERVICE_NOTICE.message}</p>
							<p className='mt-1 text-sm italic text-amber-800/80'>{AI_SERVICE_NOTICE.english}</p>
						</div>
					</section>
				)}

				<ol className='relative space-y-10 border-l border-border pl-6'>
					{RELEASES.map((release, i) => (
						<li key={release.version} id={`v${release.version}`} className='relative'>
							<span
								aria-hidden='true'
								className='absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary shadow'
							/>
							<article className='rounded-2xl border border-border/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6'>
								<ReleaseHeader release={release} isLatest={i === 0} />
								<h2 className='mt-3 text-xl font-semibold text-foreground'>{release.title}</h2>
								{release.summary && <p className='mt-1 text-sm text-muted-foreground'>{release.summary}</p>}
								<div className='mt-4'>
									<ReleaseChanges release={release} />
								</div>
							</article>
						</li>
					))}
				</ol>
			</main>
		</div>
	);
}
