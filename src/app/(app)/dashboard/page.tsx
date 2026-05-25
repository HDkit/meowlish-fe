'use client';

import { Dashboard } from '@/components/Dashboard';
import AdminDashboard from '@/components/AdminDashboard';
import { useAuth } from '@/lib/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookOpen, Settings } from 'lucide-react';

export default function DashboardPage() {
	const { isMod, isStaff, isHeadStaff } = useAuth();
	const isAdmin = isMod || isStaff || isHeadStaff;

	if (!isAdmin) {
		return <Dashboard />;
	}

	return (
		<Tabs defaultValue="admin" className="w-full">
			<TabsList className="mb-6">
				<TabsTrigger value="admin" className="gap-1.5">
					<Settings className="h-4 w-4" />
					Quản lý
				</TabsTrigger>
				<TabsTrigger value="learning" className="gap-1.5">
					<BookOpen className="h-4 w-4" />
					Học tập
				</TabsTrigger>
			</TabsList>
			<TabsContent value="admin">
				<AdminDashboard />
			</TabsContent>
			<TabsContent value="learning">
				<Dashboard />
			</TabsContent>
		</Tabs>
	);
}
