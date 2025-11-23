// Gemini API service for generating contextual questions and feedback
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

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    if (model) this.model = model;
  }

  // Configure service
  configure(apiKey: string, model?: string): void {
    this.apiKey = apiKey;
    if (model) this.model = model;
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

  // Generate speaking feedback and assessment
  async generateFeedback(
    context: SpeakingContext,
    userAnswers: Array<{ question: string; answer: string; duration: number }>
  ): Promise<{
    overallScore: number;
    criteria: Array<{
      name: string;
      score: number;
      strengths: string[];
      improvements: string[];
      examples: string[];
    }>;
    recommendations: string[];
  }> {
    try {
      const prompt = this.buildFeedbackPrompt(context, userAnswers);
      const response = await this.generateContent(prompt);
      
      return this.parseFeedbackResponse(response);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
      return this.getFallbackFeedback();
    }
  }

  // Generate topic card for Part 2
  async generateTopicCard(): Promise<{
    topic: string;
    bulletPoints: string[];
    prepTime: number;
    speakingTime: number;
  }> {
    try {
      const prompt = `Generate an IELTS Speaking Part 2 topic card. Include:
      - A clear topic description
      - 3-4 bullet points to guide the response
      - Standard timing (1 minute prep, 1-2 minutes speaking)
      
      Format as JSON:
      {
        "topic": "Describe a person who has influenced you",
        "bulletPoints": ["Who this person is", "How you know them", "What they did to influence you", "Why this person is important to you"],
        "prepTime": 60,
        "speakingTime": 120
      }`;

      const response = await this.generateContent(prompt);
      return this.parseTopicCardResponse(response);
    } catch (error) {
      console.error('Failed to generate topic card:', error);
      return this.getFallbackTopicCard();
    }
  }

  // Private method to make API call to Gemini
  private async generateContent(prompt: string): Promise<string> {
    const request: GeminiRequest = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    console.log('🔗 Gemini API Request:', {
      baseUrl: this.baseUrl,
      model: this.model,
      fullUrl: url.replace(this.apiKey, '***API_KEY***'),
      apiKeyLength: this.apiKey?.length || 0
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('📡 Gemini API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error Body:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini');
    }

    return data.candidates[0].content.parts[0].text;
  }

  // Build question generation prompt
  private buildQuestionPrompt(context: SpeakingContext, options: QuestionGenerationOptions): string {
    const partDescriptions = {
      1: 'Part 1 focuses on familiar topics like family, work, hobbies, and hometown. Questions should be personal and straightforward.',
      2: 'Part 2 requires the candidate to speak for 1-2 minutes on a given topic with preparation time.',
      3: 'Part 3 involves abstract discussion related to Part 2 topic, requiring analysis and opinions.'
    };

    const recentAnswers = context.userAnswers.slice(-3).join(' ');
    const recentQuestions = context.previousQuestions.slice(-3).join(' ');

    return `You are an IELTS Speaking examiner. Generate the next question for Part ${context.part}.

Context:
${partDescriptions[context.part]}

Previous questions: ${recentQuestions}
Recent user answers: ${recentAnswers}
Session duration: ${Math.round(context.sessionDuration / 60)} minutes
Question count: ${context.questionCount}

Requirements:
- Generate ONE natural follow-up question
- Make it contextually relevant to previous answers
- Appropriate difficulty for Part ${context.part}
- Natural examiner tone
- Don't repeat previous questions

Return only the question, no additional text.`;
  }

  // Build feedback generation prompt
  private buildFeedbackPrompt(
    context: SpeakingContext,
    userAnswers: Array<{ question: string; answer: string; duration: number }>
  ): string {
    const answersText = userAnswers
      .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer} (${qa.duration}s)`)
      .join('\n\n');

    return `You are an IELTS Speaking examiner. Analyze this Part ${context.part} performance and provide detailed feedback.

Performance Data:
${answersText}

Assess according to IELTS criteria:
1. Fluency & Coherence (0-9)
2. Lexical Resource (0-9)
3. Grammatical Range & Accuracy (0-9)
4. Pronunciation (0-9)

For each criterion, provide:
- Score (0-9)
- 2-3 specific strengths
- 2-3 areas for improvement
- 1-2 examples from the responses

Also provide 3-4 overall recommendations.

Format as JSON:
{
  "overallScore": 6.5,
  "criteria": [
    {
      "name": "Fluency & Coherence",
      "score": 7,
      "strengths": ["Natural flow", "Good linking words"],
      "improvements": ["Less hesitation", "More complex ideas"],
      "examples": ["Good use of 'however'", "Some pauses affected flow"]
    }
  ],
  "recommendations": ["Practice daily", "Expand vocabulary"]
}`;
  }

  // Extract question from response
  private extractQuestion(response: string): string {
    const lines = response.trim().split('\n');
    const question = lines.find(line => line.includes('?')) || lines[0];
    return question.trim();
  }

  // Parse feedback response
  private parseFeedbackResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse feedback JSON:', error);
    }
    
    return this.getFallbackFeedback();
  }

  // Parse topic card response
  private parseTopicCardResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse topic card JSON:', error);
    }
    
    return this.getFallbackTopicCard();
  }

  // Fallback questions for each part
  private getFallbackQuestion(context: SpeakingContext): string {
    const fallbacks = {
      1: [
        "Can you tell me more about that?",
        "How long have you been doing this?",
        "What do you enjoy most about it?",
        "Do you think this will change in the future?"
      ],
      2: [
        "Thank you. Now let's move on to some questions related to what you just said.",
      ],
      3: [
        "What do you think are the advantages and disadvantages of this?",
        "How do you think this compares to the past?",
        "What role does technology play in this?",
        "Do you think this is the same in all countries?"
      ]
    };

    const questions = fallbacks[context.part];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  // Fallback feedback
  private getFallbackFeedback(): any {
    return {
      overallScore: 6.0,
      criteria: [
        {
          name: "Fluency & Coherence",
          score: 6,
          strengths: ["Maintained conversation", "Used some linking words"],
          improvements: ["Develop ideas more fully", "Reduce hesitation"],
          examples: ["Good use of transitions", "Some unclear connections"]
        },
        {
          name: "Lexical Resource",
          score: 6,
          strengths: ["Appropriate vocabulary for topics", "Some variety in word choice"],
          improvements: ["Use more sophisticated vocabulary", "Avoid repetition"],
          examples: ["Good topic-specific words", "Repeated 'good' multiple times"]
        },
        {
          name: "Grammatical Range & Accuracy",
          score: 6,
          strengths: ["Correct basic structures", "Few basic errors"],
          improvements: ["Use more complex sentences", "Check verb tenses"],
          examples: ["Good simple present usage", "Some article errors"]
        },
        {
          name: "Pronunciation",
          score: 6,
          strengths: ["Generally clear speech", "Good word stress"],
          improvements: ["Work on specific sounds", "Improve intonation"],
          examples: ["Clear consonants", "Some vowel sounds unclear"]
        }
      ],
      recommendations: [
        "Practice speaking for 15-20 minutes daily",
        "Record yourself and listen for improvements",
        "Learn topic-specific vocabulary",
        "Focus on developing ideas with examples"
      ]
    };
  }

  // Fallback topic card
  private getFallbackTopicCard(): any {
    return {
      topic: "Describe a place you would like to visit",
      bulletPoints: [
        "Where this place is",
        "What you know about this place",
        "How you learned about it",
        "Why you would like to visit there"
      ],
      prepTime: 60,
      speakingTime: 120
    };
  }

  // Check API health
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.generateContent("Hello, how are you?");
      return response.length > 0;
    } catch (error) {
      return false;
    }
  }
}

// Use Vite runtime env (import.meta.env). Fall back to other possible keys if present.
const runtimeEnv: any = typeof import.meta !== 'undefined' ? (import.meta as any).env : (typeof window !== 'undefined' ? (window as any).__env : {});
const GEMINI_API_KEY = runtimeEnv?.VITE_GEMINI_API_KEY || runtimeEnv?.REACT_APP_GEMINI_API_KEY || runtimeEnv?.GEMINI_API_KEY || '';
const GEMINI_MODEL = runtimeEnv?.VITE_GEMINI_MODEL || runtimeEnv?.REACT_APP_GEMINI_MODEL || 'gemini-1.5-flash';

console.log('🔑 Gemini Configuration:', {
  apiKeyLength: GEMINI_API_KEY?.length || 0,
  model: GEMINI_MODEL,
  hasApiKey: !!GEMINI_API_KEY
});

export const geminiService = new GeminiService(GEMINI_API_KEY, GEMINI_MODEL);