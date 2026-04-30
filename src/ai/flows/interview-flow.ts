
'use server';
/**
 * @fileOverview Interview flow with environment variable retrieval.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterviewSetupSchema = z.object({
  role: z.string(),
  topic: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
});

const InterviewOutputSchema = z.object({
  questions: z.array(z.object({ question: z.string(), context: z.string() })),
});

async function callExternalQuestions(input: any, provider: 'groq' | 'openai'): Promise<any> {
  const url = provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const key = provider === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

  if (!key) throw new Error(`${provider} API key is missing.`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: `Expert Recruiter. Return JSON exactly matching this structure:
{
  "questions": [
    {
      "question": "string",
      "context": "string"
    }
  ]
}` },
        { role: 'user', content: `Generate 5 interview questions for ${input.role} on ${input.topic}` }
      ],
      response_format: { type: 'json_object' }
    })
  });
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function generateInterviewQuestions(input: z.infer<typeof InterviewSetupSchema>) {
  return interviewFlow(input);
}

const interviewFlow = ai.defineFlow(
  {
    name: 'interviewFlow',
    inputSchema: InterviewSetupSchema,
    outputSchema: InterviewOutputSchema,
  },
  async input => {
    try {
      return await callExternalQuestions(input, 'groq');
    } catch (e) {
      console.warn("Groq failed, trying Gemini...");
    }

    let retries = 5;
    while (retries > 0) {
      try {
        const {output} = await ai.generate({
          system: 'Expert Recruiter',
          prompt: `Generate 5 questions for ${input.role} on ${input.topic}`,
          output: { schema: InterviewOutputSchema }
        });
        return output!;
      } catch (err) {
        retries--;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.warn("Gemini failed, trying OpenAI...");
    try {
      return await callExternalQuestions(input, 'openai');
    } catch (e) {
      throw new Error("All interview engines are currently offline.");
    }
  }
);

const EvaluationInputSchema = z.object({
  role: z.string(),
  topic: z.string(),
  questionsAndAnswers: z.array(z.object({ question: z.string(), answer: z.string() })),
});

const EvaluationOutputSchema = z.object({
  overallScore: z.number(),
  feedback: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  detailedAnalysis: z.array(z.object({ question: z.string(), evaluation: z.string(), score: z.number() })),
  correctAnswers: z.array(z.string()), // Added correct answers array
});

async function callExternalEval(input: any, provider: 'groq' | 'openai'): Promise<any> {
  const url = provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const key = provider === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

  if (!key) throw new Error(`${provider} API key is missing.`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: `Expert Technical Evaluator. Return JSON exactly matching this structure:
{
  "overallScore": 0,
  "feedback": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "detailedAnalysis": [{"question": "string", "evaluation": "string", "score": 0}],
  "correctAnswers": ["string"]
}
IMPORTANT: The "detailedAnalysis" and "correctAnswers" arrays MUST maintain the EXACT SAME ORDER as the input questions.` },
        { role: 'user', content: JSON.stringify(input) }
      ],
      response_format: { type: 'json_object' }
    })
  });
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function evaluateInterview(input: z.infer<typeof EvaluationInputSchema>) {
  return evaluationFlow(input);
}

const evaluationFlow = ai.defineFlow(
  {
    name: 'evaluationFlow',
    inputSchema: EvaluationInputSchema,
    outputSchema: EvaluationOutputSchema,
  },
  async input => {
    // First attempt external eval via Groq
    try {
      const evalResult = await callExternalEval(input, 'groq');
      // Generate correct answers and merge
      const correct = await generateCorrectAnswers(input.questionsAndAnswers.map(q => q.question));
      return { ...evalResult, correctAnswers: correct };
    } catch (e) {
      console.warn("Groq failed, trying Gemini...");
    }

    // Gemini fallback with retries
    let retries = 5;
    while (retries > 0) {
      try {
        const {output} = await ai.generate({
          system: 'Technical Evaluator',
          prompt: JSON.stringify(input.questionsAndAnswers),
          output: { schema: EvaluationOutputSchema }
        });
        if (output) {
          const correct = await generateCorrectAnswers(input.questionsAndAnswers.map(q => q.question));
          return { ...output, correctAnswers: correct };
        }
      } catch (err) {
        retries--;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

// OpenAI fallback
    console.warn("Gemini failed, trying OpenAI...");
    try {
      const evalResult = await callExternalEval(input, 'openai');
      const correct = await generateCorrectAnswers(input.questionsAndAnswers.map(q => q.question));
      return { ...evalResult, correctAnswers: correct };
    } catch (e) {
      throw new Error("Evaluation engine is currently offline.");
    }
  }
);

async function generateCorrectAnswers(questions: string[]): Promise<string[]> {
  const schema = z.object({
    answers: z.array(z.string()),
  });

  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const key = process.env.GROQ_API_KEY;
    if (key) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: `Expert Developer. Return exactly this JSON structure: {"answers": ["string"]}. IMPORTANT: The "answers" array MUST maintain the EXACT SAME ORDER as the input questions.` },
            { role: 'user', content: `Provide brief, accurate correct answers for these questions: ${JSON.stringify(questions)}` }
          ],
          response_format: { type: 'json_object' }
        })
      });
      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      if (parsed.answers) return parsed.answers;
    }
  } catch (e) {}

  try {
    const {output} = await ai.generate({
      system: 'Expert Developer',
      prompt: `Provide brief, accurate correct answers for these questions. MAINTAIN THE EXACT ORDER of the input questions: ${JSON.stringify(questions)}`,
      output: { schema }
    });
    return output?.answers || questions.map(() => 'Answer not available');
  } catch (err) {
    return questions.map(() => 'Answer not available');
  }
}
