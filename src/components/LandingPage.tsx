'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
	BookOpen,
	Brain,
	Target,
	Users,
	TrendingUp,
	Award,
	Clock,
	BarChart,
	CheckCircle,
	Star,
	ArrowRight,
	Play,
} from 'lucide-react';

export function LandingPage() {
	const router = useRouter();
	const onGetStarted = () => router.push('/auth?mode=register');
	const onLogin = () => router.push('/auth');

	return (
		<div className='min-h-screen bg-background font-sans overflow-hidden'>
			{/* Hero Section */}
			<section className='relative pt-24 pb-20 md:pt-32 md:pb-32 lg:pt-40 lg:pb-40'>
				<div className='absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10'></div>
				{/* Animated Background Blobs */}
				<div className='absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-blob-morph'></div>
				<div className='absolute top-40 right-20 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-blob-morph-alt animation-delay-2000'></div>
				<div className='absolute -bottom-10 left-1/3 w-80 h-80 bg-secondary/15 rounded-full blur-3xl animate-blob-morph animation-delay-4000'></div>

				<div className='container relative z-10 mx-auto px-4 md:px-6 lg:px-8 text-center'>
					<h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-foreground drop-shadow-sm'>
						Chinh phục IELTS &amp; TOEIC
						<br />
						với <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">trí tuệ nhân tạo</span>
					</h1>
					<p className='text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto px-4 leading-relaxed font-medium'>
						Hệ thống luyện thi tiếng Anh chuẩn mực với công nghệ AI chấm điểm tự động. Xây dựng lộ trình cá nhân hóa, dự đoán điểm số và giúp bạn đạt mục tiêu nhanh hơn gấp 3 lần.
					</p>
					<div className='flex flex-col sm:flex-row gap-4 justify-center mb-16 px-4'>
						<Button size='lg' onClick={onGetStarted} className='text-lg px-8 py-7 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-[0_8px_30px_hsl(144_46%_55%/0.24)] hover:shadow-[0_8px_30px_hsl(144_46%_55%/0.4)] transition-all hover:-translate-y-1 w-full sm:w-auto font-bold'>
							Bắt đầu học ngay
							<ArrowRight className='ml-2 h-5 w-5' />
						</Button>
						<Button size='lg' variant='outline' className='text-lg px-8 py-7 rounded-2xl border-2 border-border text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all w-full sm:w-auto font-bold bg-white/50 backdrop-blur-sm'>
							<Play className='mr-2 h-5 w-5' />
							Xem video demo
						</Button>
					</div>

					{/* Hero Image / Dashboard Preview */}
					<div className='w-full mx-auto max-w-6xl px-4 md:px-0 relative'>
						<div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 h-32 bottom-0 top-auto pointer-events-none"></div>
						<div className="relative rounded-2xl ring-1 ring-gray-900/5 bg-white shadow-2xl overflow-hidden p-2">
							<ImageWithFallback
								src='https://vinuni.edu.vn/wp-content/uploads/2024/08/bang-toeic-va-ielts-cai-nao-tot-hon-su-phu-hop-voi-muc-tieu-cua-ban.jpg'
								alt='EnglishPrep Platform Dashboard'
								className='w-full rounded-xl object-cover h-[400px] md:h-[600px] opacity-90 hover:opacity-100 transition-opacity'
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Statistics */}
			<section className='py-8 md:py-12 bg-background relative -mt-16 z-20'>
				<div className='container mx-auto px-4 md:px-6 lg:px-8'>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center'>
						<div className='p-8 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 transition-transform'>
							<div className='text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary mb-2'>98%</div>
							<p className='text-muted-foreground font-medium text-sm md:text-base tracking-wide'>TỶ LỆ CẢI THIỆN ĐIỂM</p>
						</div>
						<div className='p-8 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 transition-transform'>
							<div className='text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary mb-2'>50K+</div>
							<p className='text-muted-foreground font-medium text-sm md:text-base tracking-wide'>HỌC VIÊN TÍN NHIỆM</p>
						</div>
						<div className='p-8 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 transition-transform'>
							<div className='text-3xl md:text-4xl lg:text-5xl font-extrabold text-secondary mb-2'>1.2M+</div>
							<p className='text-muted-foreground font-medium text-sm md:text-base tracking-wide'>BÀI THI ĐÃ CHẤM</p>
						</div>
						<div className='p-8 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 transition-transform'>
							<div className='text-3xl md:text-4xl lg:text-5xl font-extrabold text-accent mb-2'>7.5+</div>
							<p className='text-muted-foreground font-medium text-sm md:text-base tracking-wide'>ĐIỂM TRUNG BÌNH THỰC TẾ</p>
						</div>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className='py-20 md:py-28 bg-[#fff6dc]'>
				<div className='container mx-auto px-4 md:px-6 lg:px-8'>
					<div className='text-center mb-16 md:mb-20'>
						<h2 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground tracking-tight'>
							Giải pháp <span className='text-primary'>toàn diện</span>
						</h2>
						<p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
							Công nghệ định hình lại phương pháp tự học. Mang đến cho bạn trải nghiệm luyện thi như có Gia Sư 1 kèm 1 bên cạnh.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
						{[
							{ icon: Brain, title: "AI Chấm Mốc Nhanh Chóng", desc: "Chấm điểm Writing & Speaking chỉ trong 5 giây với độ chính xác theo barem chuẩn.", bgIcon: "bg-primary/15", textIcon: "text-primary" },
							{ icon: Target, title: "Cá Nhân Hóa Đề Trắc Nghiệm", desc: "Thuật toán tự động tìm ra điểm yếu và xoáy sâu bài tập vào các kỹ năng còn kém.", bgIcon: "bg-secondary/15", textIcon: "text-secondary" },
							{ icon: BarChart, title: "Biểu Đồ Theo Dõi Tiến Độ", desc: "Báo cáo năng lực đa chiều, dự báo điểm thi tương lai để bạn tự tin đăng ký lịch thi.", bgIcon: "bg-accent/15", textIcon: "text-accent" },
							{ icon: BookOpen, title: "Kho Tàng Đề Khổng Lồ", desc: "+20,000 bài tập cập nhật xu hướng ra đề mới nhất từ các nhà xuất bản hàng đầu.", bgIcon: "bg-primary/15", textIcon: "text-primary" },
							{ icon: Clock, title: "Giao Diện Giả Lập Thi Thật", desc: "Ép thời gian, tắt hỗ trợ ngôn ngữ. Vượt qua tâm lý hoảng loạn trong phòng thi thật.", bgIcon: "bg-secondary/15", textIcon: "text-secondary" },
							{ icon: Users, title: "Xếp Hạng & Thi Đua", desc: "Hệ thống Bảng Xếp Hạng khơi dậy tinh thần tranh đua lành mạnh giữa hàng ngàn User.", bgIcon: "bg-accent/15", textIcon: "text-accent" },
						].map((feature, idx) => {
							const Icon = feature.icon;
							return (
								<Card key={idx} className='p-8 border-0 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group'>
									<div className={`w-14 h-14 rounded-2xl ${feature.bgIcon} flex items-center justify-center mb-6`}>
										<Icon className={`h-7 w-7 ${feature.textIcon}`} />
									</div>
									<h3 className='text-xl font-bold mb-3 text-foreground'>{feature.title}</h3>
									<p className='text-muted-foreground font-medium leading-relaxed'>{feature.desc}</p>
									<div className='absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-primary/10'></div>
								</Card>
							)
						})}
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className='py-12 md:py-16 lg:py-20 bg-[#fff6dc]'>
				<div className='container mx-auto px-4 md:px-6 lg:px-8'>
					<div className='text-center mb-10 md:mb-12 lg:mb-16'>
						<h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-foreground'>Cách thức hoạt động</h2>
						<p className='text-base md:text-lg lg:text-xl text-muted-foreground px-4'>
							3 bước đơn giản để bắt đầu hành trình chinh phục IELTS &amp; TOEIC
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8'>
						<div className='text-center p-4 md:p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-primary/10 to-white hover:scale-105 transform border-2 border-transparent hover:border-primary/30'>
							<div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4 md:mb-6 shadow-2xl ring-4 ring-primary/20 hover:ring-primary/30 transition-all'>
								1
							</div>
							<h3 className='text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>Đánh giá trình độ</h3>
							<p className='text-sm md:text-base text-muted-foreground px-2 leading-relaxed'>
								Làm bài test đầu vào để AI phân tích chính xác trình độ hiện tại của bạn
							</p>
						</div>
						<div className='text-center p-4 md:p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-secondary/10 to-white hover:scale-105 transform border-2 border-transparent hover:border-secondary/30'>
							<div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/70 text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4 md:mb-6 shadow-2xl ring-4 ring-secondary/20 hover:ring-secondary/30 transition-all'>
								2
							</div>
							<h3 className='text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent'>Luyện thi cá nhân hóa</h3>
							<p className='text-sm md:text-base text-muted-foreground px-2 leading-relaxed'>
								AI tạo lộ trình học tập riêng với các bài thi phù hợp với trình độ và mục tiêu
							</p>
						</div>
						<div className='text-center p-4 md:p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-accent/10 to-white hover:scale-105 transform border-2 border-transparent hover:border-accent/30'>
							<div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-accent via-accent/90 to-accent/70 text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4 md:mb-6 shadow-2xl ring-4 ring-accent/20 hover:ring-accent/30 transition-all'>
								3
							</div>
							<h3 className='text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent'>Đạt mục tiêu</h3>
							<p className='text-sm md:text-base text-muted-foreground px-2 leading-relaxed'>
								Theo dõi tiến độ và điều chỉnh chiến lược để đạt band điểm mong muốn
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section className='py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-muted'>
				<div className='container mx-auto px-4 md:px-6 lg:px-8'>
					<div className='text-center mb-10 md:mb-12 lg:mb-16'>
						<h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-foreground'>
							<span className='bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'>Học viên</span>{' '}
							<span className='bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent'>nói gì về chúng tôi</span>
						</h2>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8'>
						<Card className='border-2 hover:border-primary/30 hover:shadow-xl transition-all bg-gradient-to-br from-primary/5 to-white'>
							<CardContent className='pt-6'>
								<div className='flex mb-4'>
									{[...Array(5)].map((_, i) => (
										<Star key={i} className='h-5 w-5 fill-yellow-400 text-yellow-400' />
									))}
								</div>
								<p className='text-muted-foreground mb-4'>
									"Tôi đã tăng từ 6.0 lên 8.5 IELTS chỉ trong 3 tháng. AI chấm Speaking rất chính xác và phản hồi chi
									tiết giúp tôi cải thiện nhanh chóng."
								</p>
								<div className='flex items-center'>
									<div>
										<p className='font-semibold text-foreground'>Nguyễn Minh Anh</p>
										<p className='text-sm text-muted-foreground'>Du học sinh tại Canada</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className='border-2 hover:border-secondary/30 hover:shadow-xl transition-all bg-gradient-to-br from-secondary/5 to-white'>
							<CardContent className='pt-6'>
								<div className='flex mb-4'>
									{[...Array(5)].map((_, i) => (
										<Star key={i} className='h-5 w-5 fill-yellow-400 text-yellow-400' />
									))}
								</div>
								<p className='text-muted-foreground mb-4'>
									"TOEIC 985/990! Ngân hàng đề của EnglishAI Pro rất sát với đề thi thật. Chức năng luyện theo thời gian
									giúp tôi quản lý thời gian tốt hơn."
								</p>
								<div className='flex items-center'>
									<div>
										<p className='font-semibold text-foreground'>Trần Quốc Bảo</p>
										<p className='text-sm text-muted-foreground'>Nhân viên tập đoàn đa quốc gia</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className='border-2 hover:border-accent/30 hover:shadow-xl transition-all bg-gradient-to-br from-accent/5 to-white'>
							<CardContent className='pt-6'>
								<div className='flex mb-4'>
									{[...Array(5)].map((_, i) => (
										<Star key={i} className='h-5 w-5 fill-yellow-400 text-yellow-400' />
									))}
								</div>
								<p className='text-muted-foreground mb-4'>
									"Là giáo viên tiếng Anh, tôi khuyên dùng nền tảng này cho học sinh. Phân tích chi tiết giúp họ biết
									chính xác cần cải thiện ở đâu."
								</p>
								<div className='flex items-center'>
									<div>
										<p className='font-semibold text-foreground'>Phạm Thu Hà</p>
										<p className='text-sm text-muted-foreground'>Giáo viên IELTS</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='relative py-20 lg:py-32 bg-primary overflow-hidden'>
				<div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
				<div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-secondary rounded-full blur-[100px] opacity-50 translate-x-1/2 -translate-y-1/2"></div>
				<div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-accent rounded-full blur-[100px] opacity-40 -translate-x-1/3 translate-y-1/3"></div>

				<div className='relative z-10 container px-4 mx-auto text-center'>
					<h2 className='text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tight'>Tương lai của bạn bắt đầu ở đây</h2>
					<p className='text-lg md:text-xl mb-10 text-primary-foreground/80 px-4 font-medium max-w-2xl mx-auto'>Đừng để ngoại ngữ là rào cản. Hãy đăng ký ngay hôm nay để trải nghiệm miễn phí 10 bài test toàn diện.</p>

					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<Button size='lg' onClick={onGetStarted} className='text-lg px-8 py-7 rounded-2xl bg-white text-primary hover:bg-white/90 shadow-xl transition-all font-bold'>
							Tạo tài khoản miễn phí
							<ArrowRight className='ml-2 h-5 w-5' />
						</Button>
						<Button size='lg' variant='outline' onClick={onLogin} className='text-lg px-8 py-7 rounded-2xl border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all font-bold'>
							Đăng nhập
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='py-8 md:py-10 lg:py-12 bg-gray-900 text-white'>
				<div className='container mx-auto px-4 md:px-6 lg:px-8'>
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8'>
						<div>
							<div className='flex items-center space-x-2 mb-4'>
								<Brain className='h-6 w-6' />
								<span className='text-lg font-semibold'>EnglishAI Pro</span>
							</div>
							<p className='text-gray-400 text-sm'>
								Nền tảng luyện thi tiếng Anh thông minh với AI, giúp bạn đạt band điểm mơ ước.
							</p>
						</div>
						<div>
							<h4 className='font-semibold mb-4'>Sản phẩm</h4>
							<ul className='space-y-2 text-sm text-gray-400'>
								<li>Luyện thi IELTS</li>
								<li>Luyện thi TOEIC</li>
								<li>AI Chấm điểm</li>
								<li>Phân tích kết quả</li>
							</ul>
						</div>
						<div>
							<h4 className='font-semibold mb-4'>Hỗ trợ</h4>
							<ul className='space-y-2 text-sm text-gray-400'>
								<li>Trung tâm trợ giúp</li>
								<li>Liên hệ</li>
								<li>Cộng đồng</li>
								<li>Blog</li>
							</ul>
						</div>
						<div>
							<h4 className='font-semibold mb-4'>Công ty</h4>
							<ul className='space-y-2 text-sm text-gray-400'>
								<li>Về chúng tôi</li>
								<li>Tuyển dụng</li>
								<li>Chính sách</li>
								<li>Điều khoản</li>
							</ul>
						</div>
					</div>
					<div className='border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400'>
						<p>&copy; 2025 EnglishAI Pro. Tất cả quyền được bảo lưu.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
