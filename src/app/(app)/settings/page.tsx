import type { Metadata } from 'next';
import { SettingsPage } from '@/components/SettingsPage';

export const metadata: Metadata = { title: 'Cài đặt' };

export default function Settings() {
	return <SettingsPage />;
}
