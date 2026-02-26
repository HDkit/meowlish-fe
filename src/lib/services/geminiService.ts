// Gemini API service - can be used on server or client
// When using on server (API routes), env vars don't need NEXT_PUBLIC_ prefix

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

export interface GeminiSafetySettings {
  category: string;
  threshold: string;
}

export interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: GeminiGenerationConfig;
  safetySettings?: GeminiSafetySettings[];
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

export interface SpeakingContext {
  part: 1 | 2 | 3;
  previousQuestions: string[];
  userAnswers: string[];
  currentTopic?: string;
  sessionDuration: number;
  questionCount: number;
}

export interface QuestionGenerationOptions {
  difficulty?: 'easy' | 'medium' | 'hard';
  followUpStyle?: 'direct' | 'analytical' | 'comparative';
  maxLength?: number;
}

export class GeminiService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';
  private model: string = 'gemini-2.5-flash';

  constructor(apiKey?: string, model?: string) {
    // Try to get API key from environment if not provided
    this.apiKey = apiKey || this.getApiKey();
    if (model) this.model = model;
  }

  private getApiKey(): string {
    // Server-side or client-side detection
    if (typeof window === 'undefined') {
      // Server-side - use non-public env var
      return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    } else {
      // Client-side - use public env var
      return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    }
  }

  // Configure service
  configure(apiKey: string, model?: string): void {
    this.apiKey = apiKey;
    if (model) this.model = model;
  }

  // Generate content using Gemini API
  private async generateContent(prompt: string, config?: GeminiGenerationConfig): Promise<GeminiResponse> {
    const request: GeminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: config || {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Generate next question based on context
  async generateNextQuestion(
    context: SpeakingContext,
    options: QuestionGenerationOptions = {}
  ): Promise<string> {
    try {
      const prompt = this.buildQuestionPrompt(context, options);
      const response = await this.generateContent(prompt);
      
      return this.extractQuestion(response);
    } catch (error) {
      console.error('Failed to generate question:', error);
      return this.getFallbackQuestion(context);
    }
  }

  private buildQuestionPrompt(context: SpeakingContext, options: QuestionGenerationOptions): string {
    const { part, previousQuestions, userAnswers, currentTopic, questionCount } = context;
    
    let prompt = `You are an IELTS Speaking examiner. Generate the next question for Part ${part}.\n\n`;
    
    if (part === 1) {
      prompt += 'Part 1 focuses on familiar topics like home, family, work, studies, and interests. Keep questions simple and direct.\n';
    } else if (part === 2) {
      prompt += 'Part 2 is a long turn where the candidate speaks for 1-2 minutes on a topic card.\n';
    } else {
      prompt += 'Part 3 involves more abstract discussion and analytical thinking.\n';
    }

    if (previousQuestions.length > 0) {
      prompt += '\nPrevious questions asked:\n';
      previousQuestions.forEach((q, i) => {
        prompt += `${i + 1}. ${q}\n`;
        if (userAnswers[i]) {
          prompt += `   Answer: ${userAnswers[i]}\n`;
        }
      });
    }

    if (currentTopic) {
      prompt += `\nCurrent topic: ${currentTopic}\n`;
    }

    prompt += '\nGenerate the next question. Return ONLY the question text, nothing else.';
    
    return prompt;
  }

  private extractQuestion(response: GeminiResponse): string {
    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content.parts && content.parts.length > 0) {
        return content.parts[0].text.trim();
      }
    }
    throw new Error('No valid response from Gemini');
  }

  private getFallbackQuestion(context: SpeakingContext): string {
    const { part, questionCount } = context;
    
    const fallbacks = {
      1: [
        "Tell me about your hometown.",
        "What do you like to do in your free time?",
        "Do you work or are you a student?",
        "What kind of music do you enjoy?"
      ],
      2: [
        "Describe a place you like to visit.",
        "Talk about a memorable event in your life.",
        "Describe a person who has influenced you."
      ],
      3: [
        "How do you think technology has changed society?",
        "What role does education play in personal development?",
        "How might cities evolve in the future?"
      ]
    };

    const questions = fallbacks[part as keyof typeof fallbacks];
    return questions[questionCount % questions.length];
  }

  // Generate feedback and assessment
  async generateFeedback(
    context: SpeakingContext,
    userAnswers: Array<{ question: string; answer: string; duration: number }>
  ): Promise<any> {
    try {
      const prompt = this.buildFeedbackPrompt(context, userAnswers);
      const response = await this.generateContent(prompt, {
        temperature: 0.5,
        maxOutputTokens: 2048
      });

      return this.parseFeedback(response);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
      return this.getDefaultFeedback();
    }
  }

  private buildFeedbackPrompt(
    context: SpeakingContext,
    userAnswers: Array<{ question: string; answer: string; duration: number }>
  ): string {
    let prompt = `You are an IELTS Speaking examiner. Evaluate this Part ${context.part} performance.\n\n`;
    
    prompt += 'Conversation:\n';
    userAnswers.forEach((qa, i) => {
      prompt += `\nQ${i + 1}: ${qa.question}\n`;
      prompt += `A${i + 1}: ${qa.answer}\n`;
      prompt += `Duration: ${qa.duration}s\n`;
    });

    prompt += '\nProvide assessment in JSON format with:\n';
    prompt += '{\n';
    prompt += '  "overallScore": <number 1-9>,\n';
    prompt += '  "criteria": [\n';
    prompt += '    {"name": "Fluency and Coherence", "score": <1-9>, "feedback": "<text>"},\n';
    prompt += '    {"name": "Lexical Resource", "score": <1-9>, "feedback": "<text>"},\n';
    prompt += '    {"name": "Grammatical Range and Accuracy", "score": <1-9>, "feedback": "<text>"},\n';
    prompt += '    {"name": "Pronunciation", "score": <1-9>, "feedback": "<text>"}\n';
    prompt += '  ],\n';
    prompt += '  "strengths": ["<strength1>", "<strength2>"],\n';
    prompt += '  "improvements": ["<improvement1>", "<improvement2>"]\n';
    prompt += '}\n';
    
    return prompt;
  }

  private parseFeedback(response: GeminiResponse): any {
    try {
      const text = this.extractQuestion(response);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse feedback JSON:', error);
    }
    return this.getDefaultFeedback();
  }

  private getDefaultFeedback(): any {
    return {
      overallScore: 5,
      criteria: [
        { name: 'Fluency and Coherence', score: 5, feedback: 'Assessment unavailable' },
        { name: 'Lexical Resource', score: 5, feedback: 'Assessment unavailable' },
        { name: 'Grammatical Range and Accuracy', score: 5, feedback: 'Assessment unavailable' },
        { name: 'Pronunciation', score: 5, feedback: 'Assessment unavailable' }
      ],
      strengths: ['Unable to evaluate at this time'],
      improvements: ['Please try again later']
    };
  }
}

// Helper to create service instance
export function createGeminiService(apiKey?: string, model?: string): GeminiService {
  return new GeminiService(apiKey, model);
}
