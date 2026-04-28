'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  LayoutDashboard, FileText, BookOpen, Mic, TrendingUp,
  Newspaper, FilePlus, ClipboardList, ClipboardCheck, Users,
  Settings, LogOut, Leaf, PanelLeftClose,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { clearUser } from './store/currUserSlice';
import { AuthService, clearApiToken } from '@/lib/api-client';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, useSidebar,
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

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + '/');

  const navLinks = isStaff || isHeadStaff ? staffLinks : learnerLinks;
  const managementLinks = isHeadStaff ? headStaffExtra : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
          >
            <Leaf className="h-6 w-6 text-primary shrink-0" />
            <span className="text-lg font-display font-semibold text-primary group-data-[collapsible=icon]:hidden">
              EnglishPrep
            </span>
          </button>
          <button onClick={toggleSidebar} className="group-data-[collapsible=icon]:hidden">
            <PanelLeftClose className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isStaff || isHeadStaff ? 'QUẢN LÝ' : 'HỌC TẬP'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    onClick={() => router.push(link.href)}
                    isActive={isActive(link.href)}
                    tooltip={link.label}
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
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>QUẢN LÝ HỆ THỐNG</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementLinks.map((link) => (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        onClick={() => router.push(link.href)}
                        isActive={isActive(link.href)}
                        tooltip={link.label}
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

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => router.push('/user')}
              tooltip="Cài đặt"
            >
              <Settings className="h-5 w-5" />
              <span>{user?.fullName ?? 'Cài đặt'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Đăng xuất"
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
