'use client';

import type { CSSProperties } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Mic,
  TrendingUp,
  Newspaper,
  FilePlus,
  ClipboardList,
  ClipboardCheck,
  Users,
  Settings,
  LogOut,
  Leaf,
  PanelLeftClose,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { clearUser } from './store/currUserSlice';
import { AuthService, clearApiToken } from '@/lib/api-client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from './ui/sidebar';

const learnerLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/test-selection', label: 'Chọn đề thi', icon: FileText },
  { href: '/flashcards', label: 'Flashcards', icon: BookOpen },
  { href: '/speaking-writing', label: 'Speaking & Writing', icon: Mic },
  { href: '/progress', label: 'Tiến độ', icon: TrendingUp },
  { href: '/history', label: 'Lịch sử', icon: ClipboardList },
  { href: '/blog', label: 'Blog', icon: Newspaper },
];

const staffLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/exam-creation', label: 'Tạo đề thi', icon: FilePlus },
  { href: '/exam-management', label: 'Quản lý đề thi', icon: ClipboardList },
  { href: '/blog-management', label: 'Quản lý Blog', icon: Newspaper },
];

const headStaffExtra = [
  { href: '/exam-approval', label: 'Duyệt đề thi', icon: ClipboardCheck },
  { href: '/user-management', label: 'Quản lý User', icon: Users },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isStaff, isHeadStaff } = useAuth();
  const user = useAppSelector((state) => state.currUser.current);
  const dispatch = useAppDispatch();
  const { toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    try {
      await AuthService.authGatewayControllerLogoutAllV1();
    } catch {}
    clearApiToken();
    document.cookie = 'user_authenticated=; path=/; max-age=0';
    dispatch(clearUser());
    window.location.href = '/auth';
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const navLinks = isStaff || isHeadStaff ? staffLinks : learnerLinks;
  const managementLinks = isHeadStaff ? headStaffExtra : [];
  const sidebarLabel = isStaff || isHeadStaff ? 'QUẢN LÝ' : 'HỌC TẬP';
  const userDisplayName = user?.fullName ?? 'Tài khoản';

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="border-none bg-transparent backdrop-blur-xl"
      style={
        {
          '--sidebar-width': '14.5rem',
          '--sidebar-width-icon': '3.5rem',
        } as CSSProperties
      }
    >
      <SidebarHeader className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 px-3 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:border-emerald-900/50 dark:from-slate-900 dark:to-emerald-950/30">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex min-w-0 items-center gap-3 text-left group-data-[collapsible=icon]:justify-center"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm ring-1 ring-emerald-300/40">
              <Leaf className="h-4.5 w-4.5 shrink-0" />
            </div>
            <span className="truncate text-lg font-display font-semibold text-emerald-600 group-data-[collapsible=icon]:hidden dark:text-emerald-400">
              EnglishPrep
            </span>
          </button>
          <button
            onClick={toggleSidebar}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-white/80 hover:text-foreground group-data-[collapsible=icon]:hidden dark:hover:bg-slate-900/80"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-2">
        <SidebarGroup className="pt-1">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {sidebarLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    onClick={() => router.push(link.href)}
                    isActive={isActive(link.href)}
                    tooltip={link.label}
                    size="lg"
                    className="rounded-2xl px-3 text-[15px] font-medium text-slate-700 data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700 data-[active=true]:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.14)] hover:bg-slate-50 dark:text-slate-200 dark:data-[active=true]:bg-emerald-950/40 dark:data-[active=true]:text-emerald-300 dark:hover:bg-slate-900/80"
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {managementLinks.length > 0 && (
          <>
            <SidebarSeparator className="my-2 bg-emerald-100 dark:bg-emerald-950/60" />
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                HỆ THỐNG
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {managementLinks.map((link) => (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        onClick={() => router.push(link.href)}
                        isActive={isActive(link.href)}
                        tooltip={link.label}
                        size="lg"
                        className="rounded-2xl px-3 text-[15px] font-medium text-slate-700 data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700 data-[active=true]:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.14)] hover:bg-slate-50 dark:text-slate-200 dark:data-[active=true]:bg-emerald-950/40 dark:data-[active=true]:text-emerald-300 dark:hover:bg-slate-900/80"
                      >
                        <link.icon className="h-5 w-5" />
                        <span>{link.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="px-2 pb-2 pt-0">
        <div className="rounded-3xl border border-slate-200 bg-white/92 p-2 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/user')}
                tooltip="Tài khoản"
                size="lg"
                className="rounded-2xl px-3 text-[15px] font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900/80"
              >
                <Settings className="h-5 w-5" />
                <span>{userDisplayName}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Đăng xuất"
                size="lg"
                className="rounded-2xl px-3 text-[15px] font-medium text-destructive hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/25"
              >
                <LogOut className="h-5 w-5" />
                <span>Đăng xuất</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
