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

export default function GoogleCallbackPage() {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const handleCallback = async () => {
			try {
				// Try to parse tokens from URL query params first (if backend redirects with tokens)
				const urlParams = new URLSearchParams(window.location.search);
				let accessToken = urlParams.get('accessToken') || urlParams.get('token');
				let refreshToken = urlParams.get('refreshToken');

				// If no tokens in URL, try to get from page data (if backend rendered JSON)
				if (!accessToken) {
					// Check if there's a script tag with auth data
					const authDataScript = document.getElementById('auth-data');
					if (authDataScript) {
						try {
							const data = JSON.parse(authDataScript.textContent || '{}');
							if (data.accessToken) {
								accessToken = data.accessToken;
								refreshToken = data.refreshToken;
							}
						} catch {
							// Ignore parse error
						}
					}
				}

				if (!accessToken) {
					throw new Error('Không nhận được token xác thực. Vui lòng thử lại.');
				}

				const { accessToken: finalAccessToken, refreshToken: finalRefreshToken } = {
					accessToken,
					refreshToken,
				};

				// Store tokens
				setApiTokensState(accessToken, refreshToken);
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
			} catch (err: any) {
				console.error('Google callback error:', err);
				setError(err.message || 'Xác thực thất bại');
				setLoading(false);
			}
		};

		handleCallback();
	}, [router, dispatch]);

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
				<div className="text-center space-y-4">
					<div className="text-red-500 text-lg font-medium">{error}</div>
					<button
						onClick={() => router.push('/auth?mode=login')}
						className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
					>
						Quay lại đăng nhập
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
			<div className="text-center space-y-4">
				<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
				<p className="text-gray-600 font-medium">Đang xử lý đăng nhập Google...</p>
			</div>
		</div>
	);
}
