import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { UserCircle, Mail, Calendar, Edit2, Save, X } from 'lucide-react';
import type { User } from '../slop';

interface ProfileProps {
	user: User;
	onUpdateUser?: (updatedUser: User) => void;
}

export function Profile({ user, onUpdateUser }: ProfileProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedUser, setEditedUser] = useState({
		fullName: user.fullName,
		email: user.email,
	});

	const handleSave = () => {
		if (onUpdateUser) {
			onUpdateUser({
				...user,
				fullName: editedUser.fullName,
				email: editedUser.email,
			});
		}
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditedUser({
			fullName: user.fullName,
			email: user.email,
		});
		setIsEditing(false);
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='space-y-2'>
				<h1 className='text-3xl font-semibold'>Thông tin cá nhân</h1>
				<p className='text-muted-foreground'>Quản lý thông tin tài khoản và cài đặt cá nhân của bạn</p>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Profile Card */}
				<Card className='lg:col-span-2'>
					<CardHeader className='flex flex-row items-center justify-between'>
						<div>
							<CardTitle>Thông tin tài khoản</CardTitle>
							<CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
						</div>
						{!isEditing ? (
							<Button variant='outline' size='sm' onClick={() => setIsEditing(true)}>
								<Edit2 className='h-4 w-4 mr-2' />
								Chỉnh sửa
							</Button>
						) : (
							<div className='flex gap-2'>
								<Button size='sm' onClick={handleSave}>
									<Save className='h-4 w-4 mr-2' />
									Lưu
								</Button>
								<Button variant='outline' size='sm' onClick={handleCancel}>
									<X className='h-4 w-4 mr-2' />
									Hủy
								</Button>
							</div>
						)}
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Avatar */}
						<div className='flex items-center space-x-4'>
							<Avatar className='h-20 w-20'>
								<AvatarFallback>
									{user.fullName
										.split(' ')
										.map((n) => n[0])
										.join('')}
								</AvatarFallback>
							</Avatar>
							<div>
								<h3 className='font-medium'>{user.fullName}</h3>
								<p className='text-sm text-muted-foreground'>{user.email}</p>
							</div>
						</div>

						<Separator />

						{/* Personal Information */}
						<div className='space-y-4'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='fullName'>Họ và tên</Label>
									{isEditing ? (
										<Input
											id='fullName'
											value={editedUser.fullName}
											onChange={(e) => setEditedUser({ ...editedUser, fullName: e.target.value })}
										/>
									) : (
										<div className='p-2 bg-muted rounded-md'>{user.fullName}</div>
									)}
								</div>
								<div className='space-y-2'>
									<Label htmlFor='email'>Email</Label>
									{isEditing ? (
										<Input
											id='email'
											type='email'
											value={editedUser.email}
											onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
										/>
									) : (
										<div className='p-2 bg-muted rounded-md'>{user.email}</div>
									)}
								</div>
							</div>
						</div>

						<Separator />

						{/* Account Information */}
						<div className='space-y-4'>
							<h4 className='font-medium'>Thông tin tài khoản</h4>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='flex items-center space-x-3'>
									<Calendar className='h-4 w-4 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>Ngày tham gia</p>
										<p className='text-sm text-muted-foreground'>{user.createdAt.toLocaleDateString('vi-VN')}</p>
									</div>
								</div>
								<div className='flex items-center space-x-3'>
									<Mail className='h-4 w-4 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>Trạng thái email</p>
										<p className='text-sm text-green-600'>Đã xác thực</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Statistics Card */}
				<Card>
					<CardHeader>
						<CardTitle>Thống kê học tập</CardTitle>
						<CardDescription>Tổng quan về quá trình học tập</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='space-y-4'>
							<div className='flex justify-between items-center'>
								<span className='text-sm font-medium'>Tổng số bài thi</span>
								<span className='text-2xl font-semibold'>{user.progress.totalTests}</span>
							</div>

							<Separator />

							<div className='space-y-3'>
								<div className='flex justify-between items-center'>
									<span className='text-sm'>IELTS Score</span>
									<span className='font-semibold'>{user.progress.ieltsScore}</span>
								</div>
								<div className='flex justify-between items-center'>
									<span className='text-sm'>TOEIC Score</span>
									<span className='font-semibold'>{user.progress.toeicScore}</span>
								</div>
							</div>

							<Separator />

							<div className='space-y-3'>
								<div className='flex justify-between items-center'>
									<span className='text-sm'>Study Streak</span>
									<span className='font-semibold'>{user.progress.studyStreak} ngày</span>
								</div>
								<div className='flex justify-between items-center'>
									<span className='text-sm'>Tổng thời gian</span>
									<span className='font-semibold'>{Math.round(user.progress.totalStudyTime / 60)} giờ</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
