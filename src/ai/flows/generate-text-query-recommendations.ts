
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating content recommendations based on a user's text query,
 * personalized with their mood, time of day, viewing history, and content type preference.
 *
 * - generateTextQueryRecommendations - Generates recommendations based on a free-text user query and context.
 * - GenerateTextQueryRecommendationsInput - Input type.
 * - GenerateTextQueryRecommendationsOutput - Output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// Reusing the output type from existing recommendation flow
import type { GenerateContentRecommendationsOutput as GenerateTextQueryRecommendationsOutput } from './generate-movie-recommendations';

// Define ContentRecommendationSchema locally as it cannot be imported from a 'use server' file.
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


const GenerateTextQueryRecommendationsInputSchema = z.object({
  userQuery: z.string().describe('The user\'s free-text search query for a movie or TV show (e.g., "a movie about a friendly robot" or "historical drama series").'),
  mood: z
    .string()
    .describe('The current mood of the user (e.g., happy, sad, relaxed).'),
  timeOfDay: z
    .string()
    .describe('The current time of day (e.g., morning, afternoon, evening, night).'),
  viewingHistory: z
    .string()
    .describe('A summary of the user\'s historical viewing data. This may include titles, ratings, completion status, and mood at watch.'),
  contentType: z
    .enum(["MOVIES", "TV_SERIES", "BOTH"])
    .describe('The type of content to recommend (MOVIES, TV_SERIES, or BOTH).'),
});
export type GenerateTextQueryRecommendationsInput = z.infer<
  typeof GenerateTextQueryRecommendationsInputSchema
>;

// Output schema is an array of ContentRecommendationSchema
const GenerateTextQueryRecommendationsOutputSchema = z.array(
  ContentRecommendationSchema
);

export async function generateTextQueryRecommendations(
  input: GenerateTextQueryRecommendationsInput
): Promise<GenerateTextQueryRecommendationsOutput> {
  return generateTextQueryRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTextQueryRecommendationsPrompt',
  input: {schema: GenerateTextQueryRecommendationsInputSchema},
  output: {schema: GenerateTextQueryRecommendationsOutputSchema},
  prompt: `You are an expert movie and TV series recommender. The user has provided a specific text query for what they want to watch.
Additionally, consider their current mood, the time of day, their viewing history, and their preferred content type to refine and personalize these recommendations.

User's Search Query: "{{{userQuery}}}"

Contextual Information:
- Current Mood: {{{mood}}}
- Time of Day: {{{timeOfDay}}}
- Viewing History: {{{viewingHistory}}}
- Preferred Content Type: {{{contentType}}}

Instructions:
1. Primarily focus on fulfilling the user's text query: "{{{userQuery}}}".
2. Use the contextual information (mood, time, history, content type) to select the most suitable options if multiple items match the query, or to tailor the suggestions. For example, if the query is "funny movie" and mood is "Happy", lean towards upbeat comedies. If history shows enjoyment of animated films, and query is "adventure", animated adventures might be good.
3. If '{{{contentType}}}' is 'MOVIES', recommend only movies.
4. If '{{{contentType}}}' is 'TV_SERIES', recommend only TV series.
5. If '{{{contentType}}}' is 'BOTH', recommend a mix of movies and TV series that match the query.
6. For each recommendation, provide:
    - title: The title of the movie or TV series (string).
    - description: A brief description (string).
    - reason: Explain WHY this item is a good match for the user's query AND how the contextual information (mood, time, history) influenced the choice, if applicable (string).
    - platform: The name of the OTT platform (string).

Return a JSON array of 3-5 recommendations. Ensure the entire output is a valid JSON array.
Example of a single item if user query was "movie about a mouse", mood "Happy", time "Evening":
{
  "title": "Stuart Little",
  "description": "A charming movie about a mouse adopted by a human family.",
  "reason": "Matches your query for a 'movie about a mouse'. It's a lighthearted and happy film, perfect for a family evening, which aligns with your current mood.",
  "platform": "Netflix"
}
`,
});

const generateTextQueryRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateTextQueryRecommendationsFlow',
    inputSchema: GenerateTextQueryRecommendationsInputSchema,
    outputSchema: GenerateTextQueryRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output || [];
  }
);

// Export output type for the action
export type { GenerateTextQueryRecommendationsOutput };
