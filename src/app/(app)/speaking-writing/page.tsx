'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SpeakingWritingRedirect() {
	const router = useRouter();

	useEffect(() => {
		router.replace('/speaking');
	}, [router]);

	return null;
}
