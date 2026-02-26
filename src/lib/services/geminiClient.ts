// Client-side wrapper for Gemini API calls
// This uses Next.js API routes to protect API keys

import { SpeakingContext, QuestionGenerationOptions } from '@/lib/services/geminiService';

export class GeminiAPIClient {
	// Generate next question via API route
	async generateNextQuestion(
		context: SpeakingContext,
		options: QuestionGenerationOptions = {}
	): Promise<string> {
		try {
			const response = await fetch('/api/gemini/generate-question', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ context, options }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();
			return data.question;
		} catch (error) {
			console.error('Failed to generate question:', error);
			throw error;
		}
	}

	// Generate feedback via API route
	async generateFeedback(
		context: SpeakingContext,
		userAnswers: Array<{ question: string; answer: string; duration: number }>
	): Promise<any> {
		try {
			const response = await fetch('/api/gemini/generate-feedback', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ context, userAnswers }),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();
			return data.feedback;
		} catch (error) {
			console.error('Failed to generate feedback:', error);
			throw error;
		}
	}
}

// Export singleton instance
export const geminiClient = new GeminiAPIClient();
