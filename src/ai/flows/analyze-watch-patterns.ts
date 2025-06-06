
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
  moodWeight: z.number().min(0).max(100).optional().describe("The suggested influence of mood on recommendations, as an absolute percentage (0-100)."),
  historyWeight: z.number().min(0).max(100).optional().describe("The suggested influence of viewing history on recommendations, as an absolute percentage (0-100)."),
  contentMix: z.record(z.number().min(0).max(1)).optional().describe("A suggested mix of content genres/types, where values are proportions (e.g., comedy: 0.6, drama: 0.4), summing to 1.")
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
  1. An explanation of your reasoning.
  2. Suggested absolute percentage weights (0-100) for how much 'mood' and 'viewing history' should influence recommendations.
  3. A suggested content mix (e.g., by genre or type like movies/series), where proportions sum to 1.

  Viewing History: {{{viewingHistory}}}
  Current Mood: {{{currentMood}}}
  Current Time: {{{currentTime}}}

  Return a direct JSON object matching the output schema.
  Example:
  {
    "explanation": "Given the user's high ratings for recent comedies and their current 'Happy' mood, comedy recommendations should be prioritized. History shows a strong preference for movies over TV series.",
    "moodWeight": 75,
    "historyWeight": 60,
    "contentMix": {
      "comedy": 0.7,
      "action": 0.2,
      "documentary": 0.1
    }
  }

  Ensure the JSON is valid and all fields adhere to their descriptions in the output schema. The moodWeight and historyWeight must be between 0 and 100.
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
      throw new Error('AI returned nullish output for watch pattern analysis.');
    }
    return output;
  }
);
