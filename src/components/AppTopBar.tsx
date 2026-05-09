'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { SidebarTrigger } from './ui/sidebar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/test-selection': 'Chọn đề thi',
  '/flashcards': 'Flashcards',
  '/speaking': 'Lingriser Speaking',
  '/writing': 'Viết Bài (Writing)',
  '/speaking-writing': 'Luyện Nói & Viết',
  '/progress': 'Tiến độ học tập',
  '/history': 'Lịch sử làm bài',
  '/blog': 'Blog',
  '/exam-creation': 'Tạo đề thi',
  '/exam-management': 'Quản lý đề thi',
  '/blog-management': 'Quản lý Blog',
  '/report-management': 'Quản lý Báo cáo',
  '/exam-approval': 'Duyệt đề thi',
  '/user-management': 'Quản lý User',
  '/user': 'Thông tin cá nhân',
  '/chat': 'Phòng Chat',
  '/notifications': 'Thông báo',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/test/do/')) return 'Làm bài thi';
  if (pathname.startsWith('/test/')) return 'Chi tiết đề thi';
  if (pathname.startsWith('/results/')) return 'Kết quả bài thi';
  if (pathname.startsWith('/flashcards/')) return 'Bộ Flashcard';
  return '';
}

export function AppTopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname ?? '');

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-white/82 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/88">
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center gap-3 px-4 md:px-6 lg:px-8 xl:px-10">
        <SidebarTrigger className="md:hidden" />
        <h1 className="truncate text-xl font-semibold text-foreground">{title}</h1>
        <div className="ml-auto flex items-center gap-1">
          <NotificationDropdown />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
