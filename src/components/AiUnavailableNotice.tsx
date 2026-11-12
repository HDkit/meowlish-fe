import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AI_SERVICE_NOTICE, AI_SERVICE_OPERATIONAL } from '@/lib/service-status';

/** Inline notice for pages whose core feature depends on the AI service. */
export function AiUnavailableNotice({ feature }: { feature: string }) {
	if (AI_SERVICE_OPERATIONAL) return null;

	return (
		<Alert data-testid='ai-unavailable-notice' className='mb-5 border-amber-200 bg-amber-50 text-amber-900'>
			<TriangleAlert className='text-amber-600' aria-hidden='true' />
			<AlertTitle>{AI_SERVICE_NOTICE.title}</AlertTitle>
			<AlertDescription className='text-amber-900/90'>
				<p>
					{feature} cần dịch vụ AI để chấm điểm và phản hồi, nên hiện tại sẽ không trả kết quả. Bạn vẫn có thể luyện
					các phần thi khác, flashcard và blog như bình thường.
				</p>
				<p className='italic text-amber-800/80'>{AI_SERVICE_NOTICE.english}</p>
			</AlertDescription>
		</Alert>
	);
}
