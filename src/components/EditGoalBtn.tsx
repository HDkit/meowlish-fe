import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { GoalsService } from '@/lib/api';
import { update_goal_req_dto_UpdateGoalDto } from '@/lib/api/models/update_goal_req_dto_UpdateGoalDto';
import { useToast } from '@/components/ui/use-toast';
import { GOAL_TYPES, type GoalType, GoalFormDialog } from './GoalFormDialog';

interface GoalData {
	date?: string;
	target: number;
	type: string;
}

interface EditGoalButtonProps {
	goal: GoalData;
	onGoalUpdated?: () => void;
}

const toDateInput = (value?: string): string => {
	const date = value ? new Date(value) : new Date();
	return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

export function EditGoalButton({ goal, onGoalUpdated }: EditGoalButtonProps) {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const type = (GOAL_TYPES as readonly string[]).includes(goal.type) ? (goal.type as GoalType) : 'IELTS';

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-accent/20 transition"
				title="Chỉnh sửa mục tiêu"
				aria-label="Chỉnh sửa mục tiêu"
			>
				<Pencil className="w-4 h-4 text-gray-700" />
			</button>

			<GoalFormDialog
				open={open}
				onOpenChange={setOpen}
				title="Chỉnh sửa mục tiêu"
				submitLabel="Cập nhật"
				initial={{ type: type, target: goal.target, date: toDateInput(goal.date) }}
				onSubmit={async (values) => {
					await GoalsService.goalGatewayControllerUpdateGoalV1({
						date: new Date(values.date).toISOString(),
						target: values.target,
						type: values.type as update_goal_req_dto_UpdateGoalDto.type,
					});
					toast({ title: 'Đã cập nhật mục tiêu thành công' });
					onGoalUpdated?.();
				}}
			/>
		</>
	);
}
