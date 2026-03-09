import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { Pencil } from 'lucide-react';
import { updateGoal } from './store/goalSlice';
import { Goal, TestType } from '../types/client';
import { useAppSelector } from './store/main/hook';
import { useRouter } from 'next/navigation';

interface EditGoalButtonProps {
	goal: Goal;
	className?: string;
}

export function EditGoalButton({ goal, className }: EditGoalButtonProps) {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const router = useRouter();
	const dispatch = useDispatch();

	useEffect(() => {
		if (!currentUser) {
			router.push('/auth'); // redirect if not logged in
		}
	}, [currentUser, router]);

	const [open, setOpen] = useState(false);
	const [target, setTarget] = useState(goal.target);
	const [testType, setTestType] = useState<Goal['testType']>(goal.testType);
	const [dueDate, setDueDate] = useState<string>('');

	// Initialize dueDate when modal opens
	useEffect(() => {
		if (open) {
			const date = new Date(goal.dueDate);
			if (!isNaN(date.getTime())) {
				setDueDate(date.toISOString().slice(0, 10));
			} else {
				setDueDate(new Date().toISOString().slice(0, 10));
			}
			setTarget(goal.target);
			setTestType(goal.testType);
		}
	}, [open, goal]);

	const handleUpdate = () => {
		dispatch(
			updateGoal({
				userId: currentUser!.id,
				id: goal.id,
				testType,
				target,
				dueDate: new Date(dueDate).getTime(),
			})
		);
		setOpen(false);
	};

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className='w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-accent/20 transition'
				title='Edit Goal'
			>
				<Pencil className='w-4 h-4 text-gray-700' />
			</button>

			{open && typeof document !== 'undefined' ? createPortal(
				<div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]'>
					<div className='bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full mx-4 animate-in fade-in zoom-in-95 duration-200 border border-gray-100'>
						<h2 className='text-xl font-bold mb-6 text-center text-gray-900'>Chỉnh sửa mục tiêu</h2>

						{/* Goal Test Type */}
						<div className='mb-4'>
							<label className='block text-sm font-semibold mb-2 text-gray-700'>Loại Bài Kiểm Tra</label>
							<select
								value={testType}
								onChange={(e) => setTestType(e.target.value as Goal['testType'])}
								className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
							>
								<option value={TestType.IELTS}>IELTS</option>
								<option value={TestType.TOEIC}>TOEIC</option>
							</select>
						</div>

						{/* Target Score */}
						<div className='mb-4'>
							<label className='block text-sm font-semibold mb-2 text-gray-700'>Điểm Mục Tiêu</label>
							<input
								type='number'
								value={target}
								onChange={(e) => setTarget(Number(e.target.value))}
								className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
								placeholder='Nhập điểm mục tiêu'
							/>
						</div>

						{/* Due Date */}
						<div className='mb-8'>
							<label className='block text-sm font-semibold mb-2 text-gray-700'>Ngày dự thi</label>
							<input
								type='date'
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
							/>
						</div>

						{/* Buttons */}
						<div className='flex justify-end gap-3'>
							<button
								onClick={() => setOpen(false)}
								className='px-5 py-2.5 font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
							>
								Hủy
							</button>
							<button
								onClick={handleUpdate}
								className='px-5 py-2.5 font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all'
							>
								Cập nhật
							</button>
						</div>
					</div>
				</div>,
				document.body
			) : null}
		</>
	);
}
