
'use server';

/**
 * @fileOverview AI flow to analyze user watch patterns and refine movie recommendations.
 *
 * - analyzeWatchPatterns - Analyzes viewing history to adjust recommendation weights and content mix.
 * - AnalyzeWatchPatternsInput - The input type for the analyzeWatchPatterns function.
 * - AnalyzeWatchPatternsOutput - The return type for the analyzeWatchPatterns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeWatchPatternsInputSchema = z.object({
  viewingHistory: z
    .string()
    .describe('A JSON string representing the user viewing history, including movie selections, ratings, and completions.'),
  currentMood: z.string().describe('The user\'s current mood.'),
  currentTime: z.string().describe('The current time of day (morning, afternoon, evening, night).'),
});
export type AnalyzeWatchPatternsInput = z.infer<typeof AnalyzeWatchPatternsInputSchema>;

const AnalyzeWatchPatternsOutputSchema = z.object({
  explanation: z.string().optional().describe("An explanation of the analysis and suggestions."),
  moodWeight: z.number().min(0).max(100).optional()
    .describe("The suggested influence of mood on recommendations, as a percentage (a NUMBER between 0 and 100). Example: 70 for 70%."),
  historyWeight: z.number().min(0).max(100).optional()
    .describe("The suggested influence of viewing history on recommendations, as a percentage (a NUMBER between 0 and 100). Example: 20 for 20%."),
  contentMix: z.record(
      z.string(), // Keys are strings (genres)
      z.number().min(0).max(1) // Values are numbers between 0 and 1
    ).optional()
  .describe("A suggested mix of content genres/types, where keys are genre strings and values are NUMBERS between 0 and 1 (e.g., comedy: 0.6, drama: 0.4), ideally summing to 1.")
});
export type AnalyzeWatchPatternsOutput = z.infer<typeof AnalyzeWatchPatternsOutputSchema>;

export async function analyzeWatchPatterns(input: AnalyzeWatchPatternsInput): Promise<AnalyzeWatchPatternsOutput> {
  return analyzeWatchPatternsFlow(input);
}

const analyzeWatchPatternsPrompt = ai.definePrompt({
  name: 'analyzeWatchPatternsPrompt',
  input: {schema: AnalyzeWatchPatternsInputSchema},
  output: {schema: AnalyzeWatchPatternsOutputSchema},
  prompt: `You are an expert in movie recommendation systems. Analyze the user's viewing history, current mood, and time of day.
  Based on this analysis, provide:
  1. An explanation of your reasoning (string, optional).
  2. Suggested 'moodWeight': a NUMBER between 0 and 100 representing the percentage influence of mood. (optional)
  3. Suggested 'historyWeight': a NUMBER between 0 and 100 representing the percentage influence of viewing history. (optional)
  4. A suggested 'contentMix': an object where keys are genre strings and values are NUMBERS between 0 and 1, representing proportions (e.g., comedy: 0.6 means 60%). These proportions should ideally sum to 1. (optional)

  Viewing History: {{{viewingHistory}}}
  Current Mood: {{{currentMood}}}
  Current Time: {{{currentTime}}}

  Return a direct JSON object matching the output schema.
  Example of a valid JSON output:
  {
    "explanation": "Given the user's high ratings for recent comedies and their current 'Happy' mood, comedy recommendations should be prioritized. Suggesting mood influence at 70% and history at 20%.",
    "moodWeight": 70,
    "historyWeight": 20,
    "contentMix": {
      "comedy": 0.6,
      "action": 0.3,
      "documentary": 0.1
    }
  }

  Another valid example (if some fields are not applicable):
  {
    "explanation": "User has very little history, focus on mood. Suggest mood influence at 80%.",
    "moodWeight": 80
  }

  Ensure the JSON is valid. All weight fields (moodWeight, historyWeight) MUST be NUMBERS between 0 and 100.
  The values in contentMix (e.g., 0.6 for comedy) MUST be NUMBERS between 0 and 1.
  `,
});

const analyzeWatchPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeWatchPatternsFlow',
    inputSchema: AnalyzeWatchPatternsInputSchema,
    outputSchema: AnalyzeWatchPatternsOutputSchema,
  },
  async input => {
    const {output} = await analyzeWatchPatternsPrompt(input);
    if (!output) {
      console.error('AI returned nullish output for watch pattern analysis.');
      // Consider throwing an error or returning a default/error structure
      // that matches AnalyzeWatchPatternsOutputSchema if critical fields are missing.
      // For now, we rely on Zod to catch issues if output is partially formed but present.
      // If output itself is null/undefined, Zod won't run.
      throw new Error('AI returned no output for watch pattern analysis.');
    }
    return output; // Zod will validate this output based on AnalyzeWatchPatternsOutputSchema
  }
);
