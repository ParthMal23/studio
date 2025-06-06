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
  platformUrl: z.string().url().optional().describe('A direct URL to watch the content on the specified platform. If unknown or not applicable, this can be omitted.'),
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

Provide the recommendations with their title, a brief description, the reason for the suggestion, the OTT platform it's available on (e.g., Netflix, Amazon Prime, Hulu), and a direct URL to the content on that platform if available.
Each recommendation should have the following information:
- title: The title of the movie or TV series.
- description: A brief description.
- reason: The reason for recommending this.
- platform: The name of the OTT platform.
- platformUrl: The direct URL to the content on the platform. If a direct URL is not easily found, provide a search URL on that platform for the title, or omit if not feasible.

Return a JSON array of recommendations.`,
});

const generateContentRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateContentRecommendationsFlow',
    inputSchema: GenerateContentRecommendationsInputSchema,
    outputSchema: GenerateContentRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
