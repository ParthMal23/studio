
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating personalized content recommendations (movies or TV series).
 *
 * - generateContentRecommendations - A function that generates recommendations based on user mood, time of day, viewing history, and content type preference.
 * - GenerateContentRecommendationsInput - The input type for the generateContentRecommendations function.
 * - GenerateContentRecommendationsOutput - The output type for the generateContentRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateContentRecommendationsInputSchema = z.object({
  mood: z
    .string()
    .describe('The current mood of the user (e.g., happy, sad, relaxed).'),
  timeOfDay: z
    .string()
    .describe('The current time of day (e.g., morning, afternoon, evening, night).'),
  viewingHistory: z
    .string()
    .describe('A summary of the user historical viewing data.'),
  contentType: z
    .enum(["MOVIES", "TV_SERIES", "BOTH"])
    .describe('The type of content to recommend (MOVIES, TV_SERIES, or BOTH).'),
});
export type GenerateContentRecommendationsInput = z.infer<
  typeof GenerateContentRecommendationsInputSchema
>;

const ContentRecommendationSchema = z.object({
  title: z.string().describe('The title of the movie or TV series.'),
  description: z.string().describe('A brief description of the movie or TV series.'),
  reason: z
    .string()
    .describe(
      'The reason for recommending this item based on the user\'s mood, time of day, viewing history, and content type preference.'
    ),
  platform: z.string().describe('The name of the OTT platform where this content is available (e.g., Netflix, Hulu, Amazon Prime Video).'),
  platformUrl: z.string().url().nullable().optional().describe('A direct URL to watch the content, a valid search URL, or null if not available. The key can be omitted if no URL or null is appropriate. Must be a valid URL if provided and not null. Do NOT use empty strings or placeholder text like "N/A".'),
});

const GenerateContentRecommendationsOutputSchema = z.array(
  ContentRecommendationSchema
);

export type GenerateContentRecommendationsOutput = z.infer<
  typeof GenerateContentRecommendationsOutputSchema
>;

export async function generateContentRecommendations(
  input: GenerateContentRecommendationsInput
): Promise<GenerateContentRecommendationsOutput> {
  return generateContentRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentRecommendationsPrompt',
  input: {schema: GenerateContentRecommendationsInputSchema},
  output: {schema: GenerateContentRecommendationsOutputSchema},
  prompt: `You are a recommendation expert for movies and TV series. Generate a list of personalized {{{contentType}}} recommendations based on the user's current mood, the time of day, and their viewing history.

If '{{{contentType}}}' is 'MOVIES', recommend only movies.
If '{{{contentType}}}' is 'TV_SERIES', recommend only TV series.
If '{{{contentType}}}' is 'BOTH', recommend a mix of movies and TV series.

Consider the following information:
Mood: {{{mood}}}
Time of day: {{{timeOfDay}}}
Viewing history: {{{viewingHistory}}}
Preferred content type: {{{contentType}}}

Provide the recommendations with their title, a brief description, the reason for the suggestion, and the OTT platform it's available on (e.g., Netflix, Amazon Prime, Hulu).
Each recommendation must adhere to the following structure:
- title: The title of the movie or TV series (string).
- description: A brief description (string).
- reason: The reason for recommending this (string).
- platform: The name of the OTT platform (string).
- platformUrl: Provide a direct URL to watch the content on the specified platform. If a direct URL is not easily found, you MAY provide a valid search URL on that platform for the title. If neither a direct URL nor a valid search URL is available or feasible, you MUST either set the value of platformUrl to null OR omit the platformUrl key entirely for that recommendation. It must be a valid URL if provided and not null. Do NOT use an empty string "" or placeholder text like 'N/A' for platformUrl.

Return a JSON array of recommendations. Ensure the entire output is a valid JSON array.
Example of a single item (if platformUrl is available):
{
  "title": "Example Movie",
  "description": "An exciting adventure.",
  "reason": "Matches your adventurous mood.",
  "platform": "Netflix",
  "platformUrl": "https://www.netflix.com/title/12345"
}
Example of a single item (if platformUrl is not available or not applicable):
{
  "title": "Another Example Show",
  "description": "A thoughtful drama.",
  "reason": "Good for a calm evening.",
  "platform": "Hulu"
  // platformUrl key is omitted OR "platformUrl": null
}
`,
});

const generateContentRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateContentRecommendationsFlow',
    inputSchema: GenerateContentRecommendationsInputSchema,
    outputSchema: GenerateContentRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // Handle cases where the AI might return an empty/nullish output
      // that isn't caught by Zod schema validation but is undesirable.
      console.error('AI returned nullish output for recommendations');
      throw new Error('AI failed to provide recommendations.');
    }
    return output;
  }
);

