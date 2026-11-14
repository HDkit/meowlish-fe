import { useState } from 'react';
import { Plus } from 'lucide-react';
import { GoalsService } from '@/lib/api';
import { set_goal_req_dto_SetGoalDto } from '@/lib/api/models/set_goal_req_dto_SetGoalDto';
import { useToast } from '@/components/ui/use-toast';
import { GoalFormDialog } from './GoalFormDialog';

interface AddGoalButtonProps {
	className?: string;
	onGoalUpdated?: () => void;
}

export function AddGoalButton({ className, onGoalUpdated }: AddGoalButtonProps) {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				aria-label="Thêm mục tiêu"
				onClick={() => setOpen(true)}
				className={`flex flex-col items-center justify-center p-6 hover:bg-accent/50 transition ${className ?? ''}`}
			>
				<Plus className="h-6 w-6 mb-2 text-gray-700" />
			</button>

			<GoalFormDialog
				open={open}
				onOpenChange={setOpen}
				title="Thêm mục tiêu mới"
				submitLabel="Thêm"
				onSubmit={async (values) => {
					await GoalsService.goalGatewayControllerSetGoalV1({
						date: new Date(values.date).toISOString(),
						target: values.target,
						type: values.type as set_goal_req_dto_SetGoalDto.type,
					});
					toast({ title: 'Đã đặt mục tiêu thành công' });
					onGoalUpdated?.();
				}}
			/>
		</>
	);
}
