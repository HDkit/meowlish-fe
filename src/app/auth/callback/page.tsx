'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeGoogleLoginToken, isAdminRoleId } from '@/lib/api-client';
import { googleErrorMessage, googleFlowReturnPath } from '@/lib/google-oauth-result';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser } from '@/components/store/currUserSlice';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const dispatch = useAppDispatch();
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	// flow=link: linking Google to the signed-in account, which starts and ends on /user
	const isLink = searchParams.get('flow') === 'link';
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;

		const handleCallback = async () => {
			const flow = searchParams.get('flow');
			const fail = (message: string, delay = 3000) => {
				setError(message);
				const next = googleFlowReturnPath(flow, false);
				if (next) setTimeout(() => router.push(next), delay);
			};

			// The gateway redirects every failure here with an error code (never a JSON page).
			const errorParam = searchParams.get('error');
			if (errorParam) {
				fail(googleErrorMessage(errorParam));
				return;
			}

			// The gateway redirects with a one-time login token; exchanging it sets the
			// HttpOnly session cookies. Tokens are never passed in the URL any more.
			const loginToken = searchParams.get('loginToken');
			if (!loginToken) {
				fail('Không nhận được mã đăng nhập', 2000);
				return;
			}

			try {
				const user = await exchangeGoogleLoginToken(loginToken);
				dispatch(setUser(user));
				const next = googleFlowReturnPath(flow, true);
				if (next) {
					setNotice('Đã liên kết tài khoản Google.');
					setTimeout(() => router.push(next), 1500);
					return;
				}
				router.push(isAdminRoleId(user.roleId) ? '/dashboard' : '/test-selection');
			} catch (err: any) {
				console.error('Auth callback error:', err);
				fail('Xác thực thất bại: ' + (err.message || 'Unknown error'));
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
						<p className="text-gray-500">
							{isLink ? 'Đang quay lại trang tài khoản...' : 'Đang chuyển hướng về trang đăng nhập...'}
						</p>
					</div>
				) : notice ? (
					<div className="space-y-4">
						<div className="text-green-600 text-lg font-medium">{notice}</div>
						<p className="text-gray-500">Đang quay lại trang tài khoản...</p>
					</div>
				) : (
					<div className="space-y-4">
						<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
						<p className="text-gray-600 font-medium">
							{isLink ? 'Đang liên kết tài khoản Google...' : 'Đang xử lý đăng nhập...'}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
