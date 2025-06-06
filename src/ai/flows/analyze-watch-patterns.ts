
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
  moodWeight: z.preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number().optional()
    ).describe("The suggested influence of mood on recommendations, as a numeric factor (e.g., 1.2 for 20% increase, 0.8 for 20% decrease). This must be a number."),
  historyWeight: z.preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val) : val),
      z.number().optional()
    ).describe("The suggested influence of viewing history on recommendations, as a numeric factor. This must be a number."),
  contentMix: z.preprocess(
    (val) => {
      if (typeof val === 'object' && val !== null) {
        const newObj: Record<string, any> = {};
        for (const key in val) {
          // @ts-ignore
          newObj[key] = typeof val[key] === 'string' ? parseFloat(val[key]) : val[key];
        }
        return newObj;
      }
      return val;
    },
    z.record(
      z.string(), // Keys are strings (genres)
      z.number().min(0).max(1) // Values are numbers between 0 and 1
    ).optional()
  ).describe("A suggested mix of content genres/types, where values are numeric proportions (e.g., comedy: 0.6, drama: 0.4), summing to 1. All values must be numbers.")
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
  2. Suggested numeric factors for how 'mood' (moodWeight) and 'viewing history' (historyWeight) could influence recommendations. These must be NUMBERS (e.g., 1.1, 0.9). (optional)
  3. A suggested content mix (contentMix) (e.g., by genre or type like movies/series), where keys are genre strings and values are NUMBERS between 0 and 1, summing to 1. (optional)

  Viewing History: {{{viewingHistory}}}
  Current Mood: {{{currentMood}}}
  Current Time: {{{currentTime}}}

  Return a direct JSON object matching the output schema.
  Example of a valid JSON output:
  {
    "explanation": "Given the user's high ratings for recent comedies and their current 'Happy' mood, comedy recommendations should be prioritized. Consider increasing mood influence.",
    "moodWeight": 1.15,
    "historyWeight": 1.05,
    "contentMix": {
      "comedy": 0.7,
      "action": 0.2,
      "documentary": 0.1
    }
  }

  Another valid example (if some fields are not applicable):
  {
    "explanation": "User has very little history, focus on mood.",
    "moodWeight": 1.2
  }

  Ensure the JSON is valid and all fields adhere to their descriptions in the output schema.
  Values for moodWeight, historyWeight, and within contentMix MUST be numbers, not strings.
  The values in contentMix must be NUMBERS between 0 and 1, and their sum should ideally be 1.
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
      // This case should ideally be caught by Zod if the output schema doesn't allow undefined/null,
      // but as an extra safeguard:
      console.error('AI returned nullish output for watch pattern analysis.');
      throw new Error('AI returned no output for watch pattern analysis.');
    }
    // The output is already validated by Zod through the definePrompt configuration.
    return output;
  }
);

