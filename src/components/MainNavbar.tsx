import { useAppSelector, useAppDispatch } from '../components/store/hook';
import { clearUser } from '../components/store/userSlice';
import { Brain, User as UserIcon, LogOut, Home, History, TrendingUp, FileText, Menu, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function MainNavbar() {
	const user = useAppSelector((state) => state.user.currentUser);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const handleLogout = () => {
		dispatch(clearUser());
		navigate('/auth');
	};

	return (
		<header className='border-b bg-white/95 backdrop-blur sticky top-0 z-50'>
			<div className='container mx-auto px-4 py-4 flex items-center justify-between'>
				{/* Logo */}
				<button
					onClick={() => navigate('/dashboard')}
					className='flex items-center space-x-2 hover:opacity-80 transition-opacity'
				>
					<Brain className='h-8 w-8 text-primary' />
					<span className='text-xl font-semibold'>EnglishAI Pro</span>
				</button>

				{/* Desktop Navigation */}
				{user && (
					<nav className='hidden md:flex items-center space-x-6'>
						<Button variant='ghost' onClick={() => navigate('/dashboard')}>
							<Home className='h-4 w-4 mr-2' />
							Dashboard
						</Button>
						<Button variant='ghost' onClick={() => navigate('/test-selection')}>
							<FileText className='h-4 w-4 mr-2' />
							Exam Selection
						</Button>
						<Button variant='ghost' onClick={() => navigate('/speaking-test')}>
							<Mic className='h-4 w-4 mr-2' />
							Speaking Test
						</Button>
					</nav>
				)}

				{/* User / Auth Buttons */}
				<div className='flex items-center space-x-4'>
					{user ? (
						<>
							{/* Desktop User Info + Logout */}
							<div className='hidden md:flex items-center space-x-2'>
								<Button variant='ghost' onClick={() => navigate('/user')}>
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
										<DropdownMenuItem onClick={() => navigate('/dashboard')}>
											<Home className='mr-2 h-4 w-4' />
											Dashboard
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => navigate('/speaking-test')}>
											<FileText className='mr-2 h-4 w-4' />
											Speaking Test
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => navigate('/progress')}>
											<TrendingUp className='mr-2 h-4 w-4' />
											Tiến độ học tập
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => navigate('/history')}>
											<History className='mr-2 h-4 w-4' />
											Lịch sử làm bài
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => navigate('/user')}>
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
							<Button variant='ghost' onClick={() => navigate('/auth')}>
								Đăng nhập
							</Button>
							<Button onClick={() => navigate('/auth')}>Đăng ký</Button>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
