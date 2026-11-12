'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeGoogleLoginToken, isAdminRoleId } from '@/lib/api-client';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser } from '@/components/store/currUserSlice';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const dispatch = useAppDispatch();
	const [error, setError] = useState<string | null>(null);
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;

		const handleCallback = async () => {
			const errorParam = searchParams.get('error');
			if (errorParam) {
				setError(errorParam);
				setTimeout(() => router.push('/auth?mode=login'), 3000);
				return;
			}

			// The gateway redirects with a one-time login token; exchanging it sets the
			// HttpOnly session cookies. Tokens are never passed in the URL any more.
			const loginToken = searchParams.get('loginToken');
			if (!loginToken) {
				setError('Không nhận được mã đăng nhập');
				setTimeout(() => router.push('/auth?mode=login'), 2000);
				return;
			}

			try {
				const user = await exchangeGoogleLoginToken(loginToken);
				dispatch(setUser(user));
				router.push(isAdminRoleId(user.roleId) ? '/dashboard' : '/test-selection');
			} catch (err: any) {
				console.error('Auth callback error:', err);
				setError('Xác thực thất bại: ' + (err.message || 'Unknown error'));
				setTimeout(() => router.push('/auth?mode=login'), 3000);
			}
		};

		void handleCallback();
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
