
'use server';

/**
 * @fileOverview AI flow to analyze user watch patterns and refine movie recommendations.
 * Viewing history entries may include 'moodAtWatch' indicating user's mood during viewing.
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
    .describe('A JSON string representing the user viewing history. Each entry includes movie selections, ratings, completions, and potentially `moodAtWatch` (user\'s mood when watching).'),
  currentMood: z.string().describe('The user\'s current mood.'),
  currentTime: z.string().describe('The current time of day (morning, afternoon, evening, night).'),
});
export type AnalyzeWatchPatternsInput = z.infer<typeof AnalyzeWatchPatternsInputSchema>;

const ContentMixItemSchema = z.object({
  genre: z.string().describe("The genre of content (e.g., 'comedy', 'drama')."),
  proportion: z.number().min(0).max(1).describe("The suggested proportion for this genre, as a NUMBER between 0 and 1 (e.g., 0.6 for 60%).")
});

const AnalyzeWatchPatternsOutputSchema = z.object({
  explanation: z.string().describe("An explanation of the analysis and suggestions. This field is mandatory."),
  moodWeight: z.number().min(0).max(100)
    .describe("The suggested influence of mood on recommendations, as a NUMBER between 0 and 100 (percentage). If no specific suggestion, use 50. This field is mandatory."),
  historyWeight: z.number().min(0).max(100)
    .describe("The suggested influence of viewing history on recommendations, as a NUMBER between 0 and 100 (percentage). If no specific suggestion, use 50. This field is mandatory."),
  contentMix: z.array(ContentMixItemSchema)
    .describe("A suggested mix of content genres as an ARRAY of objects. Each object must have a 'genre' (string) and 'proportion' (NUMBER between 0 and 1). If no specific content mix is applicable, return an empty array []. This field is mandatory.")
});
export type AnalyzeWatchPatternsOutput = z.infer<typeof AnalyzeWatchPatternsOutputSchema>;

export async function analyzeWatchPatterns(input: AnalyzeWatchPatternsInput): Promise<AnalyzeWatchPatternsOutput> {
  return analyzeWatchPatternsFlow(input);
}

const analyzeWatchPatternsPrompt = ai.definePrompt({
  name: 'analyzeWatchPatternsPrompt',
  input: {schema: AnalyzeWatchPatternsInputSchema},
  output: {schema: AnalyzeWatchPatternsOutputSchema},
  prompt: `You are an expert in movie recommendation systems. Analyze the user's viewing history, their current mood, and the time of day.
  The viewing history entries are provided as a JSON string and may include a 'moodAtWatch' field, indicating the user's mood when they watched that specific item.
  Use this 'moodAtWatch' information to understand patterns like "user watches comedies when happy" or "user watches documentaries when calm."

  Based on this comprehensive analysis, you MUST provide a direct JSON object with the following fields:
  1. 'explanation': An explanation of your reasoning, considering moodAtWatch if present (string, MANDATORY).
  2. 'moodWeight': Suggested influence of the user's CURRENT mood on recommendations, as a NUMBER between 0 and 100 (percentage, MANDATORY). If you don't have a specific suggestion, use 50 as a default.
  3. 'historyWeight': Suggested influence of viewing history (including patterns derived from moodAtWatch) on recommendations, as a NUMBER between 0 and 100 (percentage, MANDATORY). If you don't have a specific suggestion, use 50 as a default.
  4. 'contentMix': A suggested mix of content genres as an ARRAY of objects. Each object in the array must have a 'genre' (string) and a 'proportion' (NUMBER between 0 and 1, e.g., 0.6 for 60%). The proportions should ideally sum to 1. If no specific content mix is applicable, return an empty array [] for this field. This field is MANDATORY.

  Viewing History (JSON string, may include 'moodAtWatch' per item): {{{viewingHistory}}}
  Current Mood: {{{currentMood}}}
  Current Time: {{{currentTime}}}

  Return a direct JSON object matching the output schema. All fields ('explanation', 'moodWeight', 'historyWeight', 'contentMix') are mandatory.

  Example of a valid JSON output with specific suggestions considering 'moodAtWatch':
  {
    "explanation": "User often watches action movies when 'Excited' (based on moodAtWatch in history) and their current mood is 'Excited'. Prioritizing action. Suggesting mood influence at 70% and history at 30%.",
    "moodWeight": 70,
    "historyWeight": 30,
    "contentMix": [
      {"genre": "action", "proportion": 0.7},
      {"genre": "thriller", "proportion": 0.2},
      {"genre": "sci-fi", "proportion": 0.1}
    ]
  }

  Example of a valid JSON output with default weights and no specific content mix:
  {
    "explanation": "User has limited history or unclear patterns even with moodAtWatch. Using default weights. No specific content mix can be derived yet.",
    "moodWeight": 50,
    "historyWeight": 50,
    "contentMix": []
  }

  Ensure the JSON is valid and all specified fields are present with the correct numeric types and array structure for contentMix.
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
      throw new Error('AI returned no output. All fields (explanation, moodWeight, historyWeight, contentMix) are mandatory.');
    }
    // Ensure all mandatory fields are present, even if Zod didn't throw (though it should)
    if (output.explanation === undefined || output.moodWeight === undefined || output.historyWeight === undefined || output.contentMix === undefined) {
       console.error('AI output missing one or more mandatory fields:', output);
       throw new Error('AI output is missing one or more mandatory fields (explanation, moodWeight, historyWeight, contentMix).');
    }
    return output;
  }
);
