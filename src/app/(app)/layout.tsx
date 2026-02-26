import type { Metadata } from 'next';
import { MainNavbar } from '@/components/MainNavbar';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
	title: 'AI English Exam Prep',
	description: 'Practice and improve your English skills',
};

export default function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<MainNavbar />
			<main className="flex-1 mx-auto relative w-full">
				{children}
			</main>
			<Toaster />
		</div>
	);
}
