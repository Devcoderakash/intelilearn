
'use server';
/**
 * @fileOverview Timetable flow with environment variable retrieval.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateWithGeminiCycle } from "@/lib/ai-resilience";

const TimetableInputSchema = z.object({
  goal: z.string(),
  subjects: z.string(),
  dailyHours: z.number(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  deadline: z.string().optional(),
  constraints: z.string().optional(),
  learningStyle: z.string().optional(),
  syllabusContent: z.string().optional(),
});

const TimetableOutputSchema = z.object({
  timetableMarkdown: z.string(),
  roadmapMarkdown: z.string(),
  resources: z.object({
    youtube: z.array(z.object({ title: z.string(), link: z.string(), reason: z.string() })),
    documentation: z.array(z.object({ title: z.string(), link: z.string() })),
    github: z.array(z.object({ title: z.string(), link: z.string() })),
  }),
  techniques: z.array(z.object({ name: z.string(), description: z.string() })),
  mentorAdvice: z.string(),
});

async function callExternalTimetable(input: any, provider: 'groq' | 'openai'): Promise<any> {
  const url = provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const key = provider === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

  if (!key) throw new Error(`${provider} API key is missing.`);

  const currentDate = new Date().toLocaleDateString();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: `You are an expert Study Architect.
Current Date: ${currentDate}

Analyze the student's goal, subjects, expertise level, and Deadline.
If a 'syllabusContent' is provided, treat it as the MASTER SOURCE for topics and chapters.
CRITICAL TIMING RULES:
1. If a Deadline/Exam Date is provided, calculate the days remaining from Today (${currentDate}).
2. The entire syllabus MUST be completed at least ONE DAY BEFORE the examination date (this is the buffer day).
3. Distribute the workload evenly across the remaining days.
4. Also consider Constraints (Focus Areas) and Learning Style.

Return JSON exactly matching this structure:
{
  "timetableMarkdown": "string (Detailed markdown timetable)",
  "roadmapMarkdown": "string (Markdown roadmap)",
  "resources": {
    "youtube": [{ "title": "string", "link": "string", "reason": "string" }],
    "documentation": [{ "title": "string", "link": "string" }],
    "github": [{ "title": "string", "link": "string" }]
  },
  "techniques": [{ "name": "string", "description": "string" }],
  "mentorAdvice": "string"
}` },
        { role: 'user', content: `Current Date: ${currentDate}. Personalize a study plan for: ${JSON.stringify(input)}` }
      ],
      response_format: { type: 'json_object' }
    })
  });
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function generateTimetablePlan(input: z.infer<typeof TimetableInputSchema>) {
  return timetableFlow(input);
}

const timetableFlow = ai.defineFlow(
  {
    name: 'timetableFlow',
    inputSchema: TimetableInputSchema,
    outputSchema: TimetableOutputSchema,
  },
  async input => {
    try {
      return await callExternalTimetable(input, 'groq');
    } catch (e) {
      console.warn("Groq failed, trying Gemini...");
    }

    try {
      const currentDate = new Date().toLocaleDateString();
      const {output} = await generateWithGeminiCycle({
        system: `Expert Study Architect. Today is ${currentDate}. 
        RULES: 
        1. Complete all topics ONE DAY BEFORE the exam date (buffer).
        2. Calculate days remaining from today.
        3. Consider constraints/style.`,
        prompt: JSON.stringify(input),
        output: { schema: TimetableOutputSchema }
      });
      return output!;
    } catch (err) {
      console.warn("Gemini cycle failed, trying OpenAI...");
    }

    console.warn("Gemini failed, trying OpenAI...");
    try {
      return await callExternalTimetable(input, 'openai');
    } catch (e) {
      throw new Error("Timetable engine is offline.");
    }
  }
);
