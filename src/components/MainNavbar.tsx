'use client';

import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { clearUser } from './store/currUserSlice';
import { useAuth } from '@/lib/hooks/useAuth';
import {
	Brain,
	User as UserIcon,
	LogOut,
	Home,
	History,
	TrendingUp,
	FileText,
	Menu,
	BookOpen,
	Stars,
	ClipboardCheck,
	Users,
	FilePlus,
	PenSquare,
	ClipboardList,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function MainNavbar() {
	const user = useAppSelector((state) => state.currUser.current);
	const { isStaff, isHeadStaff, canApproveExams, canManageUsers } = useAuth();
	const dispatch = useAppDispatch();
	const router = useRouter();
	const pathname = usePathname();

	const handleLogout = () => {
		document.cookie = 'user_authenticated=; path=/; max-age=0';
		dispatch(clearUser());
		window.location.href = '/auth';
	};

	const handleLogoClick = () => {
		router.push('/landing');
	};

	const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');
	const getNavClass = (path: string) => {
		return isActive(path)
			? 'text-blue-600 bg-transparent hover:bg-slate-50 relative after:absolute after:-bottom-[17px] after:left-0 after:h-[3px] after:w-full after:bg-blue-600 after:rounded-t-md'
			: 'text-gray-500 hover:text-gray-900 bg-transparent hover:bg-slate-50 relative after:absolute after:-bottom-[17px] after:left-0 after:h-[3px] after:w-full after:bg-transparent';
	};

	return (
		<header className='border-b bg-background sticky top-0 z-50'>
			<div className='container mx-auto px-4 py-4 flex items-center'>
				{/* Logo */}
				<button
					onClick={handleLogoClick}
					className='flex items-center space-x-2 hover:opacity-80 transition-opacity'
				>
					<Brain className='h-8 w-8 text-primary' />
					<span className='text-xl font-semibold'>EnglishAI Pro</span>
				</button>

				{/* Desktop Navigation */}
				{user && (
					<nav className='hidden md:flex items-center space-x-2 lg:space-x-4 flex-1 justify-center'>
						<Button variant='ghost' className={getNavClass('/dashboard')} onClick={() => router.push('/dashboard')}>
							<Home className='h-4 w-4 mr-2' />
							Dashboard
						</Button>

						{/* Staff & Head Staff */}
						{(isStaff || isHeadStaff) && (
							<>
								<Button variant='ghost' className={getNavClass('/exam-creation')} onClick={() => router.push('/exam-creation')}>
									<FilePlus className='h-4 w-4 mr-2' />
									Tạo đề thi
								</Button>
								<Button variant='ghost' className={getNavClass('/exam-management')} onClick={() => router.push('/exam-management')}>
									<ClipboardList className='h-4 w-4 mr-2' />
									Quản lý đề thi
								</Button>
								<Button variant='ghost' className={getNavClass('/blog-management')} onClick={() => router.push('/blog-management')}>
									<PenSquare className='h-4 w-4 mr-2' />
									Quản lý Blog
								</Button>
							</>
						)}

						{/* Head Staff Only */}
						{isHeadStaff && canApproveExams && (
							<Button variant='ghost' className={getNavClass('/exam-approval')} onClick={() => router.push('/exam-approval')}>
								<ClipboardCheck className='h-4 w-4 mr-2' />
								Duyệt đề thi
							</Button>
						)}
						{isHeadStaff && canManageUsers && (
							<Button variant='ghost' className={getNavClass('/user-management')} onClick={() => router.push('/user-management')}>
								<Users className='h-4 w-4 mr-2' />
								Quản lý User
							</Button>
						)}

						{/* Learner Menu Items */}
						{!isStaff && !isHeadStaff && (
							<>
								<Button variant='ghost' className={getNavClass('/test-selection')} onClick={() => router.push('/test-selection')}>
									<FileText className='h-4 w-4 mr-2' />
									Chọn đề thi
								</Button>
								<Button variant='ghost' className={getNavClass('/flashcards')} onClick={() => router.push('/flashcards')}>
									<BookOpen className='h-4 w-4 mr-2' />
									Flashcards
								</Button>
								<Button variant='ghost' className={getNavClass('/blog')} onClick={() => router.push('/blog')}>
									<FileText className='h-4 w-4 mr-2' />
									Blog
								</Button>
								<Button variant='ghost' className={getNavClass('/speaking-writing')} onClick={() => router.push('/speaking-writing')}>
									<Stars className='h-4 w-4 mr-2' />
									AI Speaking &amp; Writing
								</Button>
							</>
						)}
					</nav>
				)}

				{/* User / Auth Buttons */}
				<div className='flex items-center space-x-4 ml-auto'>
					{user ? (
						<>
							{/* Desktop User Info + Logout */}
							<div className='hidden md:flex items-center space-x-2'>
								<Button variant='ghost' onClick={() => router.push('/user')}>
									<UserIcon className='h-4 w-4 mr-2' />
									{user.fullName}
								</Button>
								<Button variant='ghost' onClick={handleLogout} className='text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'>
									<LogOut className='h-4 w-4 mr-2' />
									Đăng xuất
								</Button>
							</div>

							{/* Mobile Dropdown Menu */}
							<div className='md:hidden'>
								<DropdownMenu modal={false}>
									<DropdownMenuTrigger asChild>
										<Button variant='ghost' size='sm' type='button'>
											<Menu className='h-5 w-5' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' className='w-56 z-[100] bg-white dark:bg-slate-950'>
										<DropdownMenuItem onClick={() => router.push('/dashboard')}>
											<Home className='mr-2 h-4 w-4' />
											Dashboard
										</DropdownMenuItem>

										{/* Staff & Head Staff */}
										{(isStaff || isHeadStaff) && (
											<>
												<DropdownMenuItem onClick={() => router.push('/exam-creation')}>
													<FilePlus className='mr-2 h-4 w-4' />
													Tạo đề thi
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => router.push('/exam-management')}>
													<ClipboardList className='mr-2 h-4 w-4' />
													Quản lý đề thi
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => router.push('/blog-management')}>
													<PenSquare className='mr-2 h-4 w-4' />
													Quản lý Blog
												</DropdownMenuItem>
											</>
										)}

										{/* Head Staff Only */}
										{isHeadStaff && canApproveExams && (
											<DropdownMenuItem onClick={() => router.push('/exam-approval')}>
												<ClipboardCheck className='mr-2 h-4 w-4' />
												Duyệt đề thi
											</DropdownMenuItem>
										)}
										{isHeadStaff && canManageUsers && (
											<DropdownMenuItem onClick={() => router.push('/user-management')}>
												<Users className='mr-2 h-4 w-4' />
												Quản lý User
											</DropdownMenuItem>
										)}

										{/* Learner Menu Items */}
										{!isStaff && !isHeadStaff && (
											<>
												<DropdownMenuItem onClick={() => router.push('/test-selection')}>
													<FileText className='mr-2 h-4 w-4' />
													Chọn đề thi
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => router.push('/flashcards')}>
													<BookOpen className='mr-2 h-4 w-4' />
													Flashcards
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => router.push('/blog')}>
													<FileText className='mr-2 h-4 w-4' />
													Blog
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => router.push('/progress')}>
													<TrendingUp className='mr-2 h-4 w-4' />
													Tiến độ học tập
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => router.push('/history')}>
													<History className='mr-2 h-4 w-4' />
													Lịch sử làm bài
												</DropdownMenuItem>
											</>
										)}

										{/* User Profile - All users */}
										<DropdownMenuItem onClick={() => router.push('/user')}>
											<UserIcon className='mr-2 h-4 w-4' />
											Thông tin cá nhân
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={handleLogout} className='text-red-600 focus:text-red-600'>
											<LogOut className='mr-2 h-4 w-4' />
											Đăng xuất
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</>
					) : (
						<>
							{/* Guest Buttons */}
							<Button
								variant='outline'
								onClick={() => router.push('/auth')}
								className='border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold transition-all shadow-sm hover:shadow-md'
							>
								Đăng nhập
							</Button>
							<Button
								onClick={() => router.push('/auth?mode=register')}
								className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all'
							>
								Đăng ký
							</Button>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
