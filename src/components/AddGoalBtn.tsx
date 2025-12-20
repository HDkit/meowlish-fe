import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

import { addGoal } from './store/goalSlice';
import { Goal, TestType } from '../types/client';
import { useAppSelector } from './store/main/hook';

export function AddGoalButton({ className }: { className?: string }) {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	useEffect(() => {
		if (!currentUser) {
			navigate('/auth'); // redirect if not logged in
		}
	}, [currentUser, navigate]);

	const [open, setOpen] = useState(false);
	const [target, setTarget] = useState(0);
	const [testType, setTestType] = useState<Goal['testType']>(TestType.IELTS);
	const [dueDate, setDueDate] = useState<string>(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD

	const handleAdd = () => {
		if (!currentUser) return;

		dispatch(
			addGoal({
				id: uuidv4(),
				userId: currentUser.id,
				testType,
				target,
				dueDate: new Date(dueDate).getTime(), // convert to timestamp
			})
		);

		// reset form and close modal
		setOpen(false);
		setTarget(0);
		setTestType(TestType.IELTS);
		setDueDate(new Date().toISOString().slice(0, 10));
	};

	return (
		<>
			{/* Add Goal Button */}
			<button
				onClick={() => setOpen(true)}
				className={` flex flex-col items-center justify-center p-6 hover:bg-accent/50 transition ${className}`}
			>
				<Plus className='h-6 w-6 mb-2 text-gray-700' />
			</button>

			{/* Modal */}
			{open && (
				<div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
					<div className='bg-white rounded-md shadow-2xl p-6 w-80 max-w-full mx-4 animate-fadeIn border border-gray-300'>
						<h2 className='text-lg font-semibold mb-5 text-center'>Thêm Mục Tiêu Mới</h2>

						{/* Goal Test Type */}
						<div className='mb-4'>
							<label className='block text-sm font-medium mb-1'>Loại Bài Kiểm Tra</label>
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
							<label className='block text-sm font-medium mb-1'>Điểm Mục Tiêu</label>
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
							<label className='block text-sm font-medium mb-1'>Ngày dự thi</label>
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
								Hủy
							</button>
							<button
								onClick={handleAdd}
								className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition'
							>
								Thêm
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
