'use client';

import { ExamDetailPage } from '@/components/TestDetail';
import { useParams } from 'next/navigation';

export default function TestDetailPage() {
	const params = useParams();
	const id = params.id as string;
	
	return <ExamDetailPage />;
}
