'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setApiTokensState } from '@/lib/api-client';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser } from '@/components/store/currUserSlice';
import { jwtDecode } from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/types/client';
import { Loader2 } from 'lucide-react';

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

export default function AuthCallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const dispatch = useAppDispatch();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleCallback = () => {
			try {
				// Check for tokens in URL query params (backend redirect with tokens)
				const accessToken = searchParams.get('accessToken') || searchParams.get('token');
				const refreshToken = searchParams.get('refreshToken');
				const errorParam = searchParams.get('error');

				if (errorParam) {
					setError(decodeURIComponent(errorParam));
					setTimeout(() => router.push('/auth?mode=login'), 3000);
					return;
				}

				if (accessToken) {
					// Store tokens
					setApiTokensState(accessToken, refreshToken || undefined);
					document.cookie = `user_authenticated=true; path=/; max-age=2592000`;

					// Decode token and set user
					const decoded: any = jwtDecode(accessToken);
					const user: User = {
						id: decoded.sub || decoded.id || uuidv4(),
						email: decoded.email || decoded.mail || '',
						fullName: decoded.name || decoded.fullName || decoded.username || 'Google User',
						roleId: normalizeRoleIdFromToken(decoded),
						password: '***',
						status: 'active',
						createdAt: Date.now(),
						lastLoginAt: Date.now(),
					};

					dispatch(setUser(user));

					// Redirect based on role
					const isAdminRole = user.roleId === 'role-staff' || user.roleId === 'role-head-staff';
					router.push(isAdminRole ? '/dashboard' : '/test-selection');
				} else {
					// No tokens found, redirect to login
					setError('Không nhận được token xác thực');
					setTimeout(() => router.push('/auth?mode=login'), 2000);
				}
			} catch (err: any) {
				console.error('Auth callback error:', err);
				setError('Xác thực thất bại: ' + (err.message || 'Unknown error'));
				setTimeout(() => router.push('/auth?mode=login'), 3000);
			}
		};

		handleCallback();
	}, [searchParams, router, dispatch]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
			<div className="text-center">
				{error ? (
					<div className="space-y-4">
						<div className="text-red-500 text-lg font-medium">{error}</div>
						<p className="text-gray-500">Đang chuyển hướng về trang đăng nhập...</p>
					</div>
				) : (
					<div className="space-y-4">
						<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
						<p className="text-gray-600 font-medium">Đang xử lý đăng nhập...</p>
					</div>
				)}
			</div>
		</div>
	);
}
