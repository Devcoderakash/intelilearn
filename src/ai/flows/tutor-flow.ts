
'use server';
/**
 * @fileOverview AI Study Tutor flow with environment variable retrieval for tokens.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TutorInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).optional(),
});

const TutorOutputSchema = z.object({
  response: z.string(),
});

async function callExternalTutor(message: string, history: any[], provider: 'groq' | 'openai'): Promise<string> {
  const url = provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const key = provider === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

  if (!key) throw new Error(`${provider} API key is missing.`);

  const messages = history?.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content })) || [];
  messages.push({ role: 'user', content: message });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: 'You are a helpful study tutor. Explain things clearly.' }, ...messages]
    })
  });
  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) throw new Error("Invalid response from provider.");
  return data.choices[0].message.content;
}

export async function tutorChat(input: z.infer<typeof TutorInputSchema>) {
  return tutorFlow(input);
}

const tutorFlow = ai.defineFlow(
  {
    name: 'tutorFlow',
    inputSchema: TutorInputSchema,
    outputSchema: TutorOutputSchema,
  },
  async input => {
    // 1. Primary: Groq
    try {
      const groqRes = await callExternalTutor(input.message, input.history || [], 'groq');
      return { response: groqRes };
    } catch (e) {
      console.warn("Groq failed, trying Gemini...");
    }

    // 2. Secondary: Gemini
    let retries = 3;
    while (retries > 0) {
      try {
        const {text} = await ai.generate({
          system: 'Helpful Study Tutor',
          history: input.history?.map(h => ({ role: h.role, content: [{ text: h.content }] })) as any,
          prompt: input.message,
        });
        return { response: text };
      } catch (err) {
        retries--;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // 3. Tertiary: OpenAI
    console.warn("Gemini failed, trying OpenAI...");
    try {
      const openaiRes = await callExternalTutor(input.message, input.history || [], 'openai');
      return { response: openaiRes };
    } catch (e) {
      throw new Error("AI is busy. Please try again.");
    }
  }
);
