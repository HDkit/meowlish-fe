'use client';

import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { clearUser } from './store/currUserSlice';
import {
	Brain,
	User as UserIcon,
	LogOut,
	Home,
	History,
	TrendingUp,
	FileText,
	Menu,
	Mic,
	BookOpen,
	Star,
	StarHalf,
	Stars,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
	const dispatch = useAppDispatch();
	const router = useRouter();

	const handleLogout = () => {
		// Clear authentication cookie
		document.cookie = 'user_authenticated=; path=/; max-age=0';
		dispatch(clearUser());
		router.push('/auth');
	};

	return (
		<header className='border-b bg-background sticky top-0 z-50'>
			<div className='container mx-auto px-4 py-4 flex items-center justify-between'>
				{/* Logo */}
				<button
					onClick={() => router.push('/dashboard')}
					className='flex items-center space-x-2 hover:opacity-80 transition-opacity'
				>
					<Brain className='h-8 w-8 text-primary' />
					<span className='text-xl font-semibold'>EnglishAI Pro</span>
				</button>

				{/* Desktop Navigation */}
				{user && (
					<nav className='hidden md:flex items-center space-x-6'>
						<Button variant='ghost' onClick={() => router.push('/dashboard')}>
							<Home className='h-4 w-4 mr-2' />
							Dashboard
						</Button>
						<Button variant='ghost' onClick={() => router.push('/test-selection')}>
							<FileText className='h-4 w-4 mr-2' />
							Chọn đề thi
						</Button>
						<Button variant='ghost' onClick={() => router.push('/flashcards')}>
							<BookOpen className='h-4 w-4 mr-2' />
							Flashcards
						</Button>
						<Button variant='ghost' onClick={() => router.push('/blog')}>
							<FileText className='h-4 w-4 mr-2' />
							Blog
						</Button>
						<Button variant='ghost' onClick={() => router.push('/speaking-writing')}>
							<Stars className='h-4 w-4 mr-2' />
							AI Speaking & Writing
						</Button>
					</nav>
				)}

				{/* User / Auth Buttons */}
				<div className='flex items-center space-x-4'>
					{user ? (
						<>
							{/* Desktop User Info + Logout */}
							<div className='hidden md:flex items-center space-x-2'>
								<Button variant='ghost' onClick={() => router.push('/user')}>
									<UserIcon className='h-4 w-4 mr-2' />
									{user.fullName}
								</Button>
								<Button variant='ghost' onClick={handleLogout} className='text-red-600 hover:text-red-700'>
									<LogOut className='h-4 w-4 mr-2' />
									Đăng xuất
								</Button>
							</div>

							{/* Mobile Dropdown Menu */}
							<div className='md:hidden'>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant='ghost' size='sm' type='button'>
											<Menu className='h-5 w-5' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' className='w-56 z-[100]'>
										<DropdownMenuItem onClick={() => router.push('/dashboard')}>
											<Home className='mr-2 h-4 w-4' />
											Dashboard
										</DropdownMenuItem>
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
