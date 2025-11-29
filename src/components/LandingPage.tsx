import React from 'react';
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
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
	const navigate = useNavigate();
	const onGetStarted = () => navigate('/auth');
	const onLogin = () => navigate('/auth');

	return (
		<div className='min-h-screen bg-background'>
			{/* Hero Section */}
			<section className='py-20 bg-gradient-to-br from-blue-50 to-indigo-100'>
				<div className='container mx-0 px-0 text-center'>
					<h1 className='text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
						Chinh phục IELTS & TOEIC
						<br />
						với trí tuệ nhân tạo
					</h1>
					<p className='text-xl text-muted-foreground mb-8 max-w-3xl mx-auto'>
						Hệ thống luyện thi tiếng Anh thông minh với AI chấm điểm tự động, tạo đề thi thích ứng và phản hồi cá nhân
						hóa. Nâng cao band điểm của bạn một cách hiệu quả.
					</p>
					<div className='flex flex-col sm:flex-row gap-4 justify-center mb-12'>
						<Button size='lg' onClick={onGetStarted} className='text-lg px-8 py-6'>
							Bắt đầu học miễn phí
							<ArrowRight className='ml-2 h-5 w-5' />
						</Button>
						<Button size='lg' variant='outline' className='text-lg px-8 py-6'>
							<Play className='mr-2 h-5 w-5' />
							Xem demo
						</Button>
					</div>

					{/* Hero Image */}
					<div className='w-full'>
						<ImageWithFallback
							src='https://han02.vstorage.vngcloud.vn/public/Default/Media/Images/bb0c9fc2-374e-4be7-82f3-ba70c1205768/default_image_bb0c9fc2-374e-4be7-82f3-ba70c1205768_1921-x-641-4-(7)_1727235891010.jpg'
							alt='Students studying for English exams'
							className='w-full rounded-none'
						/>
					</div>
				</div>
			</section>

			{/* Statistics */}
			<section className='py-16 bg-white'>
				<div className='container mx-auto px-4'>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
						<div>
							<div className='text-3xl font-bold text-primary mb-2'>98%</div>
							<p className='text-muted-foreground'>Tỷ lệ cải thiện điểm</p>
						</div>
						<div>
							<div className='text-3xl font-bold text-primary mb-2'>50K+</div>
							<p className='text-muted-foreground'>Học viên tin tưởng</p>
						</div>
						<div>
							<div className='text-3xl font-bold text-primary mb-2'>1.2M+</div>
							<p className='text-muted-foreground'>Bài thi đã hoàn thành</p>
						</div>
						<div>
							<div className='text-3xl font-bold text-primary mb-2'>8.5</div>
							<p className='text-muted-foreground'>Điểm IELTS trung bình</p>
						</div>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className='py-20 bg-gray-50'>
				<div className='container mx-auto px-4'>
					<div className='text-center mb-16'>
						<h2 className='text-4xl font-bold mb-4'>Tính năng đột phá</h2>
						<p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
							Công nghệ AI tiên tiến giúp bạn học hiệu quả gấp 3 lần so với phương pháp truyền thống
						</p>
					</div>

					<div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
						<Card className='text-center'>
							<CardHeader>
								<Brain className='h-12 w-12 text-primary mx-auto mb-4' />
								<CardTitle>AI Chấm điểm tự động</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-muted-foreground'>
									Chấm điểm Speaking và Writing tức thì với độ chính xác 99%, cung cấp phản hồi chi tiết và cách cải
									thiện.
								</p>
							</CardContent>
						</Card>

						<Card className='text-center'>
							<CardHeader>
								<Target className='h-12 w-12 text-primary mx-auto mb-4' />
								<CardTitle>Đề thi thích ứng</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-muted-foreground'>
									AI tạo câu hỏi phù hợp với trình độ của bạn, tự động điều chỉnh độ khó để tối ưu hóa quá trình học.
								</p>
							</CardContent>
						</Card>

						<Card className='text-center'>
							<CardHeader>
								<BarChart className='h-12 w-12 text-primary mx-auto mb-4' />
								<CardTitle>Phân tích chi tiết</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-muted-foreground'>
									Theo dõi tiến trình học tập với báo cáo chi tiết, xác định điểm mạnh và điểm cần cải thiện.
								</p>
							</CardContent>
						</Card>

						<Card className='text-center'>
							<CardHeader>
								<BookOpen className='h-12 w-12 text-primary mx-auto mb-4' />
								<CardTitle>Ngân hàng đề phong phú</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-muted-foreground'>
									Hàng nghìn câu hỏi IELTS và TOEIC được cập nhật liên tục, mô phỏng sát với đề thi thật.
								</p>
							</CardContent>
						</Card>

						<Card className='text-center'>
							<CardHeader>
								<Clock className='h-12 w-12 text-primary mx-auto mb-4' />
								<CardTitle>Luyện thi theo thời gian</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-muted-foreground'>
									Mô phỏng điều kiện thi thật với bộ đếm thời gian, giúp bạn làm quen và quản lý thời gian hiệu quả.
								</p>
							</CardContent>
						</Card>

						<Card className='text-center'>
							<CardHeader>
								<Users className='h-12 w-12 text-primary mx-auto mb-4' />
								<CardTitle>Cộng đồng học tập</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-muted-foreground'>
									Kết nối với cộng đồng học viên, chia sẻ kinh nghiệm và động lực cùng nhau chinh phục mục tiêu.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className='py-20 bg-white'>
				<div className='container mx-auto px-4'>
					<div className='text-center mb-16'>
						<h2 className='text-4xl font-bold mb-4'>Cách thức hoạt động</h2>
						<p className='text-xl text-muted-foreground'>
							3 bước đơn giản để bắt đầu hành trình chinh phục IELTS & TOEIC
						</p>
					</div>

					<div className='grid md:grid-cols-3 gap-8'>
						<div className='text-center'>
							<div className='w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6'>
								1
							</div>
							<h3 className='text-xl font-semibold mb-4'>Đánh giá trình độ</h3>
							<p className='text-muted-foreground'>
								Làm bài test đầu vào để AI phân tích chính xác trình độ hiện tại của bạn
							</p>
						</div>
						<div className='text-center'>
							<div className='w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6'>
								2
							</div>
							<h3 className='text-xl font-semibold mb-4'>Luyện thi cá nhân hóa</h3>
							<p className='text-muted-foreground'>
								AI tạo lộ trình học tập riêng với các bài thi phù hợp với trình độ và mục tiêu
							</p>
						</div>
						<div className='text-center'>
							<div className='w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6'>
								3
							</div>
							<h3 className='text-xl font-semibold mb-4'>Đạt mục tiêu</h3>
							<p className='text-muted-foreground'>
								Theo dõi tiến độ và điều chỉnh chiến lược để đạt band điểm mong muốn
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section className='py-20 bg-gray-50'>
				<div className='container mx-auto px-4'>
					<div className='text-center mb-16'>
						<h2 className='text-4xl font-bold mb-4'>Học viên nói gì về chúng tôi</h2>
					</div>

					<div className='grid md:grid-cols-3 gap-8'>
						<Card>
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
										<p className='font-semibold'>Nguyễn Minh Anh</p>
										<p className='text-sm text-muted-foreground'>Du học sinh tại Canada</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
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
										<p className='font-semibold'>Trần Quốc Bảo</p>
										<p className='text-sm text-muted-foreground'>Nhân viên tập đoàn đa quốc gia</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
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
										<p className='font-semibold'>Phạm Thu Hà</p>
										<p className='text-sm text-muted-foreground'>Giáo viên IELTS</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-20 bg-primary text-white'>
				<div className='container px-0 mx-0 text-center'>
					<h2 className='text-4xl font-bold mb-4'>Sẵn sàng chinh phục mục tiêu?</h2>
					<p className='text-xl mb-8 opacity-90'>Tham gia cùng hàng nghìn học viên đã thành công với EnglishAI Pro</p>
					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<Button size='lg' variant='secondary' onClick={onGetStarted} className='text-lg px-8 py-6'>
							Bắt đầu học miễn phí
							<ArrowRight className='ml-2 h-5 w-5' />
						</Button>
						<Button size='lg' variant='secondary' onClick={onLogin} className='text-lg px-8 py-6'>
							Đăng nhập ngay
						</Button>
					</div>
					<p className='text-sm opacity-75 mt-4'>Miễn phí trải nghiệm</p>
				</div>
			</section>

			{/* Footer */}
			<footer className='py-12 bg-gray-900 text-white'>
				<div className='container mx-auto px-4'>
					<div className='grid md:grid-cols-4 gap-8'>
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
						<p>&copy; 2024 EnglishAI Pro. Tất cả quyền được bảo lưu.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
