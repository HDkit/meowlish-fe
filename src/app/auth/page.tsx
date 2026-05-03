'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LandingNavbar } from '@/components/LandingNavbar';
import { AuthForm } from '@/components/AuthForm';
import { AuthService } from '@/lib/api-client';
import { setApiTokensState } from '@/lib/api-client';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser } from '@/components/store/currUserSlice';
import { jwtDecode } from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/types/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const normalizeRoleIdFromToken = (decoded: any): string => {
  const normalizedRoles = Array.isArray(decoded?.roles)
    ? decoded.roles.map((role: unknown) => String(role).toLowerCase())
    : [];
  const normalizedPermissions = Array.isArray(decoded?.permissions)
    ? decoded.permissions.map((permission: unknown) => String(permission).toLowerCase())
    : [];

  if (
    normalizedRoles.includes('admin') ||
    normalizedRoles.includes('head_staff') ||
    normalizedPermissions.includes('exam:approve') ||
    normalizedPermissions.includes('user:ban')
  ) {
    return 'role-head-staff';
  }

  if (
    normalizedRoles.includes('staff') ||
    normalizedPermissions.includes('exam:write')
  ) {
    return 'role-staff';
  }

  return 'role-learner';
};

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  useEffect(() => {
    const loginToken = searchParams.get('loginToken');
    if (!loginToken) return;

    const handleLoginToken = async () => {
      setIsProcessingToken(true);
      try {
        const res = await AuthService.authGatewayControllerGetGoogleTokensV1({ loginToken });
        const data = res.data as { accessToken?: string; refreshToken?: string };

        if (!data?.accessToken) {
          throw new Error('Không nhận được access token');
        }

        setApiTokensState(data.accessToken, data.refreshToken);
        document.cookie = `user_authenticated=true; path=/; max-age=2592000`;

        const decoded: any = jwtDecode(data.accessToken);
        const user: User = {
          id: decoded.sub || decoded.id || uuidv4(),
          email: decoded.email || decoded.mail || '',
          fullName: decoded.name || decoded.fullName || decoded.username || 'User',
          roleId: normalizeRoleIdFromToken(decoded),
          password: '***',
          status: 'active',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };

        dispatch(setUser(user));
        toast({ title: 'Đăng nhập thành công' });

        const isAdminRole = user.roleId === 'role-staff' || user.roleId === 'role-head-staff';
        router.push(isAdminRole ? '/dashboard' : '/test-selection');
      } catch (err: any) {
        console.error('Login token error:', err);
        toast({
          title: 'Đăng nhập thất bại',
          description: err.message || 'Không thể xác thực token đăng nhập',
          variant: 'destructive',
        });
        setIsProcessingToken(false);
      }
    };

    void handleLoginToken();
  }, [searchParams, dispatch, router, toast]);

  if (isProcessingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-gray-600 font-medium">Đang xử lý đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LandingNavbar />
      <AuthForm />
    </>
  );
}
