import { useState, useEffect } from 'react';
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

			{open && (
				<div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
					<div className='bg-white rounded-md shadow-2xl p-6 w-80 max-w-full mx-4 animate-fadeIn border border-gray-300'>
						<h2 className='text-lg font-semibold mb-5 text-center'>Edit Goal</h2>

						{/* Goal Test Type */}
						<div className='mb-4'>
							<label className='block text-sm font-medium mb-1'>Goal Test Type</label>
							<select
								value={testType}
								onChange={(e) => setTestType(e.target.value as Goal['testType'])}
								className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none'
							>
								<option value={TestType.IELTS}>IELTS</option>
								<option value={TestType.TOEIC}>TOEIC</option>
							</select>
						</div>

						{/* Target Score */}
						<div className='mb-4'>
							<label className='block text-sm font-medium mb-1'>Target Score</label>
							<input
								type='number'
								value={target}
								onChange={(e) => setTarget(Number(e.target.value))}
								className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none'
								placeholder='Enter target score'
							/>
						</div>

						{/* Due Date */}
						<div className='mb-6'>
							<label className='block text-sm font-medium mb-1'>Due Date</label>
							<input
								type='date'
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none'
							/>
						</div>

						{/* Buttons */}
						<div className='flex justify-end gap-3'>
							<button
								onClick={() => setOpen(false)}
								className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition'
							>
								Cancel
							</button>
							<button
								onClick={handleUpdate}
								className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition'
							>
								Save
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
