'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Brain, Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, Target, Sparkles, FlaskConical } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser } from './store/currUserSlice';
import { v4 as uuidv4 } from 'uuid';
import { AuthService, setApiTokensState } from '@/lib/api-client';
import { jwtDecode } from 'jwt-decode';
import { User } from '@/types/client';

const normalizeRoleIdFromToken = (decoded: any): string => {
	const rawRole = decoded?.role || decoded?.roleId;
	const normalizedRoles = Array.isArray(decoded?.roles)
		? decoded.roles.map((role: unknown) => String(role).toLowerCase())
		: [];
	const normalizedPermissions = Array.isArray(decoded?.permissions)
		? decoded.permissions.map((permission: unknown) => String(permission).toLowerCase())
		: [];
	const normalizedRawRole = typeof rawRole === 'string' ? rawRole.toLowerCase() : '';

	if (
		normalizedRawRole === 'role-head-staff' ||
		normalizedRawRole === 'head_staff' ||
		normalizedRawRole === 'head-staff' ||
		normalizedRawRole === 'admin' ||
		normalizedRoles.includes('admin') ||
		normalizedRoles.includes('head_staff') ||
		normalizedPermissions.includes('exam:approve') ||
		normalizedPermissions.includes('user:ban') ||
		normalizedPermissions.includes('user:lock')
	) {
		return 'role-head-staff';
	}

	if (
		normalizedRawRole === 'role-staff' ||
		normalizedRawRole === 'staff' ||
		normalizedRoles.includes('staff') ||
		normalizedPermissions.includes('exam:write') ||
		normalizedPermissions.includes('exam:review')
	) {
		return 'role-staff';
	}

	if (normalizedRawRole === 'role-learner' || normalizedRawRole === 'learner' || normalizedRoles.includes('learner')) {
		return 'role-learner';
	}

	return 'role-learner';
};

const extractApiErrorMessage = (err: any, fallback: string) => {
	const apiError = err?.body?.error;

	if (typeof apiError === 'string' && apiError.trim()) {
		return apiError;
	}

	if (Array.isArray(apiError) && apiError.length > 0) {
		return apiError.map((item) => String(item)).join(', ');
	}

	if (typeof apiError?.message === 'string' && apiError.message.trim()) {
		return apiError.message;
	}

	if (Array.isArray(apiError?.message) && apiError.message.length > 0) {
		return apiError.message.map((item: unknown) => String(item)).join(', ');
	}

	if (typeof err?.body?.message === 'string' && err.body.message.trim()) {
		return err.body.message;
	}

	if (Array.isArray(err?.body?.message) && err.body.message.length > 0) {
		return err.body.message.map((item: unknown) => String(item)).join(', ');
	}

	if (typeof err?.message === 'string' && err.message.trim() && err.message !== 'Bad Request') {
		return err.message;
	}

	return fallback;
};

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
	const [devLoading, setDevLoading] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
	const [error, setError] = useState('');

	// ─── Dev Quick Login (mock role, real token) ───────────────────────
	const devLogin = async (targetRole: 'role-staff' | 'role-head-staff') => {
		const label = targetRole === 'role-head-staff' ? 'head-staff' : 'staff';
		setDevLoading(label);
		setError('');
		const ts = Date.now();
		const devEmail = `dev.${label}.${ts}@devtest.local`;
		const devPassword = `DevPass${ts}!`;
		const devName = targetRole === 'role-head-staff' ? `HeadStaff${ts}` : `Staff${ts}`;
		try {
			// Register a fresh account to get a real token
			const res = await AuthService.authGatewayControllerRegisterMailV1({ mail: devEmail, password: devPassword, username: devName });
			const token = res.data?.accessToken;
			if (!token) throw new Error('Không nhận được token');
			setApiTokensState(token, res.data?.refreshToken);
			document.cookie = `user_authenticated=true; path=/; max-age=86400`;
			const decoded: any = jwtDecode(token);
			// Override roleId → desired staff role for UI routing
			const user: User = {
				id: decoded.sub || decoded.id || uuidv4(),
				email: devEmail,
				fullName: devName,
				roleId: targetRole,
				password: '***',
				status: 'active',
				createdAt: Date.now(),
				lastLoginAt: Date.now(),
			};
			dispatch(setUser(user));
			router.push('/dashboard');
		} catch (err: any) {
			setError(extractApiErrorMessage(err, 'Dev login thất bại. Backend có thể không khả dụng.'));
		} finally {
			setDevLoading(null);
		}
	};


	// Common validation
	const validate = () => {
		const errors: Record<string, string> = {};
		if (!formData.email) errors.email = 'Email là bắt buộc';
		else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email không hợp lệ';

		if (!formData.password) errors.password = 'Mật khẩu là bắt buộc';
		else if (!isLogin && formData.password.length < 6) errors.password = 'Mật khẩu phải dài hơn 6 ký tự';

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
			const res = await AuthService.authGatewayControllerLoginMailV1({ mail: formData.email, password: formData.password });
			
			const token = res.data?.accessToken;
			if (!token) throw new Error('Không nhận được token từ server');
			
			setApiTokensState(token, res.data?.refreshToken);
			
			// Set authentication cookie for middleware
			document.cookie = `user_authenticated=true; path=/; max-age=2592000`; // 30 days
			
			// Decode token to get user info if possible (or just use basic properties)
			const decoded: any = jwtDecode(token);
			
			// For right now, let's inject a realistic user into Redux to keep the app working
			const user: User = {
				id: decoded.sub || decoded.id || uuidv4(),
				email: formData.email,
				fullName: decoded.name || decoded.fullName || formData.email.split('@')[0],
				roleId: normalizeRoleIdFromToken(decoded),
				password: '***',
				status: 'active',
				createdAt: Date.now(),
				lastLoginAt: Date.now(),
			};

			dispatch(setUser(user));
			
			const isAdminRole = user.roleId === 'role-staff' || user.roleId === 'role-head-staff' || user.roleId === 'ADMIN';
			if (isAdminRole) {
				router.push('/dashboard');
			} else {
				router.push('/test-selection');
			}
		} catch (err: any) {
			console.error(err);
			setError(extractApiErrorMessage(err, 'Đăng nhập thất bại'));
		} finally {
			setLoading(false);
		}
	};

	// Register handler
	const handleRegisterSubmit = async () => {
		setLoading(true);
		setError('');
		try {
			const res = await AuthService.authGatewayControllerRegisterMailV1({ mail: formData.email, password: formData.password, username: formData.fullName });
			
			const token = res.data?.accessToken;
			if (!token) throw new Error('Không nhận được token từ server');
			
			setApiTokensState(token, res.data?.refreshToken);
			document.cookie = `user_authenticated=true; path=/; max-age=2592000`;

			const decoded: any = jwtDecode(token);

			const newUser: User = {
				id: decoded.sub || decoded.id || uuidv4(),
				email: formData.email,
				fullName: formData.fullName,
				password: '***',
				roleId: normalizeRoleIdFromToken(decoded),
				status: 'active',
				createdAt: Date.now(),
				lastLoginAt: Date.now(),
			};

			dispatch(setUser(newUser));
			router.push('/test-selection');
		} catch (err: any) {
			console.error(err);
			setError(extractApiErrorMessage(err, 'Đăng ký thất bại'));
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

	// Social login (Google) - Direct redirect to avoid CORS
	const handleGoogleLogin = () => {
		// Direct redirect to backend OAuth endpoint
		// This avoids CORS issues with fetch API
		window.location.href = '/api/v1/auth/google';
	};

	const toggleMode = () => {
		const newMode = isLogin ? 'register' : 'login';
		router.push(`/auth?mode=${newMode}`);
	};

	return (
		<div className='min-h-screen w-full flex bg-background relative overflow-hidden'>
			{/* Premium background blobs */}
			<div className='absolute inset-0 overflow-hidden pointer-events-none'>
				<div className='absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-3xl animate-blob'></div>
				<div className='absolute top-1/2 -left-40 w-[25rem] h-[25rem] bg-primary/10 rounded-full blur-3xl animate-blob animation-delay-2000'></div>
				<div className='absolute -bottom-40 right-1/4 w-[25rem] h-[25rem] bg-secondary/10 rounded-full blur-3xl animate-blob animation-delay-4000'></div>
			</div>

			{/* Left Side: Marketing / Illustration */}
			<div className='hidden lg:flex flex-1 flex-col justify-center items-start pl-12 lg:pl-20 xl:pl-32 relative z-10'>
				<div className='max-w-3xl w-full'>
					<h1 className='text-5xl lg:text-7xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight'>
						Bắt đầu <br />
						hành trình chinh phục <br /> <span className='text-primary'>mục tiêu của bạn</span>
					</h1>
					<p className='text-xl text-muted-foreground font-medium mb-12 max-w-md leading-relaxed'>
						Hệ thống luyện thi thông minh giúp tối đa hóa điểm IELTS & TOEIC bằng sức mạnh cốt lõi của Trí Tuệ Nhân Tạo.
					</p>

					{/* Fun Floating Elements */}
					<div className='relative w-full h-[400px]'>
						{/* Floating Card 1 */}
						<div className='absolute top-0 right-10 animate-blob' style={{ animationDuration: '7s' }}>
							<div className='bg-white p-4 rounded-3xl shadow-xl border border-gray-100/50 rotate-[4deg] w-64 transform transition-transform hover:scale-105'>
								<div className='w-full h-32 bg-primary/10 rounded-2xl mb-4 flex items-center justify-center overflow-hidden'>
									<Sparkles className='w-12 h-12 text-primary/60' />
								</div>
								<div className='flex items-center gap-3'>
									<div className='w-10 h-10 bg-primary' />
									<div>
										<div className='h-3 w-24 bg-gray-200 rounded-full mb-2' />
										<div className='h-2 w-16 bg-gray-100 rounded-full' />
									</div>
								</div>
							</div>
						</div>

						{/* Floating Card 2 */}
						<div className='absolute bottom-10 left-0 animate-blob animation-delay-2000' style={{ animationDuration: '8s' }}>
							<div className='bg-white p-4 rounded-3xl shadow-xl border border-gray-100/50 rotate-[-4deg] w-56 transform transition-transform hover:scale-105'>
								<div className='w-full h-40 bg-secondary/10 rounded-2xl mb-4 flex items-center justify-center overflow-hidden'>
									<Target className='w-12 h-12 text-secondary/80' />
								</div>
								<div className='space-y-2 pb-2'>
									<div className='h-3 w-full bg-gray-200 rounded-full' />
									<div className='h-3 w-2/3 bg-gray-100 rounded-full' />
								</div>
							</div>
						</div>

						{/* Floating Card 3 - Small widget */}
						<div className='absolute top-32 left-10 animate-blob animation-delay-4000' style={{ animationDuration: '6s' }}>
							<div className='bg-white px-5 py-3 rounded-2xl shadow-lg border border-gray-100/50 flex items-center gap-3 rotate-[-6deg] hover:scale-105 transition-transform'>
								<div className='bg-green-100 p-2 rounded-xl text-green-600'><CheckCircle2 className='w-6 h-6' /></div>
								<div>
									<p className='font-bold text-gray-800 text-sm'>IELTS 7.5</p>
									<p className='text-xs text-gray-500'>Mục tiêu hoàn thành!</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Right Side: Auth Form */}
			<div className='w-full lg:w-[480px] xl:w-[560px] flex-shrink-0 min-h-screen flex flex-col justify-center relative z-20 bg-white shadow-2xl xl:shadow-[-20px_0_40px_rgba(0,0,0,0.08)] backdrop-blur-xl'>
				<div className="absolute top-0 left-0 h-1.5 w-full bg-primary" />

				<div className='w-full max-w-[400px] mx-auto px-6 py-12 flex flex-col'>
					{/* Header */}
					<div className='text-center space-y-4 pb-8'>
						<Link href='/landing' className='flex items-center justify-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group'>
							<div className='p-3 bg-primary rounded-2xl shadow-md group-hover:scale-105 transition-transform'>
								<Brain className='h-8 w-8 text-white' />
							</div>
							<div>
								<h1 className='text-3xl font-extrabold text-primary'>Lingriser</h1>
								<p className='text-sm font-semibold text-muted-foreground mt-0.5 tracking-wide'>Hệ Thống Luyện Thi AI</p>
							</div>
						</Link>
						<div className="pt-4">
							<h2 className='text-2xl font-bold text-gray-900'>{isLogin ? 'Chào mừng bạn trở lại' : 'Tạo tài khoản mới'}</h2>
							<p className='text-[15px] font-medium text-muted-foreground mt-2'>
								{isLogin ? 'Đăng nhập để tiếp tục hành trình luyện thi' : 'Bắt đầu hành trình chinh phục tiếng Anh cùng AI'}
							</p>
						</div>
					</div>

					<div className='space-y-4'>
						{error && (
							<Alert variant='destructive'>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<form onSubmit={handleSubmit} className='space-y-4'>
							{!isLogin && (
								<div className='space-y-2'>
									<Label className='text-gray-700 font-semibold'>Username</Label>
									<div className='relative'>
										<UserIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary/80' />
										<Input
											value={formData.fullName}
											onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
											className='pl-10 border-2 focus:border-primary transition-colors h-11'
											placeholder='Nhập username'
										/>
									</div>
									{validationErrors.fullName && <p className='text-sm text-destructive'>{validationErrors.fullName}</p>}
								</div>
							)}

							<div className='space-y-2'>
								<Label className='text-gray-700 font-semibold'>Email</Label>
								<div className='relative'>
									<Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/80' />
									<Input
										value={formData.email}
										onChange={(e) => setFormData({ ...formData, email: e.target.value })}
										className='pl-10 border-2 focus:border-primary transition-colors h-11'
										placeholder='Nhập email của bạn'
									/>
								</div>
								{validationErrors.email && <p className='text-sm text-destructive'>{validationErrors.email}</p>}
							</div>

							<div className='space-y-2'>
								<Label className='text-gray-700 font-semibold'>Mật khẩu</Label>
								<div className='relative'>
									<Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary/80' />
									<Input
										type={showPassword ? 'text' : 'password'}
										value={formData.password}
										onChange={(e) => setFormData({ ...formData, password: e.target.value })}
										className='pl-10 pr-10 border-2 focus:border-secondary transition-colors h-11'
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
										<Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary/80' />
										<Input
											type={showConfirmPassword ? 'text' : 'password'}
											value={formData.confirmPassword}
											onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
											className='pl-10 pr-10 border-2 focus:border-secondary transition-colors h-11'
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

							<Button className='w-full h-13 py-3 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all duration-200' disabled={loading}>
								{loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập vào hệ thống' : 'Đăng ký tài khoản'}
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

						{/* Google OAuth chỉ hoạt động ở production (cần cấu hình redirect URI trong Google Cloud Console) */}
						{process.env.NODE_ENV === 'production' && (
							<Button variant='outline' className='w-full h-13 py-3 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all font-semibold' onClick={handleGoogleLogin} disabled={loading}>
								<FaGoogle className='w-5 h-5 text-red-500 mr-2' />
								{isLogin ? 'Tiếp tục với Google' : 'Đăng ký bằng Google'}
							</Button>
						)}
						{/* Dev Quick Login – real token + mocked role */}
						{isLogin && process.env.NODE_ENV !== 'production' && (
							<div className='mt-4 pt-4 border-t border-dashed border-gray-200'>
								<div className='flex items-center gap-2 mb-3'>
									<FlaskConical className='h-3.5 w-3.5 text-amber-500' />
									<p className='text-xs text-amber-600 font-semibold uppercase tracking-wider'>Dev Mode — Mock Role + Real Token</p>
								</div>
								<p className='text-xs text-gray-400 mb-2'>Tự động đăng ký tài khoản mới lấy token thật, override role để test UI.</p>
								<div className='grid grid-cols-2 gap-2'>
									<Button
										variant='outline'
										size='sm'
										type='button'
										disabled={!!devLoading}
										className='border-primary/30 text-primary hover:bg-primary/10 text-xs h-9'
										onClick={() => devLogin('role-staff')}
									>
										{devLoading === 'staff' ? '⏳ Đang tạo...' : '🧑‍💼 Đăng nhập Staff'}
									</Button>
									<Button
										variant='outline'
										size='sm'
										type='button'
										disabled={!!devLoading}
										className='border-secondary/30 text-secondary hover:bg-secondary/10 text-xs h-9'
										onClick={() => devLogin('role-head-staff')}
									>
										{devLoading === 'head-staff' ? '⏳ Đang tạo...' : '⭐ Đăng nhập Head Staff'}
									</Button>
								</div>
							</div>
						)}

						<p className='text-center text-sm mt-2 text-gray-600'>
							{isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
							<Button variant='link' className='p-0 font-semibold text-secondary hover:text-secondary/80' onClick={toggleMode}>
								{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
							</Button>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
