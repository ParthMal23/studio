
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
  explanation: z.string().describe("An explanation of the analysis and suggestions. This field is mandatory."),
  moodWeight: z.number().min(0).max(100).optional()
    .describe("The suggested influence of mood on recommendations, as a percentage (a NUMBER between 0 and 100). Example: 70 for 70%."),
  historyWeight: z.number().min(0).max(100).optional()
    .describe("The suggested influence of viewing history on recommendations, as a percentage (a NUMBER between 0 and 100). Example: 20 for 20%."),
  contentMix: z.record(
      z.string(), // Keys are strings (genres)
      z.number().min(0).max(1) // Values are numbers between 0 and 1
    )
  .describe("A suggested mix of content genres/types, where keys are genre strings and values are NUMBERS between 0 and 1 (e.g., comedy: 0.6, drama: 0.4), ideally summing to 1. If no specific content mix is applicable, return an empty object {}.")
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
  1. 'explanation': An explanation of your reasoning (string, MANDATORY). If other fields are not applicable, explain why.
  2. 'moodWeight': Suggested influence of mood as a NUMBER between 0 and 100 (percentage, optional).
  3. 'historyWeight': Suggested influence of viewing history as a NUMBER between 0 and 100 (percentage, optional).
  4. 'contentMix': A suggested mix of content genres as an object where keys are genre strings and values are NUMBERS between 0 and 1 (proportions, e.g., comedy: 0.6, drama: 0.4), ideally summing to 1. If no specific content mix is applicable, return an empty object {} for this field. This field is MANDATORY (even if empty).

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

  Another valid example (if some fields are not applicable by the AI):
  {
    "explanation": "User has very little history, so focus on mood. No specific content mix can be derived yet.",
    "moodWeight": 80,
    "contentMix": {}
  }
  
  A minimal valid example:
  {
    "explanation": "Insufficient data to provide detailed suggestions.",
    "contentMix": {}
  }

  Ensure the JSON is valid. The 'explanation' and 'contentMix' (even if empty as {}) fields MUST be present.
  All weight fields (moodWeight, historyWeight) when present MUST be NUMBERS between 0 and 100.
  The values in contentMix (e.g., 0.6 for comedy) when present MUST be NUMBERS between 0 and 1.
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
      // This case should ideally be caught by Zod if the output doesn't match the schema (e.g. missing mandatory 'explanation' or 'contentMix').
      // However, if the AI returns absolutely nothing, this check is useful.
      throw new Error('AI returned no output for watch pattern analysis. Explanation and contentMix fields are mandatory.');
    }
    // Zod will validate that 'explanation' and 'contentMix' are present and other fields match their types.
    return output;
  }
);

