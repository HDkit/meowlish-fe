// API route for Gemini-based question generation
// This protects the API key by keeping it server-side

import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/geminiService';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { context, options } = body;

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
		const question = await geminiService.generateNextQuestion(context, options);

		return NextResponse.json({ question });
	} catch (error) {
		console.error('Question generation error:', error);
		return NextResponse.json(
			{ error: 'Failed to generate question' },
			{ status: 500 }
		);
	}
}
