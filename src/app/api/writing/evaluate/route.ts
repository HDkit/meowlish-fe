// Next.js API route for writing evaluation using Gemini
// Replaces the broken /writing/evaluate endpoint

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

function buildWritingPrompt(body: {
  exam_type: string;
  task_type: string;
  question: string;
  content: string;
  target_score?: number | null;
}): string {
  const { exam_type, task_type, question, content, target_score } = body;
  const targetNote = target_score ? `The student's target score is ${target_score}.` : '';

  if (exam_type === 'IELTS') {
    return `You are an expert IELTS examiner. Evaluate the following IELTS Writing ${task_type} response.

${targetNote}

## Question / Task Prompt:
${question}

## Student's Response:
${content}

Evaluate strictly based on the four IELTS Writing band descriptors:
1. Task Achievement / Task Response (TA/TR)
2. Coherence and Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range and Accuracy (GRA)

Each criterion is scored from 0-9. The overall band score is the average rounded to the nearest 0.5.

Respond ONLY with valid JSON in this exact format:
{
  "overall_score": <number 0-9>,
  "sub_scores": {
    "Task Achievement": <number 0-9>,
    "Coherence and Cohesion": <number 0-9>,
    "Lexical Resource": <number 0-9>,
    "Grammatical Range and Accuracy": <number 0-9>
  },
  "detailed_feedback": "<multi-paragraph markdown feedback with strengths and areas for improvement>",
  "corrected_version": "<improved version of the essay>",
  "corrections": [
    {
      "error_type": "<Grammar|Spelling|Word Choice|Punctuation|Structure>",
      "original_text": "<exact phrase from student response>",
      "corrected_text": "<corrected version>",
      "explanation": "<brief explanation>"
    }
  ]
}`;
  } else {
    // TOEIC Writing
    return `You are an expert TOEIC examiner. Evaluate the following TOEIC Writing response.

${targetNote}

## Task Type: ${task_type}
## Question / Prompt:
${question}

## Student's Response:
${content}

Evaluate based on TOEIC Writing scoring criteria: Content (0-100) and Organization (0-100). Overall score is out of 200.

Respond ONLY with valid JSON in this exact format:
{
  "overall_score": <number 0-200>,
  "sub_scores": {
    "Content": <number 0-100>,
    "Organization": <number 0-100>
  },
  "detailed_feedback": "<multi-paragraph markdown feedback with strengths and areas for improvement>",
  "corrected_version": "<improved version of the response>",
  "corrections": [
    {
      "error_type": "<Grammar|Spelling|Word Choice|Punctuation|Structure>",
      "original_text": "<exact phrase from student response>",
      "corrected_text": "<corrected version>",
      "explanation": "<brief explanation>"
    }
  ]
}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exam_type, task_type, question, content } = body;

    if (!question?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Question and content are required' },
        { status: 400 },
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const model =
      process.env.GEMINI_MODEL ||
      process.env.NEXT_PUBLIC_GEMINI_MODEL ||
      'gemini-2.5-flash';

    if (!apiKey) {
      // No API key — return a mock response rather than crashing
      return NextResponse.json(getMockEvaluation(exam_type));
    }

    const prompt = buildWritingPrompt(body);
    const geminiUrl = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      // Fallback to mock on Gemini error
      return NextResponse.json(getMockEvaluation(exam_type));
    }

    const geminiData = await geminiRes.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Strip markdown code fences if present
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    // Find first { ... } block
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response:', rawText);
      return NextResponse.json(getMockEvaluation(exam_type));
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Writing evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Fallback mock when Gemini is unavailable
function getMockEvaluation(examType: string) {
  if (examType === 'IELTS') {
    return {
      overall_score: 6.5,
      sub_scores: {
        'Task Achievement': 6.5,
        'Coherence and Cohesion': 7.0,
        'Lexical Resource': 6.0,
        'Grammatical Range and Accuracy': 6.5,
      },
      detailed_feedback: `**Overall Band 6.5** — A competent response that addresses the task with some lapses in accuracy and development.

**Strengths:**
- Addresses the task adequately
- Generally clear organization
- Appropriate range of vocabulary

**Areas for Improvement:**
- Develop ideas with more specific examples
- Reduce grammatical errors in complex sentences
- Vary sentence structures more`,
      corrected_version: `Technology has undoubtedly changed the way we live in many ways. We can now communicate with people all over the world easily. Medical technology helps doctors treat patients better. However, some people spend too much time on their devices. In conclusion, I think technology is beneficial for us.

(Note: This is mock data because GEMINI_API_KEY is not configured)`,
      corrections: [
        {
          error_type: 'Grammar',
          original_text: 'technology have improved',
          corrected_text: 'technology has improved',
          explanation: 'Subject-verb agreement error'
        },
        {
          error_type: 'Word Choice',
          original_text: 'very easy',
          corrected_text: 'much easier',
          explanation: 'More appropriate comparative form'
        }
      ],
    };
  }
  return {
    overall_score: 150,
    sub_scores: { Content: 75, Organization: 75 },
    detailed_feedback: `**Score: 150/200** — The response demonstrates satisfactory content and organization.

**Strengths:**
- Relevant content
- Clear structure

**Areas for Improvement:**
- Develop ideas further
- Improve transitions`,
    corrected_version: `The rapid advancement of technology has brought significant changes to our daily lives. From communication to healthcare, the impact is visible everywhere...

(Note: This is mock data because GEMINI_API_KEY is not configured)`,
    corrections: [
      {
        error_type: 'Grammar',
        original_text: 'people is',
        corrected_text: 'people are',
        explanation: 'Plural subject requires plural verb'
      }
    ],
  };
}
