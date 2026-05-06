'use client';

import React from 'react';
import { Sparkles, ArrowRight, Mic, PenTool, ExternalLink } from 'lucide-react';
import { SpeakingPromoLanding } from './SpeakingPromoLanding';
import { WritingTest } from './WritingTest';
import Link from 'next/link';

const SPEAKING_SERVER_URL = '#';

interface Props {
	mode: 'speaking' | 'writing';
}

export function SpeakingWritingPage({ mode }: Props) {
	const isSpeaking = mode === 'speaking';

	return (
		<div className="min-h-screen bg-background pb-20">
			{/* ── Hero Header ── */}
			<div className="relative overflow-hidden bg-primary text-white shadow-lg">
				<div className="absolute inset-0 bg-black/10" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-blob-morph" />
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 animate-blob-morph-alt" />
				<div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

				<div className="relative px-6 py-20 md:py-28 max-w-7xl mx-auto text-center flex flex-col items-center">
					<div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md mb-6 inline-block border border-white/10 shadow-xl animate-float">
						<Sparkles className="h-10 w-10 text-amber-200" />
					</div>

					{isSpeaking ? (
						<>
							<h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-md animate-fade-in">
								Nâng Tầm Kỹ Năng Giao Tiếp
							</h1>
							<p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto font-medium mb-8 animate-fade-in animate-delay-100">
								Luyện tập Speaking với <span className="text-accent font-bold">AI</span> và{' '}
								<span className="text-accent font-bold">Mentor bản ngữ</span> — phương pháp được chứng minh hiệu quả.
							</p>
							<a
								href={SPEAKING_SERVER_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 bg-white text-primary hover:bg-white/95 px-8 py-3 rounded-full font-bold text-lg shadow-xl shadow-black/15 transition-all group animate-fade-in animate-delay-200"
							>
								Trải nghiệm LingriserSpeaking
								<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
							</a>
						</>
					) : (
						<>
							<h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-md animate-fade-in">
								Phòng Luyện Viết AI
							</h1>
							<p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto font-medium mb-8 animate-fade-in animate-delay-100">
								Rèn luyện kỹ năng Writing với phản hồi AI tức thì. Đánh giá, nhận xét và gợi ý cải thiện ngay lập tức.
							</p>
						</>
					)}
				</div>
			</div>

			{/* ── Navigation Pills ── */}
			<div className="container mx-auto px-4 flex justify-center -mt-6 relative z-20">
				<div className="bg-white/90 dark:bg-card/90 backdrop-blur-xl p-2 rounded-full shadow-2xl border border-gray-100/50 dark:border-border w-fit flex">
					<Link
						href="/speaking"
						className={`rounded-full px-8 py-3 text-base font-semibold transition-all flex items-center gap-2 ${
							isSpeaking
								? 'bg-primary text-white shadow-md'
								: 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
						}`}
					>
						<Mic className="h-5 w-5" />
						Luyện Nói
					</Link>
					<Link
						href="/writing"
						className={`rounded-full px-8 py-3 text-base font-semibold transition-all flex items-center gap-2 ${
							!isSpeaking
								? 'bg-secondary text-white shadow-md'
								: 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
						}`}
					>
						<PenTool className="h-5 w-5" />
						Viết Bài
					</Link>
				</div>
			</div>

			{/* ── Content ── */}
			<div className="w-full pt-8">
				{isSpeaking ? (
					<SpeakingPromoLanding />
				) : (
					<div className="container mx-auto">
						{/* Upsell Banner */}
						<div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-center gap-4">
							<div className="flex-1">
								<p className="font-bold text-foreground text-lg">🎤 Nâng cấp trải nghiệm với LingriserSpeaking</p>
								<p className="text-muted-foreground text-sm mt-1">
									Đăng ký khóa Speaking để mở khóa đầy đủ tính năng Writing + luyện nói AI + mentor bản ngữ.
								</p>
							</div>
							<a
								href={SPEAKING_SERVER_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors flex-shrink-0"
							>
								Tìm hiểu thêm <ExternalLink className="h-4 w-4" />
							</a>
						</div>
						<WritingTest />
					</div>
				)}
			</div>
		</div>
	);
}
