'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { SidebarTrigger } from './ui/sidebar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/test-selection': 'Chọn đề thi',
  '/flashcards': 'Flashcards',
  '/speaking-writing': 'Speaking & Writing',
  '/progress': 'Tiến độ học tập',
  '/history': 'Lịch sử làm bài',
  '/blog': 'Blog',
  '/exam-creation': 'Tạo đề thi',
  '/exam-management': 'Quản lý đề thi',
  '/blog-management': 'Quản lý Blog',
  '/exam-approval': 'Duyệt đề thi',
  '/user-management': 'Quản lý User',
  '/user': 'Thông tin cá nhân',
};

export function AppTopBar() {
  const pathname = usePathname();
  const title = pageTitles[pathname ?? ''] ?? '';

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
