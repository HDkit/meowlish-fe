'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LandingNavbar } from '@/components/LandingNavbar';
import { AuthForm } from '@/components/AuthForm';
import { exchangeGoogleLoginToken, isAdminRoleId } from '@/lib/api-client';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser } from '@/components/store/currUserSlice';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  // The login token is single-use: don't let a re-run of the effect (StrictMode) spend it twice.
  const exchangedToken = useRef<string | null>(null);

  useEffect(() => {
    const loginToken = searchParams.get('loginToken');
    if (!loginToken || exchangedToken.current === loginToken) return;
    exchangedToken.current = loginToken;

    const handleLoginToken = async () => {
      setIsProcessingToken(true);
      try {
        // Swaps the one-time login token for the HttpOnly session cookies.
        const user = await exchangeGoogleLoginToken(loginToken);
        dispatch(setUser(user));
        toast({ title: 'Đăng nhập thành công' });

        router.push(isAdminRoleId(user.roleId) ? '/dashboard' : '/test-selection');
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
