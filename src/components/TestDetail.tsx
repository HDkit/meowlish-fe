import React, { useMemo, useState } from 'react';
import { Section, Question } from '../types/client';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useParams } from 'react-router-dom';
import { useAppSelector } from './store/main/hook';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tag } from 'lucide-react';

export function ExamDetailPage() {
	const { id } = useParams();
	if (!id) return <div>Invalid Exam ID</div>;

	const examId = id;
	const exams = useAppSelector((state) => state.exams.list);
	const sections = useAppSelector((state) => state.sections.list);
	const questions = useAppSelector((state) => state.questions.list);
	const attempts = useAppSelector((state) => state.attempts.list);
	const tags = useAppSelector((state) => state.tags.list);

	const exam = exams.find((e) => e.id === examId);
	if (!exam) return <div>Exam not found</div>;

	// State
	const [comment, setComment] = useState('');
	const [timer, setTimer] = useState(30); // minutes
	const [useDefaultOptions, setUseDefaultOptions] = useState(false);

	// Helper: recursively get all child sections
	const getSectionTree = (parentId: string): Section[] => {
		const childSections = sections.filter((sec) => sec.parentId === parentId);
		let all: Section[] = [];
		for (const sec of childSections) {
			all.push(sec);
			all = all.concat(getSectionTree(sec.id));
		}
		return all;
	};

	const examSections = useMemo(() => getSectionTree(examId), [examId, sections]);

	// Count total questions
	const totalQuestions = useMemo(
		() => questions.filter((q) => examSections.some((sec) => sec.id === q.sectionId)).length,
		[questions, examSections]
	);

	// Collect all tags from questions
	const questionTags = useMemo(() => {
		const tagsSet = new Set<string>();
		questions.forEach((q) => {
			if (examSections.some((sec) => sec.id === q.sectionId)) {
				q.tagIds.forEach((t) => tagsSet.add(t));
			}
		});
		return Array.from(tagsSet);
	}, [questions, examSections]);

	// Number of attempts for this exam
	const examAttempts = useMemo(() => attempts.filter((a) => a.examId === examId).length, [attempts, examId]);

	return (
		<div className='p-6 space-y-6'>
			<h1 className='text-2xl font-bold'>{exam.title}</h1>
			<p className='text-gray-600'>Total questions: {totalQuestions}</p>
			<p className='text-gray-600'>Number of attempts: {examAttempts}</p>

			{/* Tags Preview */}
			<Card className='border'>
				<CardHeader>
					<CardTitle>Exam Tags</CardTitle>
				</CardHeader>
				<CardContent className='flex flex-wrap gap-2'>
					{questionTags.length ? (
						questionTags.map((t) => (
							<div className='flex flex-row'>
								{' '}
								<Tag key={t}></Tag>
								<div>{tags.find((tag) => tag.id === t)?.name}</div>
							</div>
						))
					) : (
						<span className='text-gray-500'>No tags yet</span>
					)}
				</CardContent>
			</Card>

			{/* Timer and default option */}
			<Card className='border flex flex-col gap-4 p-4'>
				<div className='flex items-center gap-4'>
					<label className='text-sm font-medium'>Set Timer (minutes):</label>

					<Input
						type='number'
						value={timer}
						onChange={(e) => setTimer(Number(e.target.value))}
						className={`w-24 ${
							useDefaultOptions
								? 'opacity-50 cursor-not-allowed text-gray-400'
								: 'opacity-100 cursor-pointer text-black'
						}`}
						disabled={useDefaultOptions}
					/>
				</div>

				<div className='flex items-center gap-2'>
					<input
						type='checkbox'
						id='defaultOption'
						checked={useDefaultOptions}
						onChange={(e) => setUseDefaultOptions(e.target.checked)}
						className='h-4 w-4'
					/>
					<label htmlFor='defaultOption' className='text-sm'>
						Làm đề với chế độ thi thật.
					</label>
				</div>
				<Button onClick={() => console.log('Start exam', { timer, useDefaultOptions })}>Start Exam</Button>
			</Card>

			{/* Comment Section */}
			<Card className='border'>
				<CardHeader>
					<CardTitle>Comments</CardTitle>
				</CardHeader>
				<CardContent>
					<textarea
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						placeholder='Write a comment...'
						className='w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
						rows={3}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
