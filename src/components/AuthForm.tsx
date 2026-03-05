'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Brain, Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setUser } from './store/currUserSlice';
import { v4 as uuidv4 } from 'uuid';

import { RootState } from '@/lib/store/store';
import { addUser, updateUser } from './store/userSlice';
import { User } from '@/types/client';

export function AuthForm() {
	const router = useRouter();
	const params = useSearchParams();
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
	const users = useAppSelector((state: RootState) => state.users.list);
	const roles = useAppSelector((state: RootState) => state.roles.list);

	// Common validation
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

	// Login handler
	const handleLoginSubmit = async () => {
		setLoading(true);
		setError('');

		try {
			// simulate API delay
			await new Promise((res) => setTimeout(res, 700));

			// get all users from Redux
			const foundUser = users.find((u) => u.email === formData.email && u.password === formData.password);

			if (!foundUser) {
				setError('Email hoặc mật khẩu không đúng');
				return;
			}

			// Check user status
			if (foundUser.status === 'suspended') {
				setError('Tài khoản của bạn đã bị tạm ngưng');
				return;
			}
			if (foundUser.status === 'banned') {
				setError('Tài khoản của bạn đã bị cấm');
				return;
			}

			// Update last login time
			const updatedUser: User = { ...foundUser, lastLoginAt: Date.now() };
			dispatch(updateUser(updatedUser));

			// dispatch current user to store
			dispatch(setUser(updatedUser));

			// Set authentication cookie for middleware
			document.cookie = 'user_authenticated=true; path=/; max-age=2592000'; // 30 days

			// Redirect based on roleId (direct check — avoids timing issues with roles slice hydration)
			const isAdminRole = foundUser.roleId === 'role-staff' || foundUser.roleId === 'role-head-staff';
			if (isAdminRole) {
				router.push('/dashboard');
			} else {
				router.push('/test-selection');
			}
		} catch (err: any) {
			setError(err.message || 'Đăng nhập thất bại');
		} finally {
			setLoading(false);
		}
	};

	// Register handler
	const handleRegisterSubmit = async () => {
		setLoading(true);
		setError('');
		try {
			await new Promise((res) => setTimeout(res, 700));

			// Check if user already exists
			const existingUser = users.find(u => u.email === formData.email);
			if (existingUser) {
				setError('Email đã được đăng ký');
				return;
			}

			// Get learner role
			const learnerRole = roles.find(r => r.name === 'learner');
			if (!learnerRole) {
				setError('Không tìm thấy vai trò người dùng');
				return;
			}

			// Create new user with learner role
			const newUser: User = {
				id: uuidv4(),
				email: formData.email,
				fullName: formData.fullName,
				password: formData.password,
				roleId: learnerRole.id,
				status: 'active',
				createdAt: Date.now(),
				lastLoginAt: Date.now(),
			};

			dispatch(setUser(newUser));
			dispatch(addUser(newUser));

			// Set authentication cookie for middleware
			document.cookie = 'user_authenticated=true; path=/; max-age=2592000'; // 30 days

			router.push('/test-selection');
		} catch (err: any) {
			setError(err.message || 'Đăng ký thất bại');
		} finally {
			setLoading(false);
		}
	};

	// Main submit
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;
		if (isLogin) await handleLoginSubmit();
		else await handleRegisterSubmit();
	};

	// Social login (Google/Facebook)
	const handleSocialLogin = async (_provider: 'google' | 'facebook') => {
		// setLoading(true);
		// setError('');
		// try {
		// 	await new Promise((res) => setTimeout(res, 600));
		// 	dispatch(
		// 		setUser({
		// 			id: 'social-456',
		// 			email: 'social@example.com',
		// 			fullName: provider === 'google' ? 'Google User' : 'Facebook User',
		// 			createdAt: new Date(),
		// 		})
		// 	);
		// 	navigate('/dashboard');
		// } catch (e) {
		// 	setError('Đăng nhập thất bại');
		// } finally {
		// 	setLoading(false);
		// }
	};

	const toggleMode = () => {
		const newMode = isLogin ? 'register' : 'login';
		router.push(`/auth?mode=${newMode}`);
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 relative overflow-hidden'>
			{/* Animated background elements */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob'></div>
				<div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000'></div>
				<div className='absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000'></div>
			</div>

			<Card className='w-full max-w-md shadow-2xl border-2 relative z-10 bg-white/95 backdrop-blur-sm'>
				<CardHeader className='text-center space-y-4 pb-6'>
					<Link href='/landing' className='flex items-center justify-center gap-3 cursor-pointer hover:opacity-80 transition-opacity'>
						<div className='p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg'>
							<Brain className='h-8 w-8 text-white' />
						</div>
						<div>
							<h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>AI English Prep</h1>
							<p className='text-sm text-slate-600'>Hệ thống luyện thi AI</p>
						</div>
					</Link>
					<div>
						<CardTitle className='text-2xl font-bold text-gray-900'>{isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}</CardTitle>
						<CardDescription className='text-base text-slate-600'>
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
								<Label className='text-gray-700 font-semibold'>Họ và tên</Label>
								<div className='relative'>
									<UserIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-500' />
									<Input
										value={formData.fullName}
										onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
										className='pl-10 border-2 focus:border-purple-400 transition-colors h-11'
										placeholder='Nhập họ và tên'
									/>
								</div>
								{validationErrors.fullName && <p className='text-sm text-destructive'>{validationErrors.fullName}</p>}
							</div>
						)}

						<div className='space-y-2'>
							<Label className='text-gray-700 font-semibold'>Email</Label>
							<div className='relative'>
								<Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500' />
								<Input
									value={formData.email}
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									className='pl-10 border-2 focus:border-blue-400 transition-colors h-11'
									placeholder='Nhập email của bạn'
								/>
							</div>
							{validationErrors.email && <p className='text-sm text-destructive'>{validationErrors.email}</p>}
						</div>

						<div className='space-y-2'>
							<Label className='text-gray-700 font-semibold'>Mật khẩu</Label>
							<div className='relative'>
								<Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-500' />
								<Input
									type={showPassword ? 'text' : 'password'}
									value={formData.password}
									onChange={(e) => setFormData({ ...formData, password: e.target.value })}
									className='pl-10 pr-10 border-2 focus:border-pink-400 transition-colors h-11'
									placeholder='Nhập mật khẩu'
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
								<Label className='text-gray-700 font-semibold'>Xác nhận mật khẩu</Label>
								<div className='relative'>
									<Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-500' />
									<Input
										type={showConfirmPassword ? 'text' : 'password'}
										value={formData.confirmPassword}
										onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
										className='pl-10 pr-10 border-2 focus:border-pink-400 transition-colors h-11'
										placeholder='Nhập lại mật khẩu'
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

						<Button className='w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all' disabled={loading}>
							{loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
							<ArrowRight className='ml-2 h-5 w-5' />
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

					<Button variant='outline' className='w-full h-12 border-2 hover:bg-red-50 hover:border-red-300 transition-all font-semibold' onClick={() => handleSocialLogin('google')} disabled={loading}>
						<FaGoogle className='w-5 h-5 text-red-500 mr-2' />
						{isLogin ? 'Đăng ký bằng Google' : 'Đăng nhập Google'}
					</Button>
					<Button variant='outline' className='w-full h-12 border-2 hover:bg-blue-50 hover:border-blue-300 transition-all font-semibold' onClick={() => handleSocialLogin('facebook')} disabled={loading}>
						<FaFacebook className='w-5 h-5 text-blue-600 mr-2' />
						{isLogin ? 'Đăng ký bằng Facebook' : 'Đăng nhập Facebook'}
					</Button>
					{/* Quick login buttons for testing (only in login mode) */}
					{isLogin && (
						<div className='mt-6 pt-6 border-t'>
							<p className='text-sm text-muted-foreground mb-3 text-center'>Đăng nhập nhanh (Testing):</p>
							<div className='space-y-2'>
								<Button
									variant='outline'
									size='sm'
									className='w-full'
									onClick={() => {
										setFormData({
											...formData,
											email: 'admin@englishprep.com',
											password: 'admin123',
										});
									}}
									type='button'
								>
									Head Staff (admin@englishprep.com)
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='w-full'
									onClick={() => {
										setFormData({
											...formData,
											email: 'alice@example.com',
											password: 'password123',
										});
									}}
									type='button'
								>
									Staff (alice@example.com)
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='w-full'
									onClick={() => {
										setFormData({
											...formData,
											email: 'bob@example.com',
											password: 'secret456',
										});
									}}
									type='button'
								>
									Learner (bob@example.com)
								</Button>
							</div>
						</div>
					)}
					<p className='text-center text-sm mt-2 text-gray-600'>
						{isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
						<Button variant='link' className='p-0 font-semibold text-purple-600 hover:text-purple-700' onClick={toggleMode}>
							{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
						</Button>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
