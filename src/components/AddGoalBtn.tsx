import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { Plus } from 'lucide-react'; // your icon
import { addGoal, Goal } from './store/goalSlice';
import { v4 as uuidv4 } from 'uuid';

export function AddGoalButton({ className }: { className?: string }) {
	const dispatch = useDispatch();
	const [open, setOpen] = useState(false);

	const [target, setTarget] = useState(0);
	const [label, setLabel] = useState<Goal['label']>('IELTS Score');

	const handleAdd = () => {
		dispatch(
			addGoal({
				id: uuidv4(),
				targetExam: label,
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
				className={`border rounded-xl flex flex-col items-center justify-center p-6 hover:bg-accent/50 transition shadow-sm ${className}`}
			>
				<Plus className='h-6 w-6 mb-2 text-gray-700' />
				<span className='text-sm font-medium text-gray-800'>Add Goal</span>
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
								onClick={handleAdd}
								className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition'
							>
								Add
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
