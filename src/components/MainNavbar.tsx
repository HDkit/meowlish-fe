import React from 'react';
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import { Brain, ChevronDown, User, LogOut, Home, UserCircle, History, TrendingUp, BookOpen, FileText, GraduationCap, Menu, Clock, BarChart3 } from 'lucide-react';
import { User as UserType } from '../App';

interface MainNavbarProps {
  currentUser: UserType | null;
  onNavigateHome: () => void;
  onNavigateAuth: (mode: 'login' | 'register') => void;
  onNavigateTestSelection: (testType?: 'ielts' | 'toeic') => void;
  onNavigateDashboard: () => void;
  onNavigateProfile?: () => void;
  onNavigateHistory?: () => void;
  onNavigateProgress?: () => void;
  onNavigateTests?: () => void;
  onLogout: () => void;
}

export function MainNavbar({ 
  currentUser, 
  onNavigateHome, 
  onNavigateAuth, 
  onNavigateTestSelection,
  onNavigateDashboard,
  onNavigateProfile,
  onNavigateHistory,
  onNavigateProgress,
  onNavigateTests,
  onLogout 
}: MainNavbarProps) {

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={onNavigateHome}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold">EnglishAI Pro</span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {currentUser && (
            <Button variant="ghost" onClick={onNavigateDashboard}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          )}
          <Button variant="ghost" onClick={onNavigateTests}>
            <FileText className="h-4 w-4 mr-2" />
            Đề thi
          </Button>
        </nav>

        {/* Auth/User Menu */}
        <div className="flex items-center space-x-4">
          {!currentUser ? (
            <>
              <Button variant="ghost" onClick={() => onNavigateAuth('login')}>
                Đăng nhập
              </Button>
              <Button onClick={() => onNavigateAuth('register')}>
                Đăng ký
              </Button>
            </>
          ) : (
            <>
              {/* Desktop User Info + Logout */}
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" onClick={onNavigateProfile}>
                  <User className="h-4 w-4 mr-2" />
                  Người dùng
                </Button>
                <Button variant="ghost" onClick={onLogout} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </Button>
              </div>

              {/* Mobile Navigation */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      type="button"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 z-[100]">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigateDashboard();
                      }}
                      className="cursor-pointer"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigateTests?.();
                      }}
                      className="cursor-pointer"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Đề thi
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigateProfile?.();
                      }}
                      className="cursor-pointer"
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      Thông tin cá nhân
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigateHistory?.();
                      }}
                      className="cursor-pointer"
                    >
                      <History className="mr-2 h-4 w-4" />
                      Lịch sử làm bài
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigateProgress?.();
                      }}
                      className="cursor-pointer"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Tiến độ học tập
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        onLogout();
                      }}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}