// API route for Gemini-based feedback generation
// This protects the API key by keeping it server-side

import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/geminiService';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { context, userAnswers } = body;

		// Initialize Gemini service with server-side API key
		const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
		const model = process.env.GEMINI_MODEL || process.env.NEXT_PUBLIC_GEMINI_MODEL;

		if (!apiKey) {
			return NextResponse.json(
				{ error: 'Gemini API key not configured' },
				{ status: 500 }
			);
		}

		const geminiService = new GeminiService(apiKey, model);
		const feedback = await geminiService.generateFeedback(context, userAnswers);

		return NextResponse.json({ feedback });
	} catch (error) {
		console.error('Feedback generation error:', error);
		return NextResponse.json(
			{ error: 'Failed to generate feedback' },
			{ status: 500 }
		);
	}
}
