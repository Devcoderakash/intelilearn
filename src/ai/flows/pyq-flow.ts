
'use server';
/**
 * @fileOverview PYQ flow with environment variable retrieval.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PYQInputSchema = z.object({
  subject: z.string(),
  topic: z.string().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
});

const PYQOutputSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    type: z.enum(['mcq', 'subjective']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string(),
    year: z.number().optional(),
    examContext: z.string(),
  })),
});

async function callExternalPYQ(input: any, provider: 'groq' | 'openai'): Promise<any> {
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
        { role: 'system', content: `Academic Examiner. Return JSON exactly matching this structure:
{
  "questions": [{
    "question": "string",
    "type": "mcq|subjective",
    "options": ["string"] (only if type is mcq),
    "correctAnswer": "string",
    "explanation": "string",
    "year": 2023,
    "examContext": "string"
  }]
}` },
        { role: 'user', content: `Generate 5 real Previous Year Questions (PYQs) for ${input.subject} on ${input.topic || 'general'} at difficulty ${input.difficulty}. Include real exam years. For MCQs provide options, for subjective provide none.` }
      ],
      response_format: { type: 'json_object' }
    })
  });
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function generatePYQs(input: z.infer<typeof PYQInputSchema>) {
  return pyqFlow(input);
}

const pyqFlow = ai.defineFlow(
  {
    name: 'pyqFlow',
    inputSchema: PYQInputSchema,
    outputSchema: PYQOutputSchema,
  },
  async input => {
    try {
      return await callExternalPYQ(input, 'groq');
    } catch (e) {
      console.warn("Groq failed, trying Gemini...");
    }

    let retries = 5;
    while (retries > 0) {
      try {
        const {output} = await ai.generate({
          system: 'Academic Examiner. Generate real Previous Year Questions (PYQs). Include real exam years. Distinguish between MCQ and subjective.',
          prompt: `Generate 5 questions for ${input.subject} on ${input.topic || 'general'} at difficulty ${input.difficulty}.`,
          output: { schema: PYQOutputSchema }
        });
        return output!;
      } catch (err) {
        retries--;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.warn("Gemini failed, trying OpenAI...");
    try {
      return await callExternalPYQ(input, 'openai');
    } catch (e) {
      throw new Error("PYQ engine is offline.");
    }
  }
);
