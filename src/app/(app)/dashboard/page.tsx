'use client';

import { Dashboard } from '@/components/Dashboard';
import AdminDashboard from '@/components/AdminDashboard';
import { useAuth } from '@/lib/hooks/useAuth';

export default function DashboardPage() {
	const { isMod, isStaff, isHeadStaff } = useAuth();

	// Show AdminDashboard for mod, staff and head_staff
	if (isMod || isStaff || isHeadStaff) {
		return <AdminDashboard />;
	}
	
	// Show regular Dashboard for learners
	return <Dashboard />;
}
