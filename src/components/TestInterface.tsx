import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import {
	Clock,
	ChevronLeft,
	ChevronRight,
	Check,
	Menu,
	Flag,
	AlertCircle,
	BookOpen,
	ListChecks,
	Eye,
	CheckCircle2,
} from 'lucide-react';
import type { TestSession, Answer } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from './ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TestInterfaceProps {
	session: TestSession;
	onComplete: (session: TestSession) => void;
	onUpdateSession: (session: TestSession) => void;
}

// Question sections for grouping
const questionSections = [
	{
		id: 'section-1',
		passageId: 'passage-1',
		questionRange: '1-8',
		title: 'Questions 1–8',
		instruction:
			'Look at the following theories (Questions 1-8) and the list of researchers below.\n\nMatch each theory with the correct researcher(s), A-F.\n\nNB You may use any letter more than once.',
		type: 'matching',
		options: [
			'A Jim Bowler',
			'B Alan Thorne',
			'C Tim Flannery',
			'D Rainer Grün',
			'E Richard Roberts and Tim Flannery',
			'F Judith Field and Richard Fullager',
		],
	},
	{
		id: 'section-2',
		passageId: 'passage-1',
		questionRange: '9-13',
		title: 'Questions 9–13',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		type: 'fill-blank',
	},
	{
		id: 'section-3',
		passageId: 'passage-2',
		questionRange: '14-19',
		title: 'Questions 14–19',
		instruction:
			'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
		type: 'true-false',
	},
	{
		id: 'section-4',
		passageId: 'passage-2',
		questionRange: '20-26',
		title: 'Questions 20–26',
		instruction: 'Choose the correct letter, A, B, C or D.',
		type: 'multiple-choice',
	},
	{
		id: 'section-5',
		passageId: 'passage-3',
		questionRange: '27-30',
		title: 'Questions 27–30',
		instruction:
			'Look at the following claims (Questions 27-30) and the list of options below.\n\nMatch each claim with the correct option, A-G.\n\nNB You may use any letter more than once.',
		type: 'matching',
		options: [
			'A People overwork changes that happen during eye movements',
			'B At times, we fail to notice something because we choose to deceive ourselves',
			'C Retaining every image and memory would hinder our ability to function effectively',
			'D Sometimes, people overlook the significance of a crucial figure in a scene',
			'E We misunderstand what we see because we rely on our imagination',
			"F We don't have complete control over what captures our attention",
			'G Imagining a scene and physically being there impact our visual processes in similar ways',
		],
	},
	{
		id: 'section-6',
		passageId: 'passage-3',
		questionRange: '31-35',
		title: 'Questions 31–35',
		instruction:
			'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
		type: 'true-false',
	},
	{
		id: 'section-7',
		passageId: 'passage-3',
		questionRange: '36-40',
		title: 'Questions 36–40',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		type: 'fill-blank',
	},
];

// Mock IELTS Reading data
const mockPassages = [
	{
		id: 'passage-1',
		number: 1,
		title: 'Mungo Lady and Mungo Man',
		subtitle: 'Controversies in Australian Prehistory',
		content: `Fifty thousand years ago, a lush landscape greeted the first Australians moving towards the south-east of the continent. Temperatures were cooler than now. Megafauna – giant prehistoric animals such as the marsupial lions and the rhinoceros-sized diprotodon – were abundant. Freshwater lakes in areas of western New South Wales (NSW) were brimming with fish. But climate change was coming. By 40,000 years ago, water levels had started to drop.

A study of the sediments and graves of Lake Mungo, a dry lake bed in western NSW, has uncovered the muddy layers deposited as the lake began to dry up. Forty thousand years ago, families took refuge at the lake from the encroaching desert, leaving artifacts such as stone tools, which researchers used to determine that the first wanderers came to the area between 46,000 and 50,000 years ago. By 20,000 years ago, the lake had become the dry, dusty hole it is today. This area was first examined by the University of Melbourne archeologist Professor Jim Bowler in 1969. He was searching for ancient lakes and came across the remains of a woman who had been buried there, ceremony around 42,000 years ago and was later excavated. In 1974, he found a second set of remains, Mungo Man, buried 300 metres away. Bowler's comprehensive study of different sediment layers has concluded that both graves are 40,000 years old.`,
		questionRange: '1-13',
	},
	{
		id: 'passage-2',
		number: 2,
		title: 'The Development of Museums',
		subtitle: '',
		content: `The word 'museum' comes from the Greek mouseion, which in ancient times was a temple dedicated to the muses – the nine goddesses who presided over the arts and sciences. The first institution that resembled a modern museum was the Museum of Alexandria, founded in Egypt in the third century BCE. This was a research center that housed scholars and contained a library and collections of objects. However, it was not open to the public.

The modern concept of a public museum – a place where collections of objects are preserved and displayed for public viewing – emerged during the Renaissance in Europe. Royal and aristocratic families began to collect rare and interesting objects, which they displayed in 'cabinets of curiosities.' The oldest public museum is the Capitoline Museums in Rome, established in 1471 when Pope Sixtus IV donated a collection of ancient bronze statues to the people of Rome.

In the 17th and 18th centuries, many private collections were opened to the public. The Ashmolean Museum at Oxford University, founded in 1683, was one of the first museums to be purpose-built and open to the general public. The British Museum, established in 1753, was the first national public museum in the world. Its foundation reflected the Enlightenment ideals of making knowledge and culture accessible to all people, not just the wealthy elite.`,
		questionRange: '9-20',
	},
	{
		id: 'passage-3',
		number: 3,
		title: 'Artificial Intelligence in Healthcare',
		subtitle: '',
		content: `Artificial intelligence (AI) is revolutionizing healthcare in ways that seemed impossible just a decade ago. From diagnosing diseases to personalizing treatment plans, AI systems are becoming indispensable tools for medical professionals worldwide. Machine learning algorithms can now analyze medical images with accuracy that matches or exceeds human experts, identifying patterns that might be invisible to the human eye.

One of the most promising applications of AI in healthcare is in the field of radiology. Deep learning systems have been trained on millions of medical images to detect conditions such as cancer, tuberculosis, and diabetic retinopathy. These systems can process images in seconds, providing rapid preliminary diagnoses that help doctors prioritize urgent cases. In some instances, AI has demonstrated the ability to identify early-stage cancers that human radiologists might miss.

However, the integration of AI into healthcare is not without challenges. Concerns about data privacy, the potential for algorithmic bias, and the need for human oversight remain significant. Medical professionals emphasize that AI should be viewed as a tool to augment, rather than replace, human expertise. The most effective approach combines the pattern-recognition capabilities of AI with the contextual understanding and empathy that only human doctors can provide.`,
		questionRange: '21-40',
	},
];

const mockQuestions = [
	{
		id: 'q1',
		passageId: 'passage-1',
		questionNumber: 1,
		type: 'matching',
		instruction:
			'Look at the following theories (Questions 1-8) and the list of researchers below. Match each theory with the correct researcher(s), A-F.',
		note: 'NB: You may use any letter more than once.',
		text: 'Our human ancestors did not originate in only one area.',
		researchers: [
			'A Jim Bowler',
			'B Alan Thorne',
			'C Tim Flannery',
			'D Rainer Grün',
			'E Richard Roberts and Tim Flannery',
			'F Judith Field and Richard Fullager',
		],
	},
	{
		id: 'q2',
		passageId: 'passage-1',
		questionNumber: 2,
		type: 'matching',
		instruction:
			'Look at the following theories (Questions 1-8) and the list of researchers below. Match each theory with the correct researcher(s), A-F.',
		text: 'Families took refuge at Lake Mungo from the encroaching desert.',
		researchers: [
			'A Jim Bowler',
			'B Alan Thorne',
			'C Tim Flannery',
			'D Rainer Grün',
			'E Richard Roberts and Tim Flannery',
			'F Judith Field and Richard Fullager',
		],
	},
	{
		id: 'q3',
		passageId: 'passage-1',
		questionNumber: 3,
		type: 'matching',
		instruction:
			'Look at the following theories (Questions 1-8) and the list of researchers below. Match each theory with the correct researcher(s), A-F.',
		text: 'The lake sediments show when the first people came to the area.',
		researchers: [
			'A Jim Bowler',
			'B Alan Thorne',
			'C Tim Flannery',
			'D Rainer Grün',
			'E Richard Roberts and Tim Flannery',
			'F Judith Field and Richard Fullager',
		],
	},
	{
		id: 'q4',
		passageId: 'passage-1',
		questionNumber: 4,
		type: 'matching',
		instruction:
			'Look at the following theories (Questions 1-8) and the list of researchers below. Match each theory with the correct researcher(s), A-F.',
		text: 'Ancient Australians were more advanced than previously thought.',
		researchers: [
			'A Jim Bowler',
			'B Alan Thorne',
			'C Tim Flannery',
			'D Rainer Grün',
			'E Richard Roberts and Tim Flannery',
			'F Judith Field and Richard Fullager',
		],
	},
	{
		id: 'q5',
		passageId: 'passage-1',
		questionNumber: 5,
		type: 'matching',
		instruction:
			'Look at the following theories (Questions 1-8) and the list of researchers below. Match each theory with the correct researcher(s), A-F.',
		text: 'The graves at Lake Mungo are 40,000 years old.',
		researchers: [
			'A Jim Bowler',
			'B Alan Thorne',
			'C Tim Flannery',
			'D Rainer Grün',
			'E Richard Roberts and Tim Flannery',
			'F Judith Field and Richard Fullager',
		],
	},
	{
		id: 'q6',
		passageId: 'passage-1',
		questionNumber: 6,
		type: 'matching',
		instruction:
			'Look at the following theories (Questions 1-8) and the list of researchers below. Match each theory with the correct researcher(s), A-F.',
		text: 'Climate change caused the lakes to dry up.',
		researchers: [
			'A Jim Bowler',
			'B Alan Thorne',
			'C Tim Flannery',
			'D Rainer Grün',
			'E Richard Roberts and Tim Flannery',
			'F Judith Field and Richard Fullager',
		],
	},
	{
		id: 'q7',
		passageId: 'passage-1',
		questionNumber: 7,
		type: 'matching',
		instruction:
			'Look at the following theories (Questions 1-8) and the list of researchers below. Match each theory with the correct researcher(s), A-F.',
		text: 'Megafauna were abundant in ancient Australia.',
		researchers: [
			'A Jim Bowler',
			'B Alan Thorne',
			'C Tim Flannery',
			'D Rainer Grün',
			'E Richard Roberts and Tim Flannery',
			'F Judith Field and Richard Fullager',
		],
	},
	{
		id: 'q8',
		passageId: 'passage-1',
		questionNumber: 8,
		type: 'matching',
		instruction:
			'Look at the following theories (Questions 1-8) and the list of researchers below. Match each theory with the correct researcher(s), A-F.',
		text: 'Stone tools were found at the lake site.',
		researchers: [
			'A Jim Bowler',
			'B Alan Thorne',
			'C Tim Flannery',
			'D Rainer Grün',
			'E Richard Roberts and Tim Flannery',
			'F Judith Field and Richard Fullager',
		],
	},
	// Questions 9-13 for passage 1 (fill-blank)
	{
		id: 'q9',
		passageId: 'passage-1',
		questionNumber: 9,
		type: 'fill-blank',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		text: 'Mungo Lady was buried _____ years ago.',
	},
	{
		id: 'q10',
		passageId: 'passage-1',
		questionNumber: 10,
		type: 'fill-blank',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		text: 'Mungo Man was buried _____ away from Mungo Lady.',
	},
	{
		id: 'q11',
		passageId: 'passage-1',
		questionNumber: 11,
		type: 'fill-blank',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		text: 'The first Australians arrived between _____ years ago.',
	},
	{
		id: 'q12',
		passageId: 'passage-1',
		questionNumber: 12,
		type: 'fill-blank',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		text: 'Giant prehistoric animals were called _____.',
	},
	{
		id: 'q13',
		passageId: 'passage-1',
		questionNumber: 13,
		type: 'fill-blank',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		text: 'Lakes in western NSW were full of _____.',
	},
	// Passage 2 questions (starting from 14)
	{
		id: 'q14',
		passageId: 'passage-2',
		questionNumber: 14,
		type: 'true-false',
		instruction:
			'Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.',
		text: 'The Museum of Alexandria was open to the public.',
	},
	{
		id: 'q15',
		passageId: 'passage-2',
		questionNumber: 15,
		type: 'true-false',
		instruction:
			'Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.',
		text: 'The Capitoline Museums is the oldest public museum in the world.',
	},
	{
		id: 'q16',
		passageId: 'passage-2',
		questionNumber: 16,
		type: 'true-false',
		instruction:
			'Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.',
		text: 'The British Museum was established before the Ashmolean Museum.',
	},
	{
		id: 'q17',
		passageId: 'passage-2',
		questionNumber: 17,
		type: 'true-false',
		instruction:
			'Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.',
		text: 'Museums during the Renaissance were called cabinets of curiosities.',
	},
	{
		id: 'q18',
		passageId: 'passage-2',
		questionNumber: 18,
		type: 'true-false',
		instruction:
			'Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.',
		text: 'The British Museum reflected Enlightenment ideals.',
	},
	{
		id: 'q19',
		passageId: 'passage-2',
		questionNumber: 19,
		type: 'true-false',
		instruction:
			'Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.',
		text: 'Modern museums focus primarily on entertainment rather than education.',
	},
	// Questions 20-26 for passage 2 (multiple choice)
	{
		id: 'q20',
		passageId: 'passage-2',
		questionNumber: 20,
		type: 'multiple-choice',
		instruction: 'Choose the correct letter, A, B, C or D.',
		text: 'What does the word "mouseion" mean?',
		options: ['A museum', 'A temple', 'A library', 'A collection'],
	},
	{
		id: 'q21',
		passageId: 'passage-2',
		questionNumber: 21,
		type: 'multiple-choice',
		instruction: 'Choose the correct letter, A, B, C or D.',
		text: 'When was the Museum of Alexandria founded?',
		options: ['Third century BCE', 'First century BCE', 'Renaissance period', '1471'],
	},
	{
		id: 'q22',
		passageId: 'passage-2',
		questionNumber: 22,
		type: 'multiple-choice',
		instruction: 'Choose the correct letter, A, B, C or D.',
		text: 'What characterized Renaissance collecting?',
		options: ['Public access', 'Scientific study', 'Private curiosity', 'Educational purpose'],
	},
	{
		id: 'q23',
		passageId: 'passage-2',
		questionNumber: 23,
		type: 'multiple-choice',
		instruction: 'Choose the correct letter, A, B, C or D.',
		text: 'The British Museum was founded in which century?',
		options: ['16th century', '17th century', '18th century', '19th century'],
	},
	{
		id: 'q24',
		passageId: 'passage-2',
		questionNumber: 24,
		type: 'multiple-choice',
		instruction: 'Choose the correct letter, A, B, C or D.',
		text: 'What was the main purpose of early public museums?',
		options: ['Entertainment', 'Profit', 'Education', 'Storage'],
	},
	{
		id: 'q25',
		passageId: 'passage-2',
		questionNumber: 25,
		type: 'multiple-choice',
		instruction: 'Choose the correct letter, A, B, C or D.',
		text: 'Modern museums differ from early ones because they',
		options: ['Have larger collections', 'Focus on accessibility', 'Charge admission fees', 'Display fewer items'],
	},
	{
		id: 'q26',
		passageId: 'passage-2',
		questionNumber: 26,
		type: 'multiple-choice',
		instruction: 'Choose the correct letter, A, B, C or D.',
		text: 'The concept of public access to collections began during',
		options: ['Ancient times', 'The Renaissance', 'The Enlightenment', 'The Industrial Revolution'],
	},
	// Passage 3 questions (starting from 27)
	{
		id: 'q27',
		passageId: 'passage-3',
		questionNumber: 27,
		type: 'matching',
		instruction:
			'Look at the following claims (Questions 27-30) and the list of options below. Match each claim with the correct option, A-G.',
		text: 'AI can analyze medical images with high accuracy.',
		researchers: [
			'A People overwork changes that happen during eye movements',
			'B At times, we fail to notice something because we choose to deceive ourselves',
			'C Retaining every image and memory would hinder our ability to function effectively',
			'D Sometimes, people overlook the significance of a crucial figure in a scene',
			'E We misunderstand what we see because we rely on our imagination',
			"F We don't have complete control over what captures our attention",
			'G Imagining a scene and physically being there impact our visual processes in similar ways',
		],
	},
	{
		id: 'q28',
		passageId: 'passage-3',
		questionNumber: 28,
		type: 'matching',
		instruction:
			'Look at the following claims (Questions 27-30) and the list of options below. Match each claim with the correct option, A-G.',
		text: 'Deep learning systems have been trained on millions of images.',
		researchers: [
			'A People overwork changes that happen during eye movements',
			'B At times, we fail to notice something because we choose to deceive ourselves',
			'C Retaining every image and memory would hinder our ability to function effectively',
			'D Sometimes, people overlook the significance of a crucial figure in a scene',
			'E We misunderstand what we see because we rely on our imagination',
			"F We don't have complete control over what captures our attention",
			'G Imagining a scene and physically being there impact our visual processes in similar ways',
		],
	},
	{
		id: 'q29',
		passageId: 'passage-3',
		questionNumber: 29,
		type: 'matching',
		instruction:
			'Look at the following claims (Questions 27-30) and the list of options below. Match each claim with the correct option, A-G.',
		text: 'AI systems can identify early-stage cancers.',
		researchers: [
			'A People overwork changes that happen during eye movements',
			'B At times, we fail to notice something because we choose to deceive ourselves',
			'C Retaining every image and memory would hinder our ability to function effectively',
			'D Sometimes, people overlook the significance of a crucial figure in a scene',
			'E We misunderstand what we see because we rely on our imagination',
			"F We don't have complete control over what captures our attention",
			'G Imagining a scene and physically being there impact our visual processes in similar ways',
		],
	},
	{
		id: 'q30',
		passageId: 'passage-3',
		questionNumber: 30,
		type: 'matching',
		instruction:
			'Look at the following claims (Questions 27-30) and the list of options below. Match each claim with the correct option, A-G.',
		text: 'Concerns about data privacy remain significant.',
		researchers: [
			'A People overwork changes that happen during eye movements',
			'B At times, we fail to notice something because we choose to deceive ourselves',
			'C Retaining every image and memory would hinder our ability to function effectively',
			'D Sometimes, people overlook the significance of a crucial figure in a scene',
			'E We misunderstand what we see because we rely on our imagination',
			"F We don't have complete control over what captures our attention",
			'G Imagining a scene and physically being there impact our visual processes in similar ways',
		],
	},
	// Questions 31-35 for passage 3 (true-false)
	{
		id: 'q31',
		passageId: 'passage-3',
		questionNumber: 31,
		type: 'true-false',
		instruction:
			'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
		text: 'Visual perception is completely accurate.',
	},
	{
		id: 'q32',
		passageId: 'passage-3',
		questionNumber: 32,
		type: 'true-false',
		instruction:
			'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
		text: 'Eye movements affect what we see.',
	},
	{
		id: 'q33',
		passageId: 'passage-3',
		questionNumber: 33,
		type: 'true-false',
		instruction:
			'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
		text: 'Memory plays a role in visual processing.',
	},
	{
		id: 'q34',
		passageId: 'passage-3',
		questionNumber: 34,
		type: 'true-false',
		instruction:
			'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
		text: 'Imagination can influence perception.',
	},
	{
		id: 'q35',
		passageId: 'passage-3',
		questionNumber: 35,
		type: 'true-false',
		instruction:
			'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
		text: 'Attention is always under conscious control.',
	},
	// Questions 36-40 for passage 3 (fill-blank)
	{
		id: 'q36',
		passageId: 'passage-3',
		questionNumber: 36,
		type: 'fill-blank',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		text: 'Our visual system sometimes _____ important details.',
	},
	{
		id: 'q37',
		passageId: 'passage-3',
		questionNumber: 37,
		type: 'fill-blank',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		text: 'The brain uses _____ to fill in missing information.',
	},
	{
		id: 'q38',
		passageId: 'passage-3',
		questionNumber: 38,
		type: 'fill-blank',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		text: 'Visual processing involves both _____ and interpretation.',
	},
	{
		id: 'q39',
		passageId: 'passage-3',
		questionNumber: 39,
		type: 'fill-blank',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		text: 'Some visual errors occur due to _____ expectations.',
	},
	{
		id: 'q40',
		passageId: 'passage-3',
		questionNumber: 40,
		type: 'fill-blank',
		instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.',
		text: 'The study of vision reveals _____ about perception.',
	},
];

export function TestInterface({ session, onComplete, onUpdateSession }: TestInterfaceProps) {
	const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds
	const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [showFinishDialog, setShowFinishDialog] = useState(false);
	const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

	const currentPassage = mockPassages[currentPassageIndex];
	const passageQuestions = mockQuestions.filter((q) => q.passageId === currentPassage.id);
	const currentQuestion = passageQuestions[currentQuestionIndex];

	// Get current section information
	const getCurrentSection = () => {
		if (!currentQuestion) return null;
		return questionSections.find((section) => {
			const [start, end] = section.questionRange.split('-').map(Number);
			return currentQuestion.questionNumber >= start && currentQuestion.questionNumber <= end;
		});
	};

	const currentSection = getCurrentSection();

	// Calculate progress
	const totalAnswered = Object.keys(answers).length;
	const totalQuestions = mockQuestions.length;
	const progressPercentage = (totalAnswered / totalQuestions) * 100;

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev <= 1) {
					handleCompleteTest();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
			.toString()
			.padStart(2, '0')}`;
	};

	const handleAnswerChange = (questionId: string, answer: string) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: answer,
		}));
	};

	const handleNextQuestion = () => {
		if (currentQuestionIndex < passageQuestions.length - 1) {
			setCurrentQuestionIndex(currentQuestionIndex + 1);
		} else if (currentPassageIndex < mockPassages.length - 1) {
			setCurrentPassageIndex(currentPassageIndex + 1);
			setCurrentQuestionIndex(0);
		}
	};

	const handlePreviousQuestion = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(currentQuestionIndex - 1);
		} else if (currentPassageIndex > 0) {
			setCurrentPassageIndex(currentPassageIndex - 1);
			const prevPassageQuestions = mockQuestions.filter(
				(q) => q.passageId === mockPassages[currentPassageIndex - 1].id
			);
			setCurrentQuestionIndex(prevPassageQuestions.length - 1);
		}
	};

	const toggleFlag = (questionId: string) => {
		setFlaggedQuestions((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(questionId)) {
				newSet.delete(questionId);
			} else {
				newSet.add(questionId);
			}
			return newSet;
		});
	};

	const handleCompleteTest = () => {
		setShowFinishDialog(false);

		// Mock correct answers for demonstration
		const correctAnswersMap: Record<string, string> = {
			q1: 'B',
			q2: 'A',
			q3: 'E',
			q4: 'F',
			q5: 'A',
			q6: 'C',
			q7: 'C',
			q8: 'A',
			q9: 'FALSE',
			q10: 'TRUE',
			q11: 'FALSE',
			q12: 'NOT GIVEN',
			q13: 'TRUE',
			q14: 'C',
			q15: 'D',
			q16: 'E',
			q17: 'F',
			q18: 'G',
			q19: 'A',
			q20: 'B',
			q21: 'dry dusty hole',
			q22: '300 metres',
			q23: '46000 50000',
			q24: 'megafauna',
			q25: 'fish',
			q26: 'A temple',
			q27: 'Third century BCE',
			q28: 'Bronze statues',
			q29: '1683',
			q30: 'First national public museum',
			q31: 'Renaissance',
			q32: 'Rome',
			q33: 'FALSE',
			q34: 'TRUE',
			q35: 'NOT GIVEN',
			q36: 'FALSE',
			q37: 'FALSE',
			q38: 'TRUE',
			q39: 'TRUE',
			q40: 'TRUE',
		};

		const formattedAnswers: Answer[] = mockQuestions.map((question) => {
			const userAnswer = answers[question.id] || '';
			const correctAnswer = correctAnswersMap[question.id] || '';
			const isCorrect = userAnswer === correctAnswer;

			return {
				questionId: question.id,
				userAnswer,
				isCorrect,
				score: isCorrect ? 1 : 0,
				feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}`,
			};
		});

		const finalSession = {
			...session,
			questions: mockQuestions.map((q, index) => ({
				id: q.id,
				passageId: q.passageId,
				questionNumber: q.questionNumber,
				type: 'multiple-choice' as const,
				difficulty: 'intermediate' as const,
				content: q.text,
				instruction: q.instruction,
				options:
					q.type === 'matching'
						? q.researchers
						: q.type === 'multiple-choice' && q.options
						? q.options
						: q.type === 'true-false'
						? ['TRUE', 'FALSE', 'NOT GIVEN']
						: undefined,
				correctAnswer: correctAnswersMap[q.id],
				points: 1,
				skill: session.skill,
			})),
			answers: formattedAnswers,
			completed: true,
		};

		onComplete(finalSession);
	};

	const isFirstQuestion = currentPassageIndex === 0 && currentQuestionIndex === 0;
	const isLastQuestion =
		currentPassageIndex === mockPassages.length - 1 && currentQuestionIndex === passageQuestions.length - 1;

	// Timer warning colors
	const getTimerColor = () => {
		if (timeRemaining <= 300) return 'text-red-600'; // 5 minutes
		if (timeRemaining <= 600) return 'text-orange-600'; // 10 minutes
		return 'text-foreground';
	};

	const getTimerBgColor = () => {
		if (timeRemaining <= 300) return 'bg-red-50 dark:bg-red-950/20 border-red-200';
		if (timeRemaining <= 600) return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200';
		return 'bg-background border-border';
	};

	return (
		<TooltipProvider>
			<div className='fixed inset-0 flex flex-col bg-background'>
				{/* Enhanced Header */}
				<div className='border-b bg-white dark:bg-gray-950 shadow-sm'>
					{/* Top Bar */}
					<div className='px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2 sm:gap-4 min-w-0'>
							<div className='w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shrink-0'>
								<BookOpen className='h-5 w-5 sm:h-6 sm:w-6 text-white' />
							</div>
							<div className='min-w-0'>
								<div className='flex items-center gap-2'>
									<h1 className='font-semibold text-sm sm:text-base truncate'>
										<span className='hidden sm:inline'>[VOL 6] IELTS Reading Test 1</span>
										<span className='sm:hidden'>IELTS Reading T1</span>
									</h1>
									<Badge variant='secondary' className='text-xs shrink-0 hidden sm:inline-flex'>
										Reading
									</Badge>
								</div>
								<div className='flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1'>
									<span className='flex items-center gap-1'>
										<ListChecks className='h-3 w-3' />
										{totalAnswered}/{totalQuestions}
									</span>
									<span className='hidden sm:inline'>•</span>
									<span className='hidden sm:inline'>3 passages</span>
								</div>
							</div>
						</div>

						{/* Timer */}
						<div
							className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border ${getTimerBgColor()} transition-colors shrink-0`}
						>
							<Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${getTimerColor()}`} />
							<div>
								<div className='text-xs text-muted-foreground hidden sm:block'>Thời gian còn lại</div>
								<div className={`font-mono text-sm sm:text-base ${getTimerColor()}`}>{formatTime(timeRemaining)}</div>
							</div>
							{timeRemaining <= 300 && <AlertCircle className='h-4 w-4 sm:h-5 sm:w-5 text-red-600 animate-pulse' />}
						</div>
					</div>

					{/* Progress Bar */}
					<div className='px-3 sm:px-6 pb-2 sm:pb-3'>
						<div className='flex items-center gap-2 sm:gap-3'>
							<Progress value={progressPercentage} className='flex-1 h-1.5 sm:h-2' />
							<span className='text-xs text-muted-foreground min-w-[45px] sm:min-w-[60px] text-right'>
								{Math.round(progressPercentage)}%
							</span>
						</div>
					</div>
				</div>

				{/* Main Content - Split View */}
				<div className='flex-1 overflow-hidden'>
					<ResizablePanelGroup direction='horizontal'>
						{/* Left Panel - Passage */}
						<ResizablePanel defaultSize={50} minSize={30}>
							<div className='h-full flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900'>
								{/* Passage Header with Gradient */}
								<div className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 sm:px-6 py-4 sm:py-5 shadow-lg'>
									<div className='flex items-center justify-between mb-2 gap-2'>
										<h2 className='uppercase tracking-wider font-semibold flex items-center gap-2 text-sm sm:text-base'>
											<div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-sm sm:text-base'>
												{currentPassage.number}
											</div>
											<span className='hidden sm:inline'>PASSAGE {currentPassage.number}</span>
											<span className='sm:hidden'>P{currentPassage.number}</span>
										</h2>
										<Badge variant='secondary' className='bg-white/20 text-white border-0 text-xs px-2 py-0.5'>
											{currentPassage.questionRange}
										</Badge>
									</div>
									{currentPassage.title && (
										<div>
											<h3 className='font-semibold text-base sm:text-lg line-clamp-2'>{currentPassage.title}</h3>
											{currentPassage.subtitle && (
												<p className='text-xs sm:text-sm text-white/80 mt-1 italic line-clamp-1'>
													{currentPassage.subtitle}
												</p>
											)}
										</div>
									)}
								</div>

								{/* Passage Content */}
								<div className='flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent'>
									<div className='max-w-3xl space-y-3 sm:space-y-4 pr-2 sm:pr-3'>
										<div className='prose dark:prose-invert max-w-none prose-sm sm:prose-base'>
											{currentPassage.content.split('\n\n').map((paragraph, index) => (
												<p key={index} className='text-justify leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base'>
													{paragraph}
												</p>
											))}
										</div>
									</div>
								</div>

								{/* Passage Overview */}
								<div className='border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4 overflow-x-auto'>
									<div className='flex items-center gap-2 sm:gap-3 min-w-max'>
										{mockPassages.map((passage, pIndex) => {
											const passageQs = mockQuestions.filter((q) => q.passageId === passage.id);
											const answeredCount = passageQs.filter((q) => answers[q.id]).length;
											const isActive = pIndex === currentPassageIndex;

											return (
												<Tooltip key={passage.id}>
													<TooltipTrigger asChild>
														<Button
															variant={isActive ? 'default' : 'outline'}
															size='sm'
															className={`h-9 sm:h-10 px-3 sm:px-4 transition-all text-xs sm:text-sm ${
																isActive ? 'ring-2 ring-offset-2 ring-primary shadow-lg' : ''
															}`}
															onClick={() => {
																setCurrentPassageIndex(pIndex);
																setCurrentQuestionIndex(0);
															}}
														>
															<div className='flex items-center gap-1.5 sm:gap-2'>
																<div className='flex flex-col items-start'>
																	<span className='text-xs opacity-75 hidden sm:inline'>Passage</span>
																	<span className='font-semibold text-xs sm:text-sm'>P{passage.number}</span>
																</div>
																<div className='text-xs'>
																	{answeredCount}/{passageQs.length}
																</div>
															</div>
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>{passage.title}</p>
														<p className='text-xs text-muted-foreground'>
															{answeredCount} of {passageQs.length} answered
														</p>
													</TooltipContent>
												</Tooltip>
											);
										})}
									</div>
								</div>
							</div>
						</ResizablePanel>

						<ResizableHandle withHandle />

						{/* Right Panel - Questions */}
						<ResizablePanel defaultSize={50} minSize={30}>
							<div className='h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20'>
								{/* Questions Header */}
								<div className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 sm:px-6 py-4 sm:py-5 shadow-lg'>
									{/* Section Title */}
									{currentSection && (
										<div className='mb-4 pb-3 border-b border-white/20'>
											<h2 className='text-lg sm:text-xl font-bold mb-2'>{currentSection.title}</h2>
											<div className='text-sm text-white/90 whitespace-pre-line leading-relaxed'>
												{currentSection.instruction}
											</div>
										</div>
									)}

									{/* Current Question Info */}
									<div className='flex items-center justify-between mb-2 gap-2'>
										<h3 className='uppercase tracking-wider font-semibold text-sm sm:text-base'>
											Question {currentQuestion?.questionNumber}
										</h3>
										<div className='flex items-center gap-1.5 sm:gap-2'>
											<Badge
												variant='secondary'
												className='bg-white/20 text-white border-0 text-xs px-2 py-0.5 hidden sm:inline-flex'
											>
												{currentQuestion?.type}
											</Badge>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant='ghost'
														size='icon'
														className='h-7 w-7 sm:h-8 sm:w-8 text-white hover:bg-white/20'
														onClick={() => toggleFlag(currentQuestion?.id)}
													>
														<Flag
															className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
																flaggedQuestions.has(currentQuestion?.id) ? 'fill-current' : ''
															}`}
														/>
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{flaggedQuestions.has(currentQuestion?.id) ? 'Bỏ đánh dấu' : 'Đánh dấu để xem lại'}
												</TooltipContent>
											</Tooltip>
										</div>
									</div>
								</div>

								{/* Question Content */}
								<div className='flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/10 dark:to-indigo-950/10 px-3 sm:px-6 py-4 sm:py-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent'>
									<div className='space-y-4 sm:space-y-6 pr-2 sm:pr-3'>
										{/* Options List (for matching questions) */}
										{currentSection?.type === 'matching' && currentSection.options && (
											<Card className='bg-white dark:bg-gray-950 shadow-md'>
												<CardContent className='p-3 sm:p-4'>
													<h4 className='mb-2 sm:mb-3 font-semibold text-sm sm:text-base'>
														{currentSection.questionRange === '1-8'
															? 'List of Researchers'
															: currentSection.questionRange === '14-19'
															? 'List of Options'
															: 'Options'}
													</h4>
													<div className='space-y-1.5 sm:space-y-2 text-xs sm:text-sm'>
														{currentSection.options.map((option, index) => (
															<div
																key={index}
																className='flex items-start gap-2 p-1.5 sm:p-2 rounded hover:bg-muted/50 transition-colors'
															>
																<span className='shrink-0 font-semibold text-primary w-4 sm:w-5'>
																	{option.charAt(0)}
																</span>
																<span className='leading-relaxed'>{option.substring(2)}</span>
															</div>
														))}
													</div>
												</CardContent>
											</Card>
										)}

										{/* Question and Answer Options */}
										<Card className='bg-white dark:bg-gray-950 shadow-md'>
											<CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
												{/* Question Text */}
												<div className='flex gap-2 sm:gap-3'>
													<div className='flex items-start gap-2 sm:gap-3 flex-1'>
														<div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
															<span className='font-semibold text-primary text-xs sm:text-sm'>
																{currentQuestion?.questionNumber}
															</span>
														</div>
														<span className='pt-0.5 sm:pt-1 text-sm sm:text-base leading-relaxed'>
															{currentQuestion?.text}
														</span>
													</div>
												</div>

												{/* Answer options - Matching Type */}
												{currentQuestion?.type === 'matching' && currentSection?.options && (
													<div className='space-y-4'>
														<div className='text-xs sm:text-sm text-muted-foreground'>
															<div className='flex items-center gap-2'>
																<span>Select your answer:</span>
																{answers[currentQuestion.id] && (
																	<span className='text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium'>
																		Selected: {answers[currentQuestion.id]}
																	</span>
																)}
															</div>
														</div>
														<div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4'>
															{currentSection.options.map((option) => {
																const letter = option.charAt(0);
																const isSelected = answers[currentQuestion.id] === letter;
																return (
																	<Button
																		key={letter}
																		variant={isSelected ? 'default' : 'outline'}
																		className={`w-full aspect-square p-0 font-semibold text-base sm:text-lg transition-all ${
																			isSelected
																				? 'ring-2 ring-offset-2 ring-primary shadow-lg scale-105 bg-primary text-primary-foreground'
																				: 'hover:scale-105 hover:shadow-md hover:border-primary/50'
																		}`}
																		onClick={() => handleAnswerChange(currentQuestion.id, letter)}
																	>
																		{letter}
																	</Button>
																);
															})}
														</div>

														{/* Progress indicator */}
														<div className='flex items-center justify-between text-xs text-muted-foreground pt-2'>
															<span>
																Choose from options {currentSection.options.map((o) => o.charAt(0)).join('-')}
															</span>
															{answers[currentQuestion.id] && (
																<div className='flex items-center gap-1 text-green-600'>
																	<Check className='h-3 w-3' />
																	<span>Completed</span>
																</div>
															)}
														</div>
													</div>
												)}

												{/* Answer options - True/False Type */}
												{currentQuestion?.type === 'true-false' && (
													<div className='space-y-4'>
														<div className='text-xs sm:text-sm text-muted-foreground'>
															<div className='flex items-center gap-2'>
																<span>Select your answer:</span>
																{answers[currentQuestion.id] && (
																	<span className='text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium'>
																		Selected: {answers[currentQuestion.id]}
																	</span>
																)}
															</div>
														</div>
														<div className='space-y-3'>
															{['TRUE', 'FALSE', 'NOT GIVEN'].map((option) => {
																const isSelected = answers[currentQuestion.id] === option;
																return (
																	<Button
																		key={option}
																		variant={isSelected ? 'default' : 'outline'}
																		className={`w-full py-4 sm:py-5 font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-3 ${
																			isSelected
																				? 'ring-2 ring-offset-2 ring-primary shadow-lg bg-primary text-primary-foreground'
																				: 'hover:scale-[1.02] hover:shadow-md hover:border-primary/50'
																		}`}
																		onClick={() => handleAnswerChange(currentQuestion.id, option)}
																	>
																		<div
																			className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
																				isSelected
																					? 'border-primary-foreground bg-primary-foreground'
																					: 'border-muted-foreground'
																			}`}
																		>
																			{isSelected && <Check className='h-3 w-3 text-primary' />}
																		</div>
																		<span>{option}</span>
																		{isSelected && (
																			<div className='ml-auto flex items-center gap-1 text-xs opacity-75'>
																				<Check className='h-3 w-3' />
																				<span>Đã chọn</span>
																			</div>
																		)}
																	</Button>
																);
															})}
														</div>

														{/* Help text */}
														<div className='text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg'>
															<div className='space-y-1'>
																<p>
																	<strong>TRUE:</strong> Thông tin khớp với đoạn văn
																</p>
																<p>
																	<strong>FALSE:</strong> Thông tin trái với đoạn văn
																</p>
																<p>
																	<strong>NOT GIVEN:</strong> Không có thông tin trong đoạn văn
																</p>
															</div>
														</div>
													</div>
												)}

												{/* Answer options - Fill in the Blank Type */}
												{currentQuestion?.type === 'fill-blank' && (
													<div className='space-y-2 sm:space-y-3'>
														<Label htmlFor='answer' className='text-sm sm:text-base'>
															Your answer:
														</Label>
														<Input
															id='answer'
															type='text'
															value={answers[currentQuestion.id] || ''}
															onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
															placeholder='Type your answer...'
															className='text-base sm:text-lg py-4 sm:py-6'
														/>
														<p className='text-xs text-muted-foreground'>
															Write NO MORE THAN TWO WORDS from the passage
														</p>
													</div>
												)}

												{/* Answer options - Multiple Choice Type */}
												{currentQuestion?.type === 'multiple-choice' && currentQuestion.options && (
													<div className='space-y-2 sm:space-y-3'>
														<div className='text-xs sm:text-sm text-muted-foreground mb-2'>
															Choose the correct answer:
														</div>
														{currentQuestion.options.map((option, index) => {
															const isSelected = answers[currentQuestion.id] === option;
															return (
																<button
																	key={index}
																	className={`w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-all text-sm sm:text-base ${
																		isSelected
																			? 'border-primary bg-primary/5 ring-2 ring-offset-2 ring-primary shadow-md'
																			: 'border-border hover:border-primary/50 hover:bg-accent'
																	}`}
																	onClick={() => handleAnswerChange(currentQuestion.id, option)}
																>
																	<div className='flex items-center gap-2 sm:gap-3'>
																		<div
																			className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
																				isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
																			}`}
																		>
																			{isSelected && <Check className='h-2.5 w-2.5 sm:h-3 sm:w-3 text-white' />}
																		</div>
																		<span className='leading-relaxed'>{option}</span>
																	</div>
																</button>
															);
														})}
													</div>
												)}
											</CardContent>
										</Card>

										{/* Preview of other questions */}
										<div className='space-y-2'>
											<h4 className='text-xs sm:text-sm font-semibold text-muted-foreground px-1'>
												Các câu khác trong passage này:
											</h4>
											<div className='space-y-1.5 sm:space-y-2'>
												{passageQuestions.map((q, idx) => {
													if (q.id === currentQuestion?.id) return null;
													const isAnswered = !!answers[q.id];
													const isFlagged = flaggedQuestions.has(q.id);

													return (
														<button
															key={q.id}
															onClick={() => setCurrentQuestionIndex(idx)}
															className='w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-xs sm:text-sm hover:bg-white/50 dark:hover:bg-gray-900/50 transition-colors text-left'
														>
															<div
																className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 text-xs sm:text-sm ${
																	isAnswered
																		? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold'
																		: 'bg-gray-100 dark:bg-gray-800'
																}`}
															>
																{q.questionNumber}
															</div>
															<span className={`flex-1 line-clamp-1 ${!isAnswered && 'text-muted-foreground'}`}>
																{q.text}
															</span>
															<div className='flex items-center gap-1 shrink-0'>
																{isFlagged && <Flag className='h-3 w-3 sm:h-4 sm:w-4 text-orange-500 fill-current' />}
																{isAnswered && <Check className='h-3 w-3 sm:h-4 sm:w-4 text-green-600' />}
															</div>
														</button>
													);
												})}
											</div>
										</div>
									</div>
								</div>
								{/* Navigation Bar - Single Row */}
								<div className='border-t bg-white dark:bg-gray-950 shadow-lg px-3 sm:px-6 py-2 sm:py-3'>
									<div className='flex items-center justify-between gap-2 sm:gap-4'>
										{/* Center - Passage Info & Questions */}
										<div className='flex items-center gap-1 sm:gap-2 flex-1 overflow-hidden px-2'>
											{/* Passage Label */}
											<span className='font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap'>
												PASSAGE {mockPassages[currentPassageIndex]?.number}
											</span>

											{/* Left Chevron */}
											<ChevronLeft className='h-3 w-3 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0' />

											{/* Question Numbers */}
											<div className='flex gap-1 items-center overflow-x-auto scrollbar-hide'>
												{mockQuestions
													.filter((q) => q.passageId === mockPassages[currentPassageIndex]?.id)
													.map((q, idx) => (
														<Button
															key={q.id}
															variant='ghost'
															size='sm'
															className={`h-6 w-6 sm:h-7 sm:w-7 p-0 text-xs font-medium transition-all flex-shrink-0 ${
																answers[q.id]
																	? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100 hover:bg-emerald-200 dark:hover:bg-emerald-800'
																	: currentQuestionIndex === idx
																	? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800'
																	: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
															}`}
															onClick={() => setCurrentQuestionIndex(idx)}
														>
															{q.questionNumber}
														</Button>
													))}
											</div>

											{/* Right Chevron */}
											<ChevronRight className='h-3 w-3 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0' />
										</div>

										{/* Right - Navigation Buttons */}
										<div className='flex gap-1 sm:gap-2 ml-auto'>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant='outline'
														size='sm'
														onClick={handlePreviousQuestion}
														disabled={isFirstQuestion}
														className='text-xs gap-1 disabled:opacity-50'
													>
														<ChevronLeft className='h-3 w-3 sm:h-4 sm:w-4' />
														<span className='hidden sm:inline'>Previous</span>
													</Button>
												</TooltipTrigger>
												<TooltipContent>Câu trước</TooltipContent>
											</Tooltip>

											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant='outline'
														size='sm'
														onClick={handleNextQuestion}
														disabled={isLastQuestion}
														className='text-xs gap-1 disabled:opacity-50'
													>
														<span className='hidden sm:inline'>Next</span>
														<ChevronRight className='h-3 w-3 sm:h-4 sm:w-4' />
													</Button>
												</TooltipTrigger>
												<TooltipContent>Câu sau</TooltipContent>
											</Tooltip>

											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant='default'
														size='sm'
														onClick={() => setShowFinishDialog(true)}
														className='text-xs gap-1 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
													>
														<Check className='h-3 w-3 sm:h-4 sm:w-4' />
														<span className='hidden sm:inline'>Submit</span>
													</Button>
												</TooltipTrigger>
												<TooltipContent>Nộp bài</TooltipContent>
											</Tooltip>
										</div>
									</div>
								</div>
							</div>
						</ResizablePanel>
					</ResizablePanelGroup>
				</div>

				{/* Finish Test Dialog */}
				<AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
					<AlertDialogContent className='max-w-md'>
						<AlertDialogHeader>
							<AlertDialogTitle className='flex items-center gap-2'>
								<Check className='h-5 w-5 text-green-600' />
								Hoàn thành bài thi?
							</AlertDialogTitle>
							<AlertDialogDescription className='space-y-3 pt-2'>
								<div className='bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2'>
									<div className='flex justify-between items-center'>
										<span className='text-sm'>Tổng số câu:</span>
										<span className='font-semibold'>{mockQuestions.length}</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-sm'>Đã trả lời:</span>
										<span className='font-semibold text-green-600'>{Object.keys(answers).length}</span>
									</div>
									{Object.keys(answers).length < mockQuestions.length && (
										<div className='flex justify-between items-center'>
											<span className='text-sm'>Chưa trả lời:</span>
											<span className='font-semibold text-orange-600'>
												{mockQuestions.length - Object.keys(answers).length}
											</span>
										</div>
									)}
									{flaggedQuestions.size > 0 && (
										<div className='flex justify-between items-center'>
											<span className='text-sm'>Đã đánh dấu:</span>
											<span className='font-semibold text-orange-600'>{flaggedQuestions.size}</span>
										</div>
									)}
								</div>

								{Object.keys(answers).length < mockQuestions.length && (
									<div className='bg-orange-50 dark:bg-orange-950 p-3 rounded-lg flex gap-2'>
										<AlertCircle className='h-5 w-5 text-orange-600 shrink-0 mt-0.5' />
										<p className='text-sm text-orange-800 dark:text-orange-200'>
											Bạn vẫn còn câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài?
										</p>
									</div>
								)}

								<p className='text-center pt-2'>Sau khi nộp bài, bạn không thể thay đổi câu trả lời.</p>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
							<AlertDialogAction onClick={handleCompleteTest} className='bg-green-600 hover:bg-green-700'>
								Nộp bài
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</TooltipProvider>
	);
}
