import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { Pencil, Plus } from 'lucide-react'; // your icon
import { Goal, updateGoal } from './store/goalSlice';

interface EditGoalButtonProps {
	goal: Goal; // pass in the goal object
	className?: string;
}

export function EditGoalButton({ goal, className }: EditGoalButtonProps) {
	const dispatch = useDispatch();
	const [open, setOpen] = useState(false);
	const [goalId, setGoalId] = useState<Goal['id']>('ielts');
	const [target, setTarget] = useState(0);
	const [label, setLabel] = useState<Goal['label']>('IELTS Score');

	const handleUpdate = () => {
		dispatch(
			updateGoal({
				id: goal.id,
				label: label,
				target: Number(target),
			})
		);
		setOpen(false); // close modal
	};

	return (
		<>
			{/* Add Goal Button */}
			<button
				onClick={() => setOpen(true)}
				className='w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-accent/20 transition shadow-sm'
				title='Edit Goal'
			>
				<Pencil className='h-4 w-4 text-gray-700' />
			</button>

			{/* Modal */}
			{open && (
				<div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 '>
					<div className='bg-white rounded-md shadow-2xl p-6 w-80 max-w-full mx-4 animate-fadeIn border border-gray-300'>
						<h2 className='text-lg font-semibold mb-5 text-center'>Add New Goal</h2>

						{/* Goal Type */}
						<div className='mb-4'>
							<label className='block text-sm font-medium mb-1'>Goal Label</label>
							<select
								value={label}
								onChange={(e) => setLabel(e.target.value as Goal['label'])}
								className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none'
							>
								<option value='IELTS Score'>IELTS</option>
								<option value='TOEIC Score'>TOEIC</option>
							</select>
						</div>

						{/* Target Score */}
						<div className='mb-6'>
							<label className='block text-sm font-medium mb-1'>Target Score</label>
							<input
								type='number'
								value={target}
								onChange={(e) => setTarget(Number(e.target.value))}
								className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none'
								placeholder='Enter target score'
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
