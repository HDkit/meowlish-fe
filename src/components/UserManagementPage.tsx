'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/lib/hooks/useAuth';
import { RootState } from '@/lib/store/store';
import { addUser, updateUser, removeUser } from '@/components/store/userSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Search, UserCheck, AlertCircle } from 'lucide-react';
import { User } from '@/types/client';

type UserFormData = {
  email: string;
  password: string;
  fullName: string;
  roleId: string;
  status: 'active' | 'suspended' | 'banned';
};

export default function UserManagementPage() {
  const dispatch = useDispatch();
  const { currUser, isHeadStaff, canManageUsers } = useAuth();
  const users = useSelector((state: RootState) => state.users.list);
  const roles = useSelector((state: RootState) => state.roles.list);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    fullName: '',
    roleId: 'role-learner',
    status: 'active',
  });

  // Access check
  if (!currUser || !isHeadStaff || !canManageUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-96 shadow-lg border-red-100">
          <CardHeader className="bg-red-50 text-red-700 rounded-t-xl mb-4">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Truy cập bị từ chối
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-600 text-base">
              Bạn không có quyền quản lý người dùng trên hệ thống.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roleId === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      roleId: 'role-learner',
      status: 'active',
    });
  };

  const handleCreate = () => {
    if (!formData.email || !formData.password || !formData.fullName) return;

    const newUser: User = {
      id: `u-${Date.now()}`,
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      roleId: formData.roleId,
      status: formData.status,
      createdAt: Date.now(),
    };

    dispatch(addUser(newUser));
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedUser) return;

    const updatedUser: User = {
      ...selectedUser,
      email: formData.email,
      fullName: formData.fullName,
      roleId: formData.roleId,
      status: formData.status,
      // Only update password if provided
      ...(formData.password ? { password: formData.password } : {}),
    };

    dispatch(updateUser(updatedUser));
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    dispatch(removeUser(selectedUser.id));
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't prefill password
      fullName: user.fullName,
      roleId: user.roleId || 'role-learner',
      status: user.status || 'active',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Hoạt động</span>;
      case 'suspended':
        return <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Đình chỉ</span>;
      case 'banned':
        return <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Bị cấm</span>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role?.name || roleId;
  };

  const activeCount = users.filter((u) => u.status === 'active').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;
  const bannedCount = users.filter((u) => u.status === 'banned').length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <UserCheck className="h-6 w-6" />
                Quản lý người dùng
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Quản lý tài khoản, vai trò và phân quyền hệ thống
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={openCreateDialog} className="bg-white text-primary hover:bg-primary/10 font-semibold shadow border-0">
                <Plus className="mr-2 h-4 w-4" />
                Tạo người dùng
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 max-w-5xl mx-auto gap-3 mt-6">
            {[
              { label: 'Hoạt động', value: activeCount, color: 'bg-green-400/30' },
              { label: 'Đình chỉ', value: suspendedCount, color: 'bg-orange-400/30' },
              { label: 'Bị cấm', value: bannedCount, color: 'bg-red-400/30' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} backdrop-blur-sm rounded-xl px-4 py-3 text-center`}>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-primary-foreground/80 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50 border-gray-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-[200]">
                  <SelectItem value="all" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Tất cả vai trò</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id} className="text-gray-900 hover:bg-gray-100 cursor-pointer">
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-[200]">
                  <SelectItem value="all" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Hoạt động</SelectItem>
                  <SelectItem value="suspended" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Đình chỉ</SelectItem>
                  <SelectItem value="banned" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Bị cấm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-gray-400">{filteredUsers.length} người dùng</span>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Họ và tên</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Vai trò</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Ngày tham gia</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600 w-[120px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <UserCheck className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Không tìm thấy người dùng nào</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                          {user.fullName}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-gray-500 hidden sm:table-cell">{user.email}</td>
                      <td className="px-4 py-4">
                        <span className="text-gray-600 bg-gray-100 px-2.5 py-1 rounded inline-flex items-center font-medium capitalize">
                          {getRoleName(user.roleId || '')}
                        </span>
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(user.status || 'active')}</td>
                      <td className="px-4 py-4 text-gray-500 hidden md:table-cell">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white border-gray-200 text-gray-700 hover:bg-primary/10 hover:text-primary gap-1.5 px-3"
                            onClick={() => openEditDialog(user)}
                            disabled={user.id === currUser.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-none gap-1.5 px-3"
                            onClick={() => openDeleteDialog(user)}
                            disabled={user.id === currUser.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Create User Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Tạo người dùng mới</DialogTitle>
                <DialogDescription>
                  Thêm một tài khoản người dùng mới vào hệ thống
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="create-fullName">Họ và tên</Label>
                  <Input
                    id="create-fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="bg-gray-100 border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nguyenvana@example.com"
                    className="bg-gray-100 border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-password">Mật khẩu</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Nhập mật khẩu"
                    className="bg-gray-100 border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-role">Vai trò</Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                  >
                    <SelectTrigger id="create-role" className="bg-gray-100 border-gray-200">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent zIndex={300} className="bg-white border-gray-200 shadow-lg">
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id} className="text-gray-900 hover:bg-gray-100 cursor-pointer">
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-status">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="create-status" className="bg-gray-100 border-gray-200">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent zIndex={300} className="bg-white border-gray-200 shadow-lg">
                      <SelectItem value="active" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Hoạt động</SelectItem>
                      <SelectItem value="suspended" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Đình chỉ</SelectItem>
                      <SelectItem value="banned" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Bị cấm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white"
                  onClick={handleCreate}
                  disabled={!formData.email || !formData.password || !formData.fullName}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Xác nhận tạo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Sửa thông tin người dùng</DialogTitle>
                <DialogDescription>
                  Cập nhật thay đổi thông tin người dùng này
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-fullName">Họ và tên</Label>
                  <Input
                    id="edit-fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="bg-gray-100 border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-gray-100 border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-password">Mật khẩu mới (bỏ trống nếu không đổi)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Nhập mật khẩu mới"
                    className="bg-gray-100 border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-role">Vai trò</Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                  >
                    <SelectTrigger id="edit-role" className="bg-gray-100 border-gray-200">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent zIndex={300} className="bg-white border-gray-200 shadow-lg">
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id} className="text-gray-900 hover:bg-gray-100 cursor-pointer">
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-status">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="edit-status" className="bg-gray-100 border-gray-200">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent zIndex={300} className="bg-white border-gray-200 shadow-lg">
                      <SelectItem value="active" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Hoạt động</SelectItem>
                      <SelectItem value="suspended" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Đình chỉ</SelectItem>
                      <SelectItem value="banned" className="text-gray-900 hover:bg-gray-100 cursor-pointer">Bị cấm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Hủy
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleEdit}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Cập nhật
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa người dùng</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa <strong>{selectedUser?.fullName}</strong>? Hành động
                  này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-500 text-white border-0 shadow-none hover:bg-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xác nhận xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
