'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthService } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
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
import { Edit, Search, UserCheck, AlertCircle } from 'lucide-react';

type IdentityUser = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  roles: string[];
  permissions: string[];
};

type RoleInfo = {
  id: string;
  name: string;
  permissions: string[];
};

export default function UserManagementPage() {
  const { currUser, isHeadStaff, canManageUsers } = useAuth();
  const { toast } = useToast();

  // Data from API
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // UI State
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IdentityUser | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Fetch users and roles on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch identities with roles and permissions
        const identitiesRes = await AuthService.authGatewayControllerFindIdentitiesV1(
          undefined, undefined, undefined, undefined, 100
        );
        if (identitiesRes.data?.identities) {
          setUsers(identitiesRes.data.identities);
        }

        // Fetch roles list
        const rolesRes = await AuthService.authGatewayControllerGetRoleListV1();
        if (rolesRes.data?.roles) {
          const rolesArray = Array.isArray(rolesRes.data.roles)
            ? rolesRes.data.roles
            : [rolesRes.data.roles];
          setRoles(rolesArray);
        }
      } catch (err: any) {
        console.error('Failed to fetch users:', err);
        toast({
          title: 'Lỗi tải dữ liệu',
          description: err?.body?.error || 'Không thể tải danh sách người dùng',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

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
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roles?.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  // Assign role to user
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;

    setIsLoading(true);
    try {
      await AuthService.authGatewayControllerAssignRoleToV1(selectedUser.id, {
        roleId: selectedRoleId,
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, roles: [...(u.roles || []), selectedRoleId] }
            : u
        )
      );

      toast({
        title: 'Thành công',
        description: `Đã gán vai trò cho ${selectedUser.fullName}`,
      });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRoleId('');
    } catch (err: any) {
      console.error('Failed to assign role:', err);
      toast({
        title: 'Lỗi',
        description: err?.body?.error || 'Không thể gán vai trò',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove role from user
  const handleRemoveRole = async (userId: string, roleId: string) => {
    setIsLoading(true);
    try {
      await AuthService.authGatewayControllerRemoveRoleFromV1(userId, {
        roleId: roleId,
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, roles: (u.roles || []).filter((r) => r !== roleId) }
            : u
        )
      );

      toast({
        title: 'Thành công',
        description: 'Đã xóa vai trò',
      });
    } catch (err: any) {
      console.error('Failed to remove role:', err);
      toast({
        title: 'Lỗi',
        description: err?.body?.error || 'Không thể xóa vai trò',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openRoleDialog = (user: IdentityUser) => {
    setSelectedUser(user);
    setSelectedRoleId('');
    setIsRoleDialogOpen(true);
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role?.name || roleId;
  };

  const getRoleBadgeColor = (roleId: string) => {
    if (roleId.includes('admin') || roleId.includes('head')) return 'bg-purple-100 text-purple-700';
    if (roleId.includes('staff')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const userCount = users.length;

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
                Quản lý vai trò và phân quyền hệ thống
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 max-w-5xl mx-auto gap-3 mt-6">
            {[
              { label: 'Tổng người dùng', value: userCount, color: 'bg-blue-400/30' },
              { label: 'Vai trò', value: roles.length, color: 'bg-purple-400/30' },
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
            <span className="text-sm text-gray-400">{filteredUsers.length} người dùng</span>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Họ và tên</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Username</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Vai trò</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Quyền hạn</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600 w-[120px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <UserCheck className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        {isLoading ? 'Đang tải...' : 'Không tìm thấy người dùng nào'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                          {user.fullName || user.username}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-gray-500 hidden sm:table-cell">{user.username}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || []).map((roleId) => (
                            <span
                              key={roleId}
                              className={`text-xs px-2 py-1 rounded inline-flex items-center font-medium ${getRoleBadgeColor(roleId)}`}
                            >
                              {getRoleName(roleId)}
                              <button
                                onClick={() => handleRemoveRole(user.id, roleId)}
                                className="ml-1 hover:text-red-500"
                                disabled={isLoading}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {(user.roles || []).length === 0 && (
                            <span className="text-gray-400 text-sm">Chưa có vai trò</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-500 text-sm">
                          {(user.permissions || []).length} quyền
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white border-gray-200 text-gray-700 hover:bg-primary/10 hover:text-primary gap-1.5 px-3"
                          onClick={() => openRoleDialog(user)}
                          disabled={user.id === currUser?.id || isLoading}
                        >
                          <Edit className="h-4 w-4" />
                          Vai trò
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Assign Role Dialog */}
          <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Quản lý vai trò</DialogTitle>
                <DialogDescription>
                  Gán vai trò mới cho <strong>{selectedUser?.fullName || selectedUser?.username}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Vai trò hiện tại</Label>
                  <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded">
                    {(selectedUser?.roles || []).length === 0 ? (
                      <span className="text-gray-400 text-sm">Chưa có vai trò</span>
                    ) : (
                      selectedUser?.roles?.map((roleId) => (
                        <span
                          key={roleId}
                          className={`text-xs px-2 py-1 rounded inline-flex items-center font-medium ${getRoleBadgeColor(roleId)}`}
                        >
                          {getRoleName(roleId)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="assign-role">Thêm vai trò mới</Label>
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger id="assign-role" className="bg-gray-100 border-gray-200">
                      <SelectValue placeholder="Chọn vai trò để gán" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg z-[300]">
                      {roles
                        .filter((role) => !selectedUser?.roles?.includes(role.id))
                        .map((role) => (
                          <SelectItem
                            key={role.id}
                            value={role.id}
                            className="text-gray-900 hover:bg-gray-100 cursor-pointer"
                          >
                            {role.name}
                          </SelectItem>
                        ))}
                      {roles.filter((role) => !selectedUser?.roles?.includes(role.id)).length === 0 && (
                        <SelectItem value="" disabled>
                          Không còn vai trò nào để gán
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)} disabled={isLoading}>
                  Đóng
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white"
                  onClick={handleAssignRole}
                  disabled={!selectedRoleId || isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Gán vai trò'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
