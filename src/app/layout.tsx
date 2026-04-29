import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import StoreProvider from '@/lib/store/StoreProvider';
import { Toaster } from '@/components/ui/toaster';
import { ApiClientProvider } from '@/components/ApiClientProvider';
import { FloatingLeaves } from '@/components/FloatingLeaves';
import './globals.css';

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
            <FloatingLeaves count={8} opacity={0.2} />
            <ApiClientProvider>
              {children}
              <Toaster />
            </ApiClientProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
