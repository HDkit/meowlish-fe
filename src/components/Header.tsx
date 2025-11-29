import React from 'react';
import { Button } from './ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Brain, Home, BarChart3, User, ChevronLeft, BookOpen, LogOut, Settings } from 'lucide-react';
import type { User as UserType } from '../slop';

interface HeaderProps {
	currentView: string;
	currentUser: UserType | null;
	onNavigate: (view: 'dashboard' | 'progress' | 'test-selection') => void;
	onBackToDashboard: () => void;
	onLogout: () => void;
}

export function Header({ currentView, currentUser, onNavigate, onBackToDashboard, onLogout }: HeaderProps) {
	return (
		<header className='border-b bg-card'>
			<div className='container mx-auto px-4 py-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						{currentView !== 'dashboard' && (
							<Button variant='ghost' size='sm' onClick={onBackToDashboard} className='flex items-center gap-2'>
								<ChevronLeft className='h-4 w-4' />
								Back
							</Button>
						)}

						<div className='flex items-center gap-3'>
							<div className='flex items-center gap-2'>
								<Brain className='h-8 w-8 text-primary' />
								<div>
									<h1 className='text-xl font-semibold'>AI English Prep</h1>
									<p className='text-sm text-muted-foreground'>IELTS & TOEIC Practice System</p>
								</div>
							</div>
						</div>
					</div>

					<nav className='flex items-center gap-2'>
						<Button
							variant={currentView === 'dashboard' ? 'default' : 'ghost'}
							size='sm'
							onClick={() => onNavigate('dashboard')}
							className='flex items-center gap-2'
						>
							<Home className='h-4 w-4' />
							Trang chủ
						</Button>

						<Button
							variant={currentView === 'test-selection' ? 'default' : 'ghost'}
							size='sm'
							onClick={() => onNavigate('test-selection')}
							className='flex items-center gap-2'
						>
							<BookOpen className='h-4 w-4' />
							Chọn đề thi
						</Button>

						<Button
							variant={currentView === 'progress' ? 'default' : 'ghost'}
							size='sm'
							onClick={() => onNavigate('progress')}
							className='flex items-center gap-2'
						>
							<BarChart3 className='h-4 w-4' />
							Tiến độ
						</Button>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' size='sm' className='flex items-center gap-2'>
									<Avatar className='h-6 w-6'>
										<AvatarFallback className='text-xs'>
											{currentUser?.fullName?.charAt(0).toUpperCase() || 'U'}
										</AvatarFallback>
									</Avatar>
									<span className='hidden md:inline'>{currentUser?.fullName}</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-56'>
								<DropdownMenuItem className='flex items-center gap-2'>
									<User className='h-4 w-4' />
									Thông tin cá nhân
								</DropdownMenuItem>
								<DropdownMenuItem className='flex items-center gap-2'>
									<Settings className='h-4 w-4' />
									Cài đặt
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={onLogout} className='flex items-center gap-2 text-red-600'>
									<LogOut className='h-4 w-4' />
									Đăng xuất
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</nav>
				</div>
			</div>
		</header>
	);
}
