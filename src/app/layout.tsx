import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import StoreProvider from '@/lib/store/StoreProvider';
import { Toaster } from '@/components/ui/toaster';
import { ApiClientProvider } from '@/components/ApiClientProvider';
import { FloatingLeaves } from '@/components/FloatingLeaves';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Lingriser — Luyện Thi IELTS & TOEIC Với AI',
    template: '%s | Lingriser',
  },
  description: 'Hệ thống luyện thi IELTS & TOEIC với AI chấm điểm tự động. Luyện Speaking, Writing, Reading, Listening hiệu quả với feedback tức thì.',
  keywords: ['luyện thi IELTS', 'luyện thi TOEIC', 'AI speaking', 'AI writing', 'luyện nói tiếng Anh', 'ôn thi IELTS online', 'học tiếng Anh với AI'],
  authors: [{ name: 'Lingriser' }],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Lingriser',
    title: 'Lingriser — Luyện Thi IELTS & TOEIC Với AI',
    description: 'Hệ thống luyện thi IELTS & TOEIC với AI chấm điểm tự động. Luyện Speaking, Writing, Reading, Listening hiệu quả với feedback tức thì.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lingriser — Luyện Thi IELTS & TOEIC Với AI',
    description: 'Hệ thống luyện thi IELTS & TOEIC với AI chấm điểm tự động.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={beVietnamPro.variable}>
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
