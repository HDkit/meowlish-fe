import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import StoreProvider from '@/lib/store/StoreProvider';
import { MainNavbar } from '@/components/MainNavbar';
import { Toaster } from '@/components/ui/toaster';
import { setupApiClient } from '@/lib/api-client';
import './globals.css';

// Initialize API client configuration
setupApiClient();

export const metadata: Metadata = {
	title: 'AI English Exam Prep System',
	description: 'AI-powered English exam preparation with speaking and writing practice',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<StoreProvider>
					<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
						<div className="min-h-screen bg-background flex flex-col">
							<MainNavbar />
							<main className="flex-1 mx-auto relative w-full">
								{children}
							</main>
							<Toaster />
						</div>
					</ThemeProvider>
				</StoreProvider>
			</body>
		</html>
	);
}
