import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Mic, PenTool, Sparkles } from 'lucide-react';
import { SpeakingTest } from './SpeakingTest';
import { WritingTest } from './WritingTest';

export function SpeakingWritingPage() {
	const [activeTab, setActiveTab] = useState<'speaking' | 'writing'>('speaking');

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 pb-20">
			{/* ── Hero Header ── */}
			<div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white shadow-lg">
				<div className="absolute inset-0 bg-black/10" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />

				<div className="relative px-6 py-16 max-w-7xl mx-auto text-center flex flex-col items-center">
					<div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md mb-6 inline-block border border-white/10 shadow-xl">
						<Sparkles className="h-10 w-10 text-amber-200" />
					</div>
					<h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-md">
						Phòng Trợ Lý Trí Tuệ Nhân Tạo
					</h1>
					<p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto font-medium">
						Luyện tập thả ga các kỹ năng Speaking và Writing với AI. Nhận phản hồi, đánh giá và đề xuất cải thiện năng lực ngay lập tức.
					</p>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'speaking' | 'writing')} className="flex flex-col -mt-8 relative z-20">
				{/* Tab Bar Floating */}
				<div className="container mx-auto px-4 flex justify-center">
					<TabsList className="bg-white/90 backdrop-blur-xl p-2 rounded-full shadow-2xl border border-gray-100/50 w-fit">
						<TabsTrigger
							value="speaking"
							className="rounded-full px-8 py-3 text-base font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex items-center gap-2"
						>
							<Mic className="h-5 w-5" />
							Giao tiếp (Speaking)
						</TabsTrigger>
						<TabsTrigger
							value="writing"
							className="rounded-full px-8 py-3 text-base font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex items-center gap-2"
						>
							<PenTool className="h-5 w-5" />
							Viết bài (Writing)
						</TabsTrigger>
					</TabsList>
				</div>

				{/* Content */}
				<div className="container mx-auto pt-8">
					<TabsContent value="speaking" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
						<SpeakingTest />
					</TabsContent>
					<TabsContent value="writing" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
						<WritingTest />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}

