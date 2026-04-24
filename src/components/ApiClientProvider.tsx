'use client';

import { useEffect } from 'react';
import { setupApiClient } from '@/lib/api-client';

/**
 * ApiClientProvider – chạy phía client để khởi tạo OpenAPI singleton
 * với token lấy từ localStorage/cookie SAU khi hydration.
 *
 * Đặt component này cao nhất trong cây layout để đảm bảo token
 * luôn được inject trước khi bất kỳ API call nào xảy ra.
 */
export function ApiClientProvider({ children }: { children: React.ReactNode }) {
	if (typeof window !== 'undefined') {
		setupApiClient();
	}

	return <>{children}</>;
}
