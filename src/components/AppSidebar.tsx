'use client';

import type { CSSProperties } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  CircleUserRound,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Bell,
  Flag,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { clearUser } from './store/currUserSlice';
import { logoutSession } from '@/lib/api-client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './ui/sidebar';

type NavLink = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; links: NavLink[] };

const learnerGroups: NavGroup[] = [
  {
    label: 'Học tập',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/test-selection', label: 'Chọn đề thi', icon: FileText },
      { href: '/speaking', label: 'Luyện Nói', icon: Mic },
      { href: '/flashcards', label: 'Flashcards', icon: BookOpen },
      { href: '/progress', label: 'Tiến độ', icon: TrendingUp },
    ],
  },
  {
    label: 'Cộng đồng',
    links: [
      { href: '/blog', label: 'Blog', icon: Newspaper },
      { href: '/forum', label: 'Diễn đàn', icon: MessagesSquare },
      { href: '/chat', label: 'Phòng Chat', icon: MessageCircle },
    ],
  },
  {
    label: 'Cập nhật',
    links: [
      { href: '/notifications', label: 'Thông báo', icon: Bell },
      { href: '/changelog', label: 'Có gì mới', icon: Sparkles },
      { href: '/settings', label: 'Cài đặt', icon: Settings },
    ],
  },
];

const managementLinks: NavLink[] = [
  { href: '/exam-creation', label: 'Tạo đề thi', icon: FilePlus },
  { href: '/exam-management', label: 'Quản lý đề thi', icon: ClipboardList },
  { href: '/blog-management', label: 'Quản lý Blog', icon: Newspaper },
];

// Exam approval needs EXAM_APPROVE and user management the admin role, which mods don't have.
const modExtraLinks: NavLink[] = [];

const headStaffExtra: NavLink[] = [
  { href: '/exam-approval', label: 'Duyệt đề thi', icon: ClipboardCheck },
  { href: '/user-management', label: 'Quản lý User', icon: Users },
  { href: '/report-management', label: 'Quản lý Báo cáo', icon: Flag },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMod, isStaff, isHeadStaff } = useAuth();
  const user = useAppSelector((state) => state.currUser.current);
  const dispatch = useAppDispatch();
  const { toggleSidebar, isMobile } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    // POST /auth/logout clears the HttpOnly session cookies and the routing hint.
    await logoutSession();
    dispatch(clearUser());
    window.location.href = '/auth';
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  // Tránh hydration mismatch: dùng giá trị mặc định cho server, cập nhật sau khi mount
  const extraLinks = mounted
    ? isHeadStaff
      ? [...managementLinks, ...headStaffExtra]
      : isStaff
        ? managementLinks
        : isMod
          ? [...managementLinks, ...modExtraLinks]
          : []
    : [];
  const groups: NavGroup[] = extraLinks.length > 0
    ? [...learnerGroups, { label: 'Quản lý', links: extraLinks }]
    : learnerGroups;
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
      <SidebarHeader className="px-3 pt-3 pb-2 group-data-[collapsible=icon]:px-2">
        {/* Expanded: logo + collapse button. Collapsed (icon rail): the slot becomes the expand button. */}
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 py-3 pl-4 pr-2 shadow-[0_12px_36px_rgba(15,23,42,0.08)] group-data-[collapsible=icon]:hidden">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex min-w-0 items-center"
            aria-label="Lingriser, về Dashboard"
          >
            <Image src="/logos/logo.svg" alt="Lingriser" width={110} height={30} priority />
          </button>
          {!isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label="Thu gọn thanh bên"
                  data-testid="sidebar-collapse"
                  className="ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                >
                  <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Thu gọn thanh bên <span className="ml-1.5 opacity-70">Ctrl+B</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Mở rộng thanh bên"
              data-testid="sidebar-expand"
              className="mx-auto hidden size-10 items-center justify-center rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 text-emerald-700 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 group-data-[collapsible=icon]:inline-flex"
            >
              <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Mở rộng thanh bên <span className="ml-1.5 opacity-70">Ctrl+B</span>
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-1.5">
            <SidebarGroupLabel className="px-3 text-xs font-semibold text-slate-500">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.links.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      onClick={() => router.push(link.href)}
                      isActive={isActive(link.href)}
                      tooltip={link.label}
                      size="lg"
                      className="rounded-2xl px-3 text-[15px] font-medium text-slate-700 data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700 data-[active=true]:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.14)] hover:bg-slate-50"
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-2 pb-2 pt-0">
        <div className="rounded-3xl border border-slate-200 bg-white/92 p-2 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/user')}
                tooltip="Tài khoản"
                size="lg"
                className="rounded-2xl px-3 text-[15px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <CircleUserRound className="h-5 w-5" />
                <span suppressHydrationWarning>{userDisplayName}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Đăng xuất"
                size="lg"
                className="rounded-2xl px-3 text-[15px] font-medium text-destructive hover:bg-red-50 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span>Đăng xuất</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
      <SidebarRail title="Thu gọn / mở rộng thanh bên (Ctrl+B)" />
    </Sidebar>
  );
}
