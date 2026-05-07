'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
	Mic, Bot, Users, GraduationCap, Sparkles, LineChart, Route,
	UserPlus, ClipboardCheck, BookOpen, MessageSquare, TrendingUp,
	Check, ArrowRight, ArrowDown, MessageCircle, AlertTriangle, TrendingDown,
	Clock, FileText, ShieldAlert, ExternalLink
} from 'lucide-react';

const SPEAKING_SERVER_URL = '#';

/* ════════════════════════════════════════════
   Section: Pain Points
   ════════════════════════════════════════════ */
function PainPointsSection() {
	const stats = [
		{ icon: MessageCircle, value: '70%', label: 'Học sinh Việt Nam thiếu tự tin khi giao tiếp tiếng Anh' },
		{ icon: AlertTriangle, value: '85%', label: 'Không có cơ hội luyện nói với người bản xứ' },
		{ icon: TrendingDown, value: '90%', label: 'Phương pháp truyền thống không cải thiện kỹ năng nói' },
	];

	const issues = [
		{ icon: Users, text: 'Lớp học quá đông – không đủ thời gian luyện nói' },
		{ icon: Clock, text: 'Thiếu phản hồi tức thời về phát âm và ngữ pháp' },
		{ icon: FileText, text: 'Chương trình học tập trung vào lý thuyết, thiếu thực hành' },
		{ icon: ShieldAlert, text: 'Tâm lý sợ sai khiến học sinh ngại giao tiếp' },
	];

	return (
		<section className="py-16 md:py-24 bg-card">
			<div className="max-w-6xl mx-auto px-4 md:px-6 space-y-16">
				<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary text-center">
					Bạn Không Đơn Độc
				</h2>

				<div className="grid md:grid-cols-3 gap-8">
					{stats.map((stat, i) => {
						const Icon = stat.icon;
						return (
							<div key={i} className="flex items-start gap-4 p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
								<div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
									<Icon className="h-6 w-6 text-secondary" />
								</div>
								<div>
									<p className="text-2xl font-bold text-secondary">{stat.value}</p>
									<p className="text-muted-foreground text-sm">{stat.label}</p>
								</div>
							</div>
						);
					})}
				</div>

				<div className="max-w-2xl mx-auto space-y-3">
					<h3 className="text-2xl font-bold text-foreground text-center mb-6">Vấn đề từ hệ thống giáo dục</h3>
					{issues.map((issue, i) => {
						const Icon = issue.icon;
						return (
							<div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/15 transition-colors">
								<div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
									<Icon className="h-5 w-5 text-secondary" />
								</div>
								<p className="font-medium text-foreground text-sm">{issue.text}</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

/* ════════════════════════════════════════════
   Section: Solution (3L Model)
   ════════════════════════════════════════════ */
function SolutionSection() {
	const steps = [
		{ number: '1', title: 'Learn', subtitle: 'Khơi nguồn', desc: 'Chương trình CEFR chuẩn quốc tế, thiết kế bởi chuyên gia ngôn ngữ', icon: GraduationCap, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
		{ number: '2', title: 'Loop', subtitle: 'Luyện tập', desc: 'AI luyện nói 24/7 – phản hồi phát âm, ngữ pháp ngay lập tức', icon: Bot, iconBg: 'bg-secondary/10', iconColor: 'text-secondary' },
		{ number: '3', title: 'Level Up', subtitle: 'Thực chiến', desc: 'Giao tiếp trực tiếp 1-1 với mentor bản ngữ qua video call', icon: Users, iconBg: 'bg-accent/10', iconColor: 'text-accent-foreground' },
	];

	return (
		<section className="py-16 md:py-24 relative overflow-hidden">
			<div className="absolute inset-0 bg-primary/95 z-0" />
			<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30 z-0" />

			<div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12 relative z-10">
				<div className="text-center space-y-4">
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
						<span className="text-accent">3L Model™</span>: Giải Pháp Toàn Diện
					</h2>
					<p className="text-xl text-white/90 max-w-3xl mx-auto">
						Phương pháp kết hợp AI và mentor bản ngữ – được chứng minh hiệu quả
					</p>
				</div>

				<div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0">
					{steps.map((step, index) => (
						<div key={step.number} className="flex flex-col lg:flex-row items-center">
							<div className="relative bg-card p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all hover:-translate-y-1 w-72 md:w-80 h-64 overflow-hidden">
								<span className="absolute left-2 top-1 text-[120px] font-bold text-accent/20 leading-none select-none pointer-events-none">
									{step.number}
								</span>
								<div className="space-y-3 text-center relative z-10">
									<div className="flex items-center justify-center">
										<div className={`w-12 h-12 rounded-xl ${step.iconBg} flex items-center justify-center`}>
											<step.icon className={`h-6 w-6 ${step.iconColor}`} />
										</div>
									</div>
									<h3 className="text-xl font-bold text-foreground">{step.title}</h3>
									<p className="text-sm font-semibold text-foreground">{step.subtitle}</p>
									<p className="text-sm text-muted-foreground">{step.desc}</p>
								</div>
							</div>
							{index < steps.length - 1 && (
								<>
									<div className="hidden lg:flex items-center justify-center px-4">
										<ArrowRight className="h-12 w-12 text-accent animate-pulse" strokeWidth={3} />
									</div>
									<div className="flex lg:hidden items-center justify-center py-3">
										<ArrowDown className="h-12 w-12 text-accent animate-pulse" strokeWidth={3} />
									</div>
								</>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ════════════════════════════════════════════
   Section: Features
   ════════════════════════════════════════════ */
function FeaturesSection() {
	const features = [
		{ icon: GraduationCap, title: 'Chương trình CEFR chuẩn quốc tế', desc: 'Giáo trình được thiết kế theo khung năng lực châu Âu, phù hợp mọi trình độ' },
		{ icon: Sparkles, title: 'Luyện nói với AI 24/7', desc: 'Thực hành giao tiếp bất cứ lúc nào, nhận phản hồi phát âm và ngữ pháp tức thì' },
		{ icon: Users, title: 'Mentor bản ngữ 1-1', desc: 'Giao tiếp trực tiếp với giáo viên bản ngữ qua video call hàng tuần' },
		{ icon: LineChart, title: 'Rise Meter™ theo dõi tiến bộ', desc: 'Hệ thống đo lường năng lực nói theo thời gian thực, trực quan hóa quá trình tiến bộ' },
		{ icon: Route, title: 'Lộ trình cá nhân hóa', desc: 'AI phân tích điểm mạnh/yếu và đề xuất lộ trình luyện tập phù hợp riêng bạn' },
	];

	return (
		<section className="py-16 md:py-24 bg-amber-50/60 dark:bg-muted/30 relative overflow-hidden">
			<div className="absolute -bottom-4 left-0 w-full flex items-end justify-between h-48 px-0 opacity-40">
				{[...Array(60)].map((_, i) => (
					<div
						key={i}
						className="flex-1 mx-px bg-secondary/30 rounded-t-full"
						style={{
							animation: `soundWave 2.5s ease-in-out infinite`,
							animationDelay: `${i * 0.1}s`,
							height: `${40 + Math.random() * 80}px`,
							transformOrigin: 'bottom',
						}}
					/>
				))}
			</div>

			<div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12 relative z-10">
				<div className="text-center space-y-4">
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">Tính Năng Nổi Bật</h2>
					<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
						Mọi thứ bạn cần để tự tin giao tiếp tiếng Anh
					</p>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<div key={index} className="bg-primary p-8 rounded-2xl shadow-sm border border-primary hover:shadow-md transition-all hover:-translate-y-1 group">
								<div className="space-y-4">
									<div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
										<Icon className="h-7 w-7 text-white" />
									</div>
									<h3 className="text-xl font-bold text-white">{feature.title}</h3>
									<p className="text-white/80 leading-relaxed text-sm">{feature.desc}</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

/* ════════════════════════════════════════════
   Section: How It Works (Timeline)
   ════════════════════════════════════════════ */
function HowItWorksSection() {
	const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
	const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

	const steps = [
		{ icon: UserPlus, title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản miễn phí và làm bài kiểm tra đầu vào' },
		{ icon: ClipboardCheck, title: 'Nhận lộ trình cá nhân', desc: 'AI phân tích trình độ và đề xuất chương trình phù hợp' },
		{ icon: BookOpen, title: 'Học theo giáo trình CEFR', desc: 'Theo dõi bài giảng và hoàn thành bài tập tương tác' },
		{ icon: MessageSquare, title: 'Luyện nói với AI', desc: 'Thực hành giao tiếp 24/7, nhận phản hồi phát âm ngay lập tức' },
		{ icon: Users, title: 'Gặp mentor bản ngữ', desc: 'Video call 1-1 hàng tuần để thực chiến giao tiếp thực tế' },
		{ icon: TrendingUp, title: 'Theo dõi Rise Meter™', desc: 'Xem điểm năng lực nói tăng dần qua từng tuần luyện tập' },
	];

	useEffect(() => {
		const observers = stepRefs.current.map((ref, index) => {
			if (!ref) return null;
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							setVisibleSteps((prev) => prev.includes(index) ? prev : [...prev, index]);
						}
					});
				},
				{ threshold: 0.3 }
			);
			observer.observe(ref);
			return observer;
		});
		return () => { observers.forEach((o) => o?.disconnect()); };
	}, []);

	return (
		<section className="py-16 md:py-24 bg-background">
			<div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12">
				<div className="text-center space-y-4">
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">Quy Trình Học Tập</h2>
					<p className="text-xl text-muted-foreground">Từ bước đầu đến thành thạo giao tiếp</p>
				</div>

				<div className="relative">
					<div className="hidden lg:block absolute top-0 left-1/2 w-1 h-full bg-primary -translate-x-1/2" />
					<div className="space-y-8">
						{steps.map((step, index) => {
							const Icon = step.icon;
							const isEven = index % 2 === 0;
							const isVisible = visibleSteps.includes(index);
							return (
								<div
									key={index}
									ref={(el) => { stepRefs.current[index] = el; }}
									className={`flex items-center gap-8 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
								>
									<div className={`flex-1 ${isEven ? 'lg:text-right' : 'lg:text-left'} transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : `opacity-0 ${isEven ? '-translate-x-16' : 'translate-x-16'}`}`}>
										<div className="bg-amber-50/60 dark:bg-muted/40 p-6 rounded-2xl shadow-lg shadow-primary/10 inline-block max-w-md">
											<h3 className="text-xl font-bold text-foreground">{step.title}</h3>
											<p className="text-muted-foreground mt-2">{step.desc}</p>
										</div>
									</div>
									<div className={`relative z-10 flex-shrink-0 transition-all duration-500 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
										<div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
											<Icon className="h-8 w-8 text-white" />
										</div>
										<div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-sm">
											{index + 1}
										</div>
									</div>
									<div className="flex-1 hidden lg:block" />
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}

/* ════════════════════════════════════════════
   Section: Pricing Preview
   ════════════════════════════════════════════ */
function PricingSection() {
	const [tab, setTab] = useState<'cohort' | 'flexible'>('cohort');

	const cohortPlans = [
		{ duration: '6 Tuần', price: '1,800,000 VND', badge: 'Tiết kiệm nhất', features: ['1 buổi học/tuần', 'AI luyện nói giới hạn', 'Rise Meter™ tracking', 'Giáo trình CEFR'] },
		{ duration: '8 Tuần', price: '2,300,000 VND', badge: 'Giá trị tốt nhất', popular: true, features: ['1 buổi học/tuần', 'AI luyện nói không giới hạn', 'Mentor 45 phút/tuần', 'Rise Meter™ tracking', 'Giáo trình CEFR'] },
		{ duration: '12 Tuần', price: '3,200,000 VND', badge: 'Hiệu quả tối đa', features: ['1 buổi học/tuần', 'AI luyện nói không giới hạn', 'Mentor 45 phút x2/tuần', 'Rise Meter™ tracking', 'Giáo trình CEFR'] },
	];

	const flexPlans = [
		{ title: 'Chỉ AI', price: '120,000 VND/tháng', desc: 'Luyện nói với AI không giới hạn', features: ['AI luyện nói 24/7', 'Phản hồi phát âm tức thì', 'Theo dõi tiến bộ'] },
		{ title: 'Chỉ Mentor', price: '150,000 VND/buổi', desc: 'Giao tiếp trực tiếp với mentor bản ngữ', features: ['Buổi học 30 phút', 'Mentor bản ngữ', 'Phản hồi cá nhân hóa'] },
		{ title: 'Combo', price: '350,000 VND/tháng', desc: 'AI + Mentor – trọn gói tốt nhất', popular: true, features: ['AI luyện nói 24/7', '4 buổi mentor/tháng', 'Theo dõi toàn diện'] },
	];

	const plans = tab === 'cohort' ? cohortPlans : flexPlans;

	return (
		<section className="py-16 md:py-24 bg-muted/30">
			<div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12">
				<div className="text-center space-y-4">
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">Bảng Giá</h2>
					<p className="text-xl text-muted-foreground">Chọn gói phù hợp với nhu cầu của bạn</p>
				</div>

				<div className="flex justify-center">
					<div className="bg-card rounded-full p-1 border shadow-sm inline-flex">
						<button onClick={() => setTab('cohort')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${tab === 'cohort' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Khóa học theo nhóm</button>
						<button onClick={() => setTab('flexible')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${tab === 'flexible' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Linh hoạt</button>
					</div>
				</div>

				<div className="grid md:grid-cols-3 gap-6">
					{plans.map((plan: any, index: number) => (
						<div key={index} className={`bg-card p-8 rounded-2xl shadow-md border-2 relative transition-all hover:-translate-y-1 hover:shadow-lg ${'popular' in plan && plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border'}`}>
							{'badge' in plan && plan.badge && (
								<div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
									{plan.badge}
								</div>
							)}
							<div className="space-y-6">
								<div>
									<h3 className="text-2xl font-bold mb-2">{plan.duration || plan.title}</h3>
									<div className={`text-2xl font-bold ${'popular' in plan && plan.popular ? 'text-primary' : 'text-secondary'}`}>{plan.price}</div>
									{'desc' in plan && <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>}
								</div>
								<ul className="space-y-3">
									{(plan.features as string[]).map((f: string, idx: number) => (
										<li key={idx} className="flex items-start gap-2">
											<Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
											<span className="text-sm">{f}</span>
										</li>
									))}
								</ul>
								<a
									href={SPEAKING_SERVER_URL}
									target="_blank"
									rel="noopener noreferrer"
									className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${'popular' in plan && plan.popular ? 'bg-primary text-white hover:bg-primary/90' : 'border border-border text-foreground hover:bg-muted'}`}
								>
									Đăng ký ngay <ExternalLink className="h-4 w-4" />
								</a>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ════════════════════════════════════════════
   Section: Final CTA
   ════════════════════════════════════════════ */
function CTASection() {
	return (
		<section className="py-24 bg-primary relative overflow-hidden">
			<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
			<div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10 text-center space-y-8">
				<div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-medium">
					<Users className="h-4 w-4" />
					<span>Số lượng có hạn – Đăng ký ngay!</span>
				</div>
				<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
					Sẵn Sàng Tự Tin Giao Tiếp?
				</h2>
				<p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
					Bắt đầu hành trình chinh phục kỹ năng nói tiếng Anh cùng AI và mentor bản ngữ
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
					<a
						href={SPEAKING_SERVER_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-white/95 text-lg h-14 px-8 rounded-lg font-semibold shadow-xl shadow-black/15 border border-white/70 transition-all group"
					>
						Bắt đầu ngay
						<ArrowRight className="group-hover:translate-x-1 transition-transform" />
					</a>
					<a
						href={SPEAKING_SERVER_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg h-14 px-8 rounded-lg font-semibold transition-colors"
					>
						Tư vấn miễn phí
					</a>
				</div>
				<p className="text-sm text-white/80 pt-4">
					✓ Không cần thẻ tín dụng &nbsp; ✓ Học thử miễn phí &nbsp; ✓ Hủy bất cứ lúc nào
				</p>
			</div>
		</section>
	);
}

/* ════════════════════════════════════════════
   Main Export
   ════════════════════════════════════════════ */
export function SpeakingPromoLanding() {
	return (
		<div className="space-y-0">
			<PainPointsSection />
			<SolutionSection />
			<FeaturesSection />
			<HowItWorksSection />
			<PricingSection />
			<CTASection />
		</div>
	);
}
