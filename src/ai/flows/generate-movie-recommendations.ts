
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
    .describe('A summary of the user historical viewing data. This may include titles, ratings, completion status, and the mood the user was in when they watched the item (moodAtWatch).'),
  contentType: z
    .enum(["MOVIES", "TV_SERIES", "BOTH"])
    .describe('The type of content to recommend (MOVIES, TV_SERIES, or BOTH).'),
});
export type GenerateContentRecommendationsInput = z.infer<
  typeof GenerateContentRecommendationsInputSchema
>;

// Schema is defined locally, not exported
const ContentRecommendationSchema = z.object({
  title: z.string().describe('The title of the movie or TV series.'),
  description: z.string().describe('A brief description of the movie or TV series.'),
  reason: z
    .string()
    .describe(
      'The reason for recommending this item based on the user\'s mood, time of day, viewing history (including mood at watch), content type preference, or specific query.'
    ),
  platform: z.string().describe('The name of the OTT platform where this content is available (e.g., Netflix, Hulu, Amazon Prime Video).'),
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
  prompt: `You are a recommendation expert for movies and TV series. Generate a list of personalized {{{contentType}}} recommendations.

Base your recommendations on:
1. The user's current mood: {{{mood}}}
2. The current time of day: {{{timeOfDay}}}
3. Their viewing history: {{{viewingHistory}}}
   - Pay attention to the 'moodAtWatch' if provided for specific items in the viewing history. This indicates the user's mood when they watched that item.
   - For example, if a user watched action movies when their moodAtWatch was 'Excited', and their current mood is 'Excited', you might suggest similar action movies.
4. Their preferred content type: {{{contentType}}}

If '{{{contentType}}}' is 'MOVIES', recommend only movies.
If '{{{contentType}}}' is 'TV_SERIES', recommend only TV series.
If '{{{contentType}}}' is 'BOTH', recommend a mix of movies and TV series.

Provide the recommendations with their title, a brief description, the reason for the suggestion (incorporating moodAtWatch insights if relevant), and the OTT platform it's available on (e.g., Netflix, Amazon Prime, Hulu).
Each recommendation must adhere to the following structure:
- title: The title of the movie or TV series (string).
- description: A brief description (string).
- reason: The reason for recommending this (string).
- platform: The name of the OTT platform (string).

Return a JSON array of 6 recommendations. Ensure the entire output is a valid JSON array.
Example of a single item:
{
  "title": "Example Movie",
  "description": "An exciting adventure.",
  "reason": "Matches your adventurous mood and you enjoyed similar action films when you were feeling adventurous.",
  "platform": "Netflix"
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
    return output || [];
  }
);

// Export the output type for use in other actions/flows if needed.
// The schema itself is not exported from this 'use server' file.
export type { ContentRecommendationSchema as GenRecContentRecSchema };
