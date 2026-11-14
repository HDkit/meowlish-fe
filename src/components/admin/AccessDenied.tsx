import { ShieldAlert } from 'lucide-react';
import { StatePanel } from './DataTable';

export function AccessDenied({ description }: { description: string }) {
	return (
		<div className="mx-auto mt-10 max-w-lg rounded-xl border bg-card shadow-sm">
			<StatePanel icon={ShieldAlert} tone="danger" title="Không có quyền truy cập" description={description} />
		</div>
	);
}
