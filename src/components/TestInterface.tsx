import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Question, Section } from '../types/client';
import { useAppSelector } from './store/main/hook';
import { useParams } from 'react-router-dom';

// --- COMPONENT ---
export function TestInterface() {
	const { id } = useParams();
	const allExams = useAppSelector((state) => state.exams.list);
	const allSections = useAppSelector((state) => state.sections.list);
	const allQuestions = useAppSelector((state) => state.questions.list);
	const [sections, setSections] = useState<Section[]>([]);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);
	useEffect(() => {
		const collectSections = (rootId: string, all: Section[]): Section[] => {
			const result: Section[] = [];

			const walk = (pid: string) => {
				const children = all.filter((s) => s.parentId === pid);
				for (const c of children) {
					result.push(c);
					walk(c.id);
				}
			};

			walk(rootId);
			return result;
		};

		if (!id) return;

		const nestedSections = collectSections(id, allSections);
		setSections(nestedSections);

		const secIds = new Set(nestedSections.map((s) => s.id));
		setQuestions(allQuestions.filter((q) => secIds.has(q.sectionId)));
	}, [id, allSections, allQuestions]);

	const [showTracker, setShowTracker] = useState(true);
	const [timeLeft, setTimeLeft] = useState(0); // 30 min
	useEffect(() => {
		if (!id) return;
		setShowTracker(true);
		setTimeLeft(allExams.find((e) => e.id === id)!.duration * 60);
	}, [id]);
	const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
	const [currentSectionAncestors, setCurrentSectionAncestors] = useState<Section[]>([]);

	useEffect(() => {
		if (!currentQuestionId) setCurrentQuestionId(questions[0]?.id);
	}, [questions]);

	// Timer effect
	useEffect(() => {
		const t = setInterval(() => setTimeLeft((v) => Math.max(0, v - 1)), 1000);
		return () => clearInterval(t);
	}, []);

	// Build ordered question list by Section hierarchy
	const buildOrderedQuestions = () => {
		const map: Record<string, Section[]> = {};

		sections.forEach((s) => {
			if (!map[s.parentId]) map[s.parentId] = [];
			map[s.parentId].push(s);
		});

		const orderSections = (pid: string): string[] => {
			let res: string[] = [];
			for (const s of map[pid] || []) {
				res.push(s.id);
				res = res.concat(orderSections(s.id));
			}
			return res;
		};

		// FIX: use the exam id from route params, not "exam"
		const orderedSectionIds = orderSections(id!);
		console.log(orderedSectionIds);

		const finalQuestions: Question[] = [];
		for (const sid of orderedSectionIds) {
			finalQuestions.push(...questions.filter((q) => q.sectionId === sid));
		}

		return finalQuestions;
	};

	// Assuming you have allSections: Section[]
	const getAncestors = (pId: string): Section[] => {
		const ancestors: Section[] = [];
		let current = sections.find((s) => s.id === pId);

		while (current) {
			ancestors.unshift(current); // add at the beginning to go root → leaf
			current = sections.find((s) => s.id === current?.parentId);
		}

		return ancestors;
	};

	useEffect(() => {
		console.log(buildOrderedQuestions());
		setOrderedQuestions(buildOrderedQuestions());
	}, [sections, questions]);

	useEffect(() => {
		if (!currentQuestionId) return;
		setCurrentSectionAncestors(getAncestors(questions.findLast((q) => q.id === currentQuestionId)!.sectionId) || '');
	}, [currentQuestionId]);

	return (
		<div className='h-full w-full bg-gray-50 relative'>
			{/* Header */}
			<div className=' bg-gray-100 px-4 py-3 font-semibold '>
				<Button variant='outline' onClick={() => setShowTracker((v) => !v)}>
					Toggle Tracker
				</Button>
				<div className='text-xl font-bold text-black'>
					{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
				</div>
			</div>
			<div className='h-full flex flex-row'>
				{/* Question Tracker */}
				<motion.div
					initial={{ x: '-100%' }}
					animate={{ x: showTracker ? 0 : '-100%' }}
					transition={{ type: 'tween', duration: 0.3 }}
					className='w-64 bg-white border-r p-4 overflow-y-auto shadow-lg'
				>
					<h2 className='font-semibold text-lg mb-3'>Question Tracker</h2>
					<div className='grid grid-cols-4 gap-2'>
						{orderedQuestions.map((q, i) => (
							<Button
								key={q.id}
								variant={currentQuestionId === q.id ? 'default' : 'ghost'}
								onClick={() => setCurrentQuestionId(q.id)}
							>
								{i + 1}
							</Button>
						))}
					</div>
				</motion.div>

				{/* Right side content */}
				<div className='flex-1 flex h-full overflow-y-auto'>
					{/* Left panel: Directive */}
					<div className='w-1/2 p-6 border-r overflow-y-auto'>
						<h2 className='font-semibold mb-4 text-xl'>Directive</h2>
						{currentSectionAncestors.map(
							(section) =>
								section.direction && (
									<div key={section.id}>
										<hr className='border-t border-gray-300 my-4' />
										<p className='text-gray-600'>{section.direction}</p>
									</div>
								)
						)}
					</div>

					{/* Right panel: Questions */}
					<div className='w-1/2 p-6 space-y-4 bg-white overflow-y-auto'>
						{orderedQuestions
							.filter((q) => q.sectionId === currentSectionAncestors[currentSectionAncestors.length - 1]?.id)
							.map((q) => (
								<div key={q.id} className='p-4 border rounded w-full bg-gray-100 shadow-sm'>
									<p className='font-medium mb-2'>{q.content}</p>

									{q.type === 'multiple-choice' && q.options && (
										<div className='space-y-1'>
											{q.options.map((op, idx) => (
												<label key={idx} className='flex items-center gap-2'>
													<input type='radio' onChange={() => setCurrentQuestionId(q.id)} name={q.id} />
													{op}
												</label>
											))}
										</div>
									)}

									{(q.type === 'essay' || q.type === 'fill-blank') && (
										<input
											type='text'
											onChange={() => setCurrentQuestionId(q.id)}
											name={q.id}
											className='border border-gray-300 rounded p-2 w-full'
										/>
									)}

									{q.type === 'multiple-correct-answers' && q.options && (
										<div className='space-y-1'>
											{q.options.map((op, idx) => (
												<label key={idx} className='flex items-center gap-2'>
													<input type='checkbox' onChange={() => setCurrentQuestionId(q.id)} name={q.id} />
													{op}
												</label>
											))}
										</div>
									)}
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	);
}
