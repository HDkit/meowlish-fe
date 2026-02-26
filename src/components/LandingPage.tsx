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
		<div className='min-h-screen bg-background'>
			{/* Hero Section */}
			<section className='py-12 md:py-16 lg:py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
				<div className='container mx-auto px-4 md:px-6 lg:px-8 text-center'>
					<h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight'>
						Chinh phục IELTS & TOEIC
						<br />
						với trí tuệ nhân tạo
					</h1>
					<p className='text-base md:text-lg lg:text-xl text-slate-600 mb-6 md:mb-8 max-w-3xl mx-auto px-4'>
						Hệ thống luyện thi tiếng Anh thông minh với AI chấm điểm tự động, tạo đề thi thích ứng và phản hồi cá nhân
						hóa. Nâng cao band điểm của bạn một cách hiệu quả.
					</p>
					<div className='flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 px-4'>
						<Button size='lg' onClick={onGetStarted} className='text-base md:text-lg px-6 md:px-8 py-4 md:py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto'>
							Bắt đầu học miễn phí
							<ArrowRight className='ml-2 h-4 md:h-5 w-4 md:w-5' />
						</Button>
						<Button size='lg' variant='outline' className='text-base md:text-lg px-6 md:px-8 py-4 md:py-6 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 w-full sm:w-auto'>
							<Play className='mr-2 h-4 md:h-5 w-4 md:w-5' />
							Xem demo
						</Button>
					</div>

					{/* Hero Image */}
					<div className='w-full mx-auto max-w-5xl px-4 md:px-0'>
						<ImageWithFallback
							src='https://vinuni.edu.vn/wp-content/uploads/2024/08/bang-toeic-va-ielts-cai-nao-tot-hon-su-phu-hop-voi-muc-tieu-cua-ban.jpg'
							alt='Students studying for English exams'
							className='w-full rounded-lg md:rounded-xl shadow-lg'
						/>
					</div>
				</div>
			</section>

			{/* Statistics */}
			<section className='py-10 md:py-12 lg:py-16 bg-white'>
				<div className='container mx-auto px-4 md:px-6 lg:px-8'>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8 text-center'>
						<div className='p-4 md:p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow'>
							<div className='text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1 md:mb-2'>98%</div>
							<p className='text-slate-600 font-medium'>Tỷ lệ cải thiện điểm</p>
						</div>
						<div className='p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow'>
							<div className='text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2'>50K+</div>
							<p className='text-slate-600 font-medium'>Học viên tin tưởng</p>
						</div>
						<div className='p-6 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 hover:shadow-lg transition-shadow'>
							<div className='text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent mb-2'>1.2M+</div>
							<p className='text-slate-600 font-medium'>Bài thi đã hoàn thành</p>
						</div>
						<div className='p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow'>
							<div className='text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2'>8.5</div>
							<p className='text-slate-600 font-medium'>Điểm IELTS trung bình</p>
						</div>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className='py-12 md:py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white'>
				<div className='container mx-auto px-4 md:px-6 lg:px-8'>
					<div className='text-center mb-10 md:mb-12 lg:mb-16'>
					<h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-gray-900'>
						<span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>Tính năng</span>{' '}
						<span className='bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>đột phá</span>
					</h2>
						<p className='text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-4'>
							Công nghệ AI tiên tiến giúp bạn học hiệu quả gấp 3 lần so với phương pháp truyền thống
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
						<Card className='text-center hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-400 bg-gradient-to-br from-blue-50 via-blue-100/50 to-white hover:scale-105 transform'>
							<CardHeader>
								<div className='w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl hover:shadow-2xl transition-shadow animate-pulse'>
									<Brain className='h-10 w-10 text-white' />
								</div>
								<CardTitle className='text-blue-900 font-bold text-xl'>AI Chấm điểm tự động</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-slate-600'>
									Chấm điểm Speaking và Writing tức thì với độ chính xác 99%, cung cấp phản hồi chi tiết và cách cải
									thiện.
								</p>
							</CardContent>
						</Card>

						<Card className='text-center hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-400 bg-gradient-to-br from-purple-50 via-purple-100/50 to-white hover:scale-105 transform'>
							<CardHeader>
								<div className='w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl hover:shadow-2xl transition-shadow'>
									<Target className='h-10 w-10 text-white' />
								</div>
								<CardTitle className='text-purple-900 font-bold text-xl'>Đề thi thích ứng</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-slate-600'>
									AI tạo câu hỏi phù hợp với trình độ của bạn, tự động điều chỉnh độ khó để tối ưu hóa quá trình học.
								</p>
							</CardContent>
						</Card>

						<Card className='text-center hover:shadow-2xl transition-all duration-300 border-2 hover:border-pink-400 bg-gradient-to-br from-pink-50 via-pink-100/50 to-white hover:scale-105 transform'>
							<CardHeader>
								<div className='w-20 h-20 bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl hover:shadow-2xl transition-shadow'>
									<BarChart className='h-10 w-10 text-white' />
								</div>
								<CardTitle className='text-pink-900 font-bold text-xl'>Phân tích chi tiết</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-slate-600'>
									Theo dõi tiến trình học tập với báo cáo chi tiết, xác định điểm mạnh và điểm cần cải thiện.
								</p>
							</CardContent>
						</Card>

						<Card className='text-center hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-400 bg-gradient-to-br from-green-50 via-green-100/50 to-white hover:scale-105 transform'>
							<CardHeader>
								<div className='w-20 h-20 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl hover:shadow-2xl transition-shadow'>
									<BookOpen className='h-10 w-10 text-white' />
								</div>
								<CardTitle className='text-green-900 font-bold text-xl'>Ngân hàng đề phong phú</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-slate-600'>
									Hàng nghìn câu hỏi IELTS và TOEIC được cập nhật liên tục, mô phỏng sát với đề thi thật.
								</p>
							</CardContent>
						</Card>

						<Card className='text-center hover:shadow-2xl transition-all duration-300 border-2 hover:border-orange-400 bg-gradient-to-br from-orange-50 via-orange-100/50 to-white hover:scale-105 transform'>
							<CardHeader>
								<div className='w-20 h-20 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl hover:shadow-2xl transition-shadow'>
									<Clock className='h-10 w-10 text-white' />
								</div>
								<CardTitle className='text-orange-900 font-bold text-xl'>Luyện thi theo thời gian</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-slate-600'>
									Mô phỏng điều kiện thi thật với bộ đếm thời gian, giúp bạn làm quen và quản lý thời gian hiệu quả.
								</p>
							</CardContent>
						</Card>

						<Card className='text-center hover:shadow-2xl transition-all duration-300 border-2 hover:border-teal-400 bg-gradient-to-br from-teal-50 via-teal-100/50 to-white hover:scale-105 transform'>
							<CardHeader>
								<div className='w-20 h-20 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl hover:shadow-2xl transition-shadow'>
									<Users className='h-10 w-10 text-white' />
								</div>
								<CardTitle className='text-teal-900 font-bold text-xl'>Cộng đồng học tập</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-slate-600'>
									Kết nối với cộng đồng học viên, chia sẻ kinh nghiệm và động lực cùng nhau chinh phục mục tiêu.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className='py-12 md:py-16 lg:py-20 bg-white'>
				<div className='container mx-auto px-4 md:px-6 lg:px-8'>
					<div className='text-center mb-10 md:mb-12 lg:mb-16'>
						<h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-gray-900'>Cách thức hoạt động</h2>
						<p className='text-base md:text-lg lg:text-xl text-slate-600 px-4'>
							3 bước đơn giản để bắt đầu hành trình chinh phục IELTS & TOEIC
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8'>
						<div className='text-center p-4 md:p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-white hover:scale-105 transform border-2 border-transparent hover:border-blue-200'>
							<div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4 md:mb-6 shadow-2xl ring-4 ring-blue-100 hover:ring-blue-200 transition-all'>
								1
							</div>
							<h3 className='text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>Đánh giá trình độ</h3>
							<p className='text-sm md:text-base text-slate-700 px-2 leading-relaxed'>
								Làm bài test đầu vào để AI phân tích chính xác trình độ hiện tại của bạn
							</p>
						</div>
						<div className='text-center p-4 md:p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-50/50 to-white hover:scale-105 transform border-2 border-transparent hover:border-purple-200'>
							<div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4 md:mb-6 shadow-2xl ring-4 ring-purple-100 hover:ring-purple-200 transition-all'>
								2
							</div>
							<h3 className='text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent'>Luyện thi cá nhân hóa</h3>
							<p className='text-sm md:text-base text-slate-700 px-2 leading-relaxed'>
								AI tạo lộ trình học tập riêng với các bài thi phù hợp với trình độ và mục tiêu
							</p>
						</div>
						<div className='text-center p-4 md:p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-pink-50/50 to-white hover:scale-105 transform border-2 border-transparent hover:border-pink-200'>
							<div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600 text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4 md:mb-6 shadow-2xl ring-4 ring-pink-100 hover:ring-pink-200 transition-all'>
								3
							</div>
							<h3 className='text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent'>Đạt mục tiêu</h3>
							<p className='text-sm md:text-base text-slate-700 px-2 leading-relaxed'>
								Theo dõi tiến độ và điều chỉnh chiến lược để đạt band điểm mong muốn
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section className='py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50'>
				<div className='container mx-auto px-4 md:px-6 lg:px-8'>
					<div className='text-center mb-10 md:mb-12 lg:mb-16'>
						<h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-gray-900'>
							<span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>Học viên</span>{' '}
							<span className='bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>nói gì về chúng tôi</span>
						</h2>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8'>
						<Card className='border-2 hover:border-blue-200 hover:shadow-xl transition-all bg-gradient-to-br from-blue-50/30 to-white'>
							<CardContent className='pt-6'>
								<div className='flex mb-4'>
									{[...Array(5)].map((_, i) => (
										<Star key={i} className='h-5 w-5 fill-yellow-400 text-yellow-400' />
									))}
								</div>
								<p className='text-slate-700 mb-4'>
									"Tôi đã tăng từ 6.0 lên 8.5 IELTS chỉ trong 3 tháng. AI chấm Speaking rất chính xác và phản hồi chi
									tiết giúp tôi cải thiện nhanh chóng."
								</p>
								<div className='flex items-center'>
									<div>
										<p className='font-semibold text-gray-900'>Nguyễn Minh Anh</p>
										<p className='text-sm text-muted-foreground'>Du học sinh tại Canada</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className='border-2 hover:border-purple-200 hover:shadow-xl transition-all bg-gradient-to-br from-purple-50/30 to-white'>
							<CardContent className='pt-6'>
								<div className='flex mb-4'>
									{[...Array(5)].map((_, i) => (
										<Star key={i} className='h-5 w-5 fill-yellow-400 text-yellow-400' />
									))}
								</div>
								<p className='text-slate-700 mb-4'>
									"TOEIC 985/990! Ngân hàng đề của EnglishAI Pro rất sát với đề thi thật. Chức năng luyện theo thời gian
									giúp tôi quản lý thời gian tốt hơn."
								</p>
								<div className='flex items-center'>
									<div>
										<p className='font-semibold text-gray-900'>Trần Quốc Bảo</p>
										<p className='text-sm text-slate-500'>Nhân viên tập đoàn đa quốc gia</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className='border-2 hover:border-pink-200 hover:shadow-xl transition-all bg-gradient-to-br from-pink-50/30 to-white'>
							<CardContent className='pt-6'>
								<div className='flex mb-4'>
									{[...Array(5)].map((_, i) => (
										<Star key={i} className='h-5 w-5 fill-yellow-400 text-yellow-400' />
									))}
								</div>
								<p className='text-slate-700 mb-4'>
									"Là giáo viên tiếng Anh, tôi khuyên dùng nền tảng này cho học sinh. Phân tích chi tiết giúp họ biết
									chính xác cần cải thiện ở đâu."
								</p>
								<div className='flex items-center'>
									<div>
										<p className='font-semibold text-gray-900'>Phạm Thu Hà</p>
										<p className='text-sm text-muted-foreground'>Giáo viên IELTS</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-12 md:py-16 lg:py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'>
				<div className='container px-4 md:px-6 lg:px-8 mx-auto text-center'>
					<h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-white'>Sẵn sàng chinh phục mục tiêu?</h2>
					<p className='text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-white/90 px-4'>Tham gia cùng hàng nghìn học viên đã thành công với EnglishAI Pro</p>
					<div className='flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4'>
						<Button size='lg' onClick={onGetStarted} className='text-base md:text-lg px-6 md:px-8 py-4 md:py-6 bg-white text-purple-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto'>
							Bắt đầu học miễn phí
							<ArrowRight className='ml-2 h-4 md:h-5 w-4 md:w-5' />
						</Button>
					<Button size='lg' variant='outline' onClick={onLogin} className='text-base md:text-lg px-6 md:px-8 py-4 md:py-6 border-2 border-white text-white hover:bg-white/20 w-full sm:w-auto'>
							Đăng nhập ngay
						</Button>
					</div>
					<p className='text-xs md:text-sm text-white/75 mt-3 md:mt-4'>Miễn phí trải nghiệm</p>
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
