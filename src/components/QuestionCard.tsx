import { useState } from 'react';
import { Question } from '../types/client';
import { Button } from './ui/button';
import { Stars } from 'lucide-react';

export function QuestionCardModal({
	isOpen,
	onClose,
	title,
	children,
}: {
	isOpen: boolean;
	onClose: () => any;
	title?: string;
	children: React.ReactNode;
}) {
	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
			<div className='bg-white rounded-lg p-6 w-11/12 max-w-md'>
				{title && <h3 className='text-lg font-semibold mb-4'>{title}</h3>}
				<div>{children}</div>
				<button className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700' onClick={onClose}>
					Close
				</button>
			</div>
		</div>
	);
}

export function QuestionCard({ q, status }: { q: Question; status: string }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			{status !== 'correct' && status !== 'manual' && (
				<div
					className='bg-green-50 p-4 rounded-md border border-green-100 cursor-pointer'
					onClick={() => setIsOpen(true)}
				>
					<p className='text-xs text-green-600 uppercase font-bold mb-1'>Correct Answer</p>
					<p className='font-medium text-gray-800'>{q.correctAnswer?.join(', ') || 'N/A'}</p>
				</div>
			)}

			<QuestionCardModal isOpen={isOpen} onClose={() => setIsOpen(false)} title='Giải thích đáp án'>
				<p className='text-gray-700'>{q.explanation || 'Chưa có giải thích cho câu hỏi này.'}</p>
			</QuestionCardModal>
		</>
	);
}

export function AICard({ q }: { q: Question }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div>
			<Button variant='outline' onClick={() => setIsOpen(true)}>
				<Stars /> Giải thích bằng AI
			</Button>

			<QuestionCardModal isOpen={isOpen} onClose={() => setIsOpen(false)} title='Giải thích của AI'>
				<p
					className='text-gray-700'
					dangerouslySetInnerHTML={{
						__html: q.aiExplanation?.replace(/\n/g, '<br />') || 'Lỗi khi gọi API. Vui lòng thử lại sau.',
					}}
				></p>
			</QuestionCardModal>
		</div>
	);
}
