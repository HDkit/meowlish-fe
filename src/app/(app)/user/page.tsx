'use client';

import { UserPage } from '@/components/UserPage';
import UserManagementPage from '@/components/UserManagementPage';
import { useAuth } from '@/lib/hooks/useAuth';

export default function UserProfilePage() {
	const { canManageUsers } = useAuth();
	
	// Show UserManagementPage for head_staff with user management permission
	if (canManageUsers) {
		return <UserManagementPage />;
	}
	
	// Show regular UserPage (profile) for others
	return <UserPage />;
}
