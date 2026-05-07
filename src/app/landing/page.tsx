import type { Metadata } from 'next';
import { LandingNavbar } from '@/components/LandingNavbar';
import { LandingPage } from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'Luyện Thi IELTS & TOEIC Với AI',
  description: 'Hệ thống luyện thi IELTS & TOEIC với AI chấm điểm tự động. Luyện Speaking, Writing thông minh, nhận feedback tức thì.',
  openGraph: {
    title: 'Lingriser — Luyện Thi IELTS & TOEIC Với AI',
    description: 'Hệ thống luyện thi IELTS & TOEIC với AI chấm điểm tự động. Luyện Speaking, Writing thông minh, nhận feedback tức thì.',
  },
};

export default function Landing() {
  return (
    <>
      <LandingNavbar />
      <LandingPage />
    </>
  );
}
