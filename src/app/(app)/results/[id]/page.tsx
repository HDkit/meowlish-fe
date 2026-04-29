'use client';

import { TestResult } from '@/components/TestResult';
import { useParams } from 'next/navigation';

export default function ResultsPage() {
	const params = useParams();
	const id = params.id as string;
	
	return <TestResult />;
}
