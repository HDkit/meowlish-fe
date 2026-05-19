'use client';

import { useEffect } from 'react';

export default function SpeakingPage() {
	useEffect(() => {
		const target = `https://lingriser.vercel.app/`;
		window.location.replace(target);
	}, []);

	return (
		<div className='flex items-center justify-center min-h-[60vh]'>
			<p className='text-slate-500'>Đang chuyển hướng đến trang Speaking...</p>
		</div>
	);
}
