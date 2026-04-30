'use server';
/**
 * @fileOverview An AI agent for expanding and refining existing thoughts or draft ideas.
 *
 * - expandExistingThought - A function that handles the thought expansion process.
 * - ExpandExistingThoughtInput - The input type for the expandExistingThought function.
 * - ExpandExistingThoughtOutput - The return type for the expandExistingThought function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandExistingThoughtInputSchema = z.object({
  thoughtContent: z
    .string()
    .describe('The existing thought or draft idea to be expanded.'),
  expansionGoal: z
    .string()
    .optional()
    .describe(
      'Optional. A specific goal for the expansion, e.g., "add more technical details", "explore ethical implications", "brainstorm related concepts", "provide counter-arguments.", "provide a positive outlook", "provide a negative outlook", "provide a neutral outlook", etc.'
    ),
});
export type ExpandExistingThoughtInput = z.infer<
  typeof ExpandExistingThoughtInputSchema
>;

const ExpandExistingThoughtOutputSchema = z.object({
  expandedThought: z
    .string()
    .describe('The AI-expanded, deepened, or refined version of the original thought.'),
  newPerspectives: z
    .array(z.string())
    .describe('A list of new perspectives, details, or related concepts suggested by the AI.'),
});
export type ExpandExistingThoughtOutput = z.infer<
  typeof ExpandExistingThoughtOutputSchema
>;

export async function expandExistingThought(
  input: ExpandExistingThoughtInput
): Promise<ExpandExistingThoughtOutput> {
  return expandExistingThoughtFlow(input);
}

const expandExistingThoughtPrompt = ai.definePrompt({
  name: 'expandExistingThoughtPrompt',
  input: {schema: ExpandExistingThoughtInputSchema},
  output: {schema: ExpandExistingThoughtOutputSchema},
  prompt: `You are a highly creative and insightful AI assistant, specializing in expanding, deepening, and refining ideas. Your task is to take a given thought and provide comprehensive ways to broaden its scope, add details, and offer new perspectives.

Original Thought: {{{thoughtContent}}}

{{#if expansionGoal}}
My specific goal for this expansion is: {{{expansionGoal}}}
{{/if}}

Please expand on the thought, providing a more detailed and nuanced version. Also, list several distinct new perspectives or related concepts that could further enrich this idea.`,
});

const expandExistingThoughtFlow = ai.defineFlow(
  {
    name: 'expandExistingThoughtFlow',
    inputSchema: ExpandExistingThoughtInputSchema,
    outputSchema: ExpandExistingThoughtOutputSchema,
  },
  async input => {
    let retries = 3;
    let lastError: any = null;

    while (retries > 0) {
      try {
        const {output} = await expandExistingThoughtPrompt(input);
        return output!;
      } catch (err: any) {
        lastError = err;
        const errorMessage = err.message?.toLowerCase() || '';
        const isRetryable = errorMessage.includes('503') || 
                          errorMessage.includes('429') || 
                          errorMessage.includes('quota') || 
                          errorMessage.includes('resource_exhausted') ||
                          errorMessage.includes('high demand');
                          
        if (isRetryable) {
          retries--;
          if (retries > 0) {
            await new Promise(r => setTimeout(r, 2000 * (3 - retries)));
            continue;
          }
        }
        throw err;
      }
    }
    throw lastError;
  }
);
