'use client';

import { Dashboard } from '@/components/Dashboard';
import AdminDashboard from '@/components/AdminDashboard';
import { useAuth } from '@/lib/hooks/useAuth';

export default function DashboardPage() {
	const { isStaff, isHeadStaff } = useAuth();
	
	// Show AdminDashboard for staff and head_staff
	if (isStaff || isHeadStaff) {
		return <AdminDashboard />;
	}
	
	// Show regular Dashboard for learners
	return <Dashboard />;
}
