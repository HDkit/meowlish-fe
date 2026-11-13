import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TestSelection } from '@/components/TestSelection';

export const metadata: Metadata = {
  title: 'Chọn Đề Thi',
  description: 'Chọn đề thi IELTS Academic hoặc TOEIC Listening & Reading. Đề thi chuẩn format, chấm điểm tự động.',
};

export default function TestSelectionPage() {
	// TestSelection keeps its filters in the URL (useSearchParams)
	return (
		<Suspense>
			<TestSelection />
		</Suspense>
	);
}
