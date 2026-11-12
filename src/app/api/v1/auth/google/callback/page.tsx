'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { exchangeGoogleLoginToken, isAdminRoleId } from '@/lib/api-client';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser } from '@/components/store/currUserSlice';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [error, setError] = useState<string | null>(null);
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;

		const handleCallback = async () => {
			try {
				const urlParams = new URLSearchParams(window.location.search);
				const errorParam = urlParams.get('error');
				if (errorParam) throw new Error(errorParam);

				// The gateway redirects here with a one-time login token. Exchanging it sets the
				// HttpOnly session cookies; no token ever reaches this page's JavaScript.
				const loginToken = urlParams.get('loginToken');
				if (!loginToken) {
					throw new Error('Không nhận được mã đăng nhập. Vui lòng thử lại.');
				}

				const user = await exchangeGoogleLoginToken(loginToken);
				dispatch(setUser(user));
				router.push(isAdminRoleId(user.roleId) ? '/dashboard' : '/test-selection');
			} catch (err: any) {
				console.error('Google callback error:', err);
				setError(err.message || 'Xác thực thất bại');
			}
		};

		void handleCallback();
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
