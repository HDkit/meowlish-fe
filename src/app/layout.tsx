import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import StoreProvider from '@/lib/store/StoreProvider';
import { Toaster } from '@/components/ui/toaster';
import { ApiClientProvider } from '@/components/ApiClientProvider';
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
