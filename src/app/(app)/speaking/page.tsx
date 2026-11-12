'use client';

import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { AiUnavailableNotice } from '@/components/AiUnavailableNotice';
import { Button } from '@/components/ui/button';
import { AI_SERVICE_OPERATIONAL } from '@/lib/service-status';

const SPEAKING_APP_URL = 'https://lingriser.vercel.app/';

export default function SpeakingPage() {
	useEffect(() => {
		// While the AI service is down, stay here and explain instead of
		// sending visitors to a speaking app that can't grade them.
		if (AI_SERVICE_OPERATIONAL) window.location.replace(SPEAKING_APP_URL);
	}, []);

	if (!AI_SERVICE_OPERATIONAL) {
		return (
			<div className='mx-auto max-w-2xl py-6'>
				<AiUnavailableNotice feature='Luyện Nói (Speaking)' />
				<Button variant='outline' asChild>
					<a href={SPEAKING_APP_URL} target='_blank' rel='noopener noreferrer'>
						Vẫn mở trang Speaking
						<ExternalLink className='h-4 w-4' aria-hidden='true' />
					</a>
				</Button>
			</div>
		);
	}

	return (
		<div className='flex items-center justify-center min-h-[60vh]'>
			<p className='text-slate-500'>Đang chuyển hướng đến trang Speaking...</p>
		</div>
	);
}
