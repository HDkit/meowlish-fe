import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

import { addGoal } from './store/goalSlice';
import { Goal, TestType } from '../types/client';
import { useAppSelector } from './store/main/hook';

export function AddGoalButton({ className }: { className?: string }) {
	const currentUser = useAppSelector((state) => state.currUser.current);
	const router = useRouter();
	const dispatch = useDispatch();

	useEffect(() => {
		if (!currentUser) {
			router.push('/auth'); // redirect if not logged in
		}
	}, [currentUser, router]);

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
			{open && typeof document !== 'undefined' ? createPortal(
				<div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]'>
					<div className='bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full mx-4 animate-in fade-in zoom-in-95 duration-200 border border-gray-100'>
						<h2 className='text-xl font-bold mb-6 text-center text-gray-900'>Thêm Mục Tiêu Mới</h2>

						{/* Goal Test Type */}
						<div className='mb-4'>
							<label className='block text-sm font-semibold mb-2 text-gray-700'>Loại Bài Kiểm Tra</label>
							<select
								value={testType}
								onChange={(e) => setTestType(e.target.value as Goal['testType'])}
								className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all'
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
								className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all'
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
								className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all'
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
								onClick={handleAdd}
								className='px-5 py-2.5 font-medium bg-primary text-white rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20 transition-all'
							>
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
