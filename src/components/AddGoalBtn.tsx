import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Loader2 } from 'lucide-react';
import { GoalsService } from '@/lib/api';
import { set_goal_req_dto_SetGoalDto } from '@/lib/api/models/set_goal_req_dto_SetGoalDto';
import { useToast } from '@/components/ui/use-toast';

const GoalType = set_goal_req_dto_SetGoalDto.type;

interface AddGoalButtonProps {
	className?: string;
	onGoalUpdated?: () => void;
}

export function AddGoalButton({ className, onGoalUpdated }: AddGoalButtonProps) {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [target, setTarget] = useState(0);
	const [goalType, setGoalType] = useState<set_goal_req_dto_SetGoalDto.type>(GoalType.IELTS);
	const [dueDate, setDueDate] = useState<string>(new Date().toISOString().slice(0, 10));

	const handleAdd = async () => {
		if (target <= 0) {
			toast({ title: 'Điểm mục tiêu không hợp lệ', variant: 'destructive' });
			return;
		}
		setLoading(true);
		try {
			await GoalsService.goalGatewayControllerSetGoalV1({
				date: new Date(dueDate).toISOString(),
				target,
				type: goalType,
			});
			toast({ title: 'Đã đặt mục tiêu thành công' });
			onGoalUpdated?.();
			setOpen(false);
			setTarget(0);
			setGoalType(GoalType.IELTS);
			setDueDate(new Date().toISOString().slice(0, 10));
		} catch (err: any) {
			console.error('Failed to set goal:', err);
			toast({
				title: 'Không thể đặt mục tiêu',
				description: err?.body?.error || 'Đã xảy ra lỗi.',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className={`flex flex-col items-center justify-center p-6 hover:bg-accent/50 transition ${className}`}
			>
				<Plus className='h-6 w-6 mb-2 text-gray-700' />
			</button>

			{open && typeof document !== 'undefined' ? createPortal(
				<div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]'>
					<div className='bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full mx-4 animate-in fade-in zoom-in-95 duration-200 border border-gray-100'>
						<h2 className='text-xl font-bold mb-6 text-center text-gray-900'>Thêm Mục Tiêu Mới</h2>

						<div className='mb-4'>
							<label className='block text-sm font-semibold mb-2 text-gray-700'>Loại Bài Kiểm Tra</label>
							<select
								value={goalType}
								onChange={(e) => setGoalType(e.target.value as set_goal_req_dto_SetGoalDto.type)}
								className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all'
							>
								<option value={GoalType.IELTS}>IELTS</option>
								<option value={GoalType.TOEIC}>TOEIC</option>
								<option value={GoalType.VSTEP}>VSTEP</option>
								<option value={GoalType.TOEFL}>TOEFL</option>
							</select>
						</div>

						<div className='mb-4'>
							<label className='block text-sm font-semibold mb-2 text-gray-700'>Điểm Mục Tiêu</label>
							<input
								type='number'
								value={target}
								onChange={(e) => setTarget(Number(e.target.value))}
								className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all'
								placeholder='Nhập điểm mục tiêu'
							/>
						</div>

						<div className='mb-8'>
							<label className='block text-sm font-semibold mb-2 text-gray-700'>Ngày dự thi</label>
							<input
								type='date'
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all'
							/>
						</div>

						<div className='flex justify-end gap-3'>
							<button
								onClick={() => setOpen(false)}
								disabled={loading}
								className='px-5 py-2.5 font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
							>
								Hủy
							</button>
							<button
								onClick={handleAdd}
								disabled={loading}
								className='px-5 py-2.5 font-medium bg-primary text-white rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20 transition-all flex items-center gap-2'
							>
								{loading && <Loader2 className='h-4 w-4 animate-spin' />}
								Thêm
							</button>
						</div>
					</div>
				</div>,
				document.body
			) : null}
		</>
	);
}
