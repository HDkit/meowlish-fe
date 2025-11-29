import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Brain, Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../components/store/hook';
import { setUser } from '../components/store/userSlice';

export function AuthForm() {
	const navigate = useNavigate();
	const [params, setParams] = useSearchParams();
	const mode = params.get('mode') === 'register' ? 'register' : 'login';
	const isLogin = mode === 'login';
	const dispatch = useAppDispatch();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
		fullName: '',
		confirmPassword: '',
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
	const [error, setError] = useState('');

	const validate = () => {
		const errors: Record<string, string> = {};
		if (!formData.email) errors.email = 'Email là bắt buộc';
		else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email không hợp lệ';

		if (!formData.password) errors.password = 'Mật khẩu là bắt buộc';
		else if (formData.password.length < 6) errors.password = 'Mật khẩu phải dài hơn 6 ký tự';

		if (!isLogin) {
			if (!formData.fullName.trim()) errors.fullName = 'Họ tên là bắt buộc';
			if (!formData.confirmPassword) errors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
			else if (formData.confirmPassword !== formData.password) errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setLoading(true);
		setError('');

		try {
			// simulate API call
			await new Promise((res) => setTimeout(res, 700));

			// after "successful" login/register, update Redux
			const fakeUser = {
				id: '123',
				email: formData.email,
				fullName: isLogin ? 'John Doe' : formData.fullName,
				createdAt: new Date(),
			};
			dispatch(setUser(fakeUser));

			navigate('/dashboard');
		} catch (err: any) {
			setError(err.message || 'Đã xảy ra lỗi');
		} finally {
			setLoading(false);
		}
	};

	const socialLogin = async (provider: 'google' | 'facebook') => {
		setLoading(true);
		try {
			await new Promise((res) => setTimeout(res, 600));

			const fakeSocialUser = {
				id: 'social-456',
				email: 'social@example.com',
				fullName: provider === 'google' ? 'Google User' : 'Facebook User',
				createdAt: new Date(),
			};
			dispatch(setUser(fakeSocialUser));

			navigate('/dashboard');
		} catch (e) {
			setError('Đăng nhập thất bại');
		} finally {
			setLoading(false);
		}
	};

	const toggleMode = () => setParams({ mode: isLogin ? 'register' : 'login' });

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='text-center space-y-4'>
					<div className='flex items-center justify-center gap-3'>
						<div className='p-2 bg-primary/10 rounded-lg'>
							<Brain className='h-8 w-8 text-primary' />
						</div>
						<div>
							<h1 className='text-xl font-semibold'>AI English Prep</h1>
							<p className='text-sm text-muted-foreground'>Hệ thống luyện thi AI</p>
						</div>
					</div>
					<div>
						<CardTitle>{isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}</CardTitle>
						<CardDescription>
							{isLogin ? 'Đăng nhập để tiếp tục luyện thi' : 'Tạo tài khoản mới để bắt đầu hành trình học tập'}
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent className='space-y-4'>
					{error && (
						<Alert variant='destructive'>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<form onSubmit={handleSubmit} className='space-y-4'>
						{!isLogin && (
							<div className='space-y-2'>
								<Label>Họ và tên</Label>
								<div className='relative'>
									<User className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
									<Input
										value={formData.fullName}
										onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
										className='pl-10'
									/>
								</div>
								{validationErrors.fullName && <p className='text-sm text-destructive'>{validationErrors.fullName}</p>}
							</div>
						)}

						<div className='space-y-2'>
							<Label>Email</Label>
							<div className='relative'>
								<Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
								<Input
									value={formData.email}
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									className='pl-10'
								/>
							</div>
							{validationErrors.email && <p className='text-sm text-destructive'>{validationErrors.email}</p>}
						</div>

						<div className='space-y-2'>
							<Label>Mật khẩu</Label>
							<div className='relative'>
								<Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
								<Input
									type={showPassword ? 'text' : 'password'}
									value={formData.password}
									onChange={(e) => setFormData({ ...formData, password: e.target.value })}
									className='pl-10 pr-10'
								/>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									className='absolute right-0 top-0 h-full px-3'
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? <EyeOff /> : <Eye />}
								</Button>
							</div>
							{validationErrors.password && <p className='text-sm text-destructive'>{validationErrors.password}</p>}
						</div>

						{!isLogin && (
							<div className='space-y-2'>
								<Label>Xác nhận mật khẩu</Label>
								<div className='relative'>
									<Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
									<Input
										type={showConfirmPassword ? 'text' : 'password'}
										value={formData.confirmPassword}
										onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
										className='pl-10 pr-10'
									/>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										className='absolute right-0 top-0 h-full px-3'
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									>
										{showConfirmPassword ? <EyeOff /> : <Eye />}
									</Button>
								</div>
								{validationErrors.confirmPassword && (
									<p className='text-sm text-destructive'>{validationErrors.confirmPassword}</p>
								)}
							</div>
						)}

						<Button className='w-full' disabled={loading}>
							{loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
							<ArrowRight className='ml-2 h-4 w-4' />
						</Button>
					</form>

					<div className='relative'>
						<div className='absolute inset-0 flex items-center'>
							<Separator />
						</div>
						<div className='relative flex justify-center text-xs uppercase'>
							<span className='bg-background px-2 text-muted-foreground'>hoặc</span>
						</div>
					</div>

					<Button variant='outline' className='w-full' onClick={() => socialLogin('google')} disabled={loading}>
						Login with Google
					</Button>
					<Button variant='outline' className='w-full' onClick={() => socialLogin('facebook')} disabled={loading}>
						Login with Facebook
					</Button>

					<p className='text-center text-sm mt-2'>
						{isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
						<Button variant='link' className='p-0' onClick={toggleMode}>
							{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
						</Button>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
