
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating "surprise" content recommendations.
 * The goal is to suggest content that is different from the user's viewing history, introducing them to new genres or hidden gems.
 *
 * - generateSurpriseRecommendations - Generates surprising recommendations.
 * - GenerateSurpriseRecommendationsInput - Input type.
 * - GenerateSurpriseRecommendationsOutput - Output type (reuses ContentRecommendationSchema).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// Reusing the output type from existing recommendation flow for consistency
import type { GenerateContentRecommendationsOutput as GenerateSurpriseRecommendationsOutput } from './generate-movie-recommendations';

// Define ContentRecommendationSchema locally as it cannot be imported from a 'use server' file.
const ContentRecommendationSchema = z.object({
  title: z.string().describe('The title of the movie or TV series.'),
  description: z.string().describe('A brief description of the movie or TV series.'),
  reason: z
    .string()
    .describe(
      'The reason for recommending this item, explaining why it\'s a great "surprise" or "hidden gem" that differs from the user\'s usual viewing patterns.'
    ),
  platform: z.string().describe('The name of the OTT platform where this content is available (e.g., Netflix, Hulu, Amazon Prime Video).'),
});

const GenerateSurpriseRecommendationsInputSchema = z.object({
  viewingHistory: z
    .string()
    .describe('A summary of the user\'s historical viewing data. This is used as a baseline to recommend something different.'),
  contentType: z
    .enum(["MOVIES", "TV_SERIES", "BOTH"])
    .describe('The type of content to recommend (MOVIES, TV_SERIES, or BOTH).'),
});
export type GenerateSurpriseRecommendationsInput = z.infer<
  typeof GenerateSurpriseRecommendationsInputSchema
>;

// Output schema is an array of ContentRecommendationSchema
const GenerateSurpriseRecommendationsOutputSchema = z.array(
  ContentRecommendationSchema
);

export async function generateSurpriseRecommendations(
  input: GenerateSurpriseRecommendationsInput
): Promise<GenerateSurpriseRecommendationsOutput> {
  return generateSurpriseRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSurpriseRecommendationsPrompt',
  input: {schema: GenerateSurpriseRecommendationsInputSchema},
  output: {schema: GenerateSurpriseRecommendationsOutputSchema},
  prompt: `You are a film and TV aficionado with eclectic taste, acting as a guide to help users break out of their viewing bubble.
Your task is to generate a list of "surprise" {{{contentType}}} recommendations. These should be hidden gems, critically acclaimed but perhaps overlooked titles, or content from genres the user doesn't typically watch.

**CRITICAL INSTRUCTIONS:**
-   **DO NOT** recommend anything that is obviously similar to the user's viewing history.
-   **AVOID** major blockbusters or the most popular titles unless they are from a genre completely absent in the user's history.
-   **PRIORITIZE** diversity in genre, tone, and origin (e.g., international films/series).
-   The 'reason' for each recommendation MUST explain why it's a good "surprise" pick and how it expands the user's horizons based on their history.

User's Viewing History (to recommend something DIFFERENT from):
{{{viewingHistory}}}

Preferred Content Type: {{{contentType}}}

Return a JSON array of 6 recommendations. Ensure the entire output is a valid JSON array.
Example of a single item:
{
  "title": "A Hidden Gem Movie",
  "description": "A thought-provoking indie drama.",
  "reason": "Your history shows a lot of action comedies. This film is a complete change of pace, offering a powerful story and character study that might reveal a new genre you'll love.",
  "platform": "Mubi"
}
`,
});

const generateSurpriseRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateSurpriseRecommendationsFlow',
    inputSchema: GenerateSurpriseRecommendationsInputSchema,
    outputSchema: GenerateSurpriseRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output || [];
  }
);

// Export output type for the action
export type { GenerateSurpriseRecommendationsOutput };
