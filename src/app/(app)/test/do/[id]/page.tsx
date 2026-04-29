'use client';

import { TestInterface } from '@/components/TestInterface';
import { useParams } from 'next/navigation';

export default function TestDoPage() {
	const params = useParams();
	const id = params.id as string;
	
	return <TestInterface />;
}
