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
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 },
      );
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
      return NextResponse.json(
        { error: `Gemini API error: ${geminiRes.status}` },
        { status: 502 },
      );
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
      return NextResponse.json(
        { error: 'Invalid response from Gemini API' },
        { status: 502 },
      );
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

