
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating compromise content recommendations for a group.
 *
 * - generateGroupCompromiseRecommendations - Generates recommendations if users' initial individual preferences don't overlap.
 * - GenerateGroupCompromiseRecommendationsInput - Input type.
 * - GenerateGroupCompromiseRecommendationsOutput - Output type (reuses ContentRecommendationSchema).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateContentRecommendationsOutput as GenerateGroupCompromiseRecommendationsOutput } from './generate-movie-recommendations'; // Reusing output type

// Re-define ContentRecommendationSchema if not directly importable or to keep flows self-contained in terms of schema definitions for clarity
const ContentRecommendationSchema = z.object({
  title: z.string().describe('The title of the movie or TV series.'),
  description: z.string().describe('A brief description of the movie or TV series.'),
  reason: z
    .string()
    .describe(
      'The reason for recommending this item for the group, considering it as a compromise or based on shared broader tastes. Use the names provided in the profile summaries (e.g., "Admin", "Parth") when referring to users.'
    ),
  platform: z.string().describe('The name of the OTT platform where this content is available (e.g., Netflix, Hulu, Amazon Prime Video).'),
});

const GenerateGroupCompromiseRecommendationsInputSchema = z.object({
  user1ProfileSummary: z
    .string()
    .describe("A summary of the first user's profile including their name, mood, time of day, and key viewing history titles."),
  user2ProfileSummary: z
    .string()
    .describe("A summary of the second user's profile including their name, mood, time of day, and key viewing history titles."),
  currentTimeOfDay: z
    .string()
    .describe('The current time of day (e.g., morning, afternoon, evening, night).'),
  targetContentType: z
    .enum(["MOVIES", "TV_SERIES", "BOTH"])
    .describe('The type of content to recommend (MOVIES, TV_SERIES, or BOTH).'),
});
export type GenerateGroupCompromiseRecommendationsInput = z.infer<typeof GenerateGroupCompromiseRecommendationsInputSchema>;

// Output schema is an array of the reused/redefined ContentRecommendationSchema
const GenerateGroupCompromiseRecommendationsOutputSchema = z.array(ContentRecommendationSchema);


export async function generateGroupCompromiseRecommendations(
  input: GenerateGroupCompromiseRecommendationsInput
): Promise<GenerateGroupCompromiseRecommendationsOutput> {
  return generateGroupCompromiseRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGroupCompromiseRecommendationsPrompt',
  input: {schema: GenerateGroupCompromiseRecommendationsInputSchema},
  output: {schema: GenerateGroupCompromiseRecommendationsOutputSchema},
  prompt: `You are an expert in recommending movies and TV series for groups. Two users did not have any overlapping recommendations based on their individual top preferences, or you are supplementing their common picks.
Your task is to suggest 3-4 {{{targetContentType}}} that could be a good compromise or appeal to shared broader tastes.

First User Profile: {{{user1ProfileSummary}}}
Second User Profile: {{{user2ProfileSummary}}}
Current Time of Day: {{{currentTimeOfDay}}}
Target Content Type: {{{targetContentType}}}

Consider the following when making suggestions:
- Look for common genres or themes that might appeal to both, even if not their absolute top preference.
- If their moods (if mentioned in summaries) are conflicting, aim for content that is generally well-received, critically acclaimed, or a 'safe bet'.
- The time of day might influence the tone (e.g., lighter content for daytime).
- Each recommendation must include a title, description, platform, and a specific 'reason' explaining why it's a good pick for THIS GROUP. Refer to the users by the names provided in their profile summaries (e.g., "Admin", "Parth") or use generic terms like "both users" when appropriate.

Return a JSON array of recommendations. Ensure the entire output is a valid JSON array.
Example of a single item:
{
  "title": "Compromise Choice Movie",
  "description": "A widely acclaimed film that blends genres.",
  "reason": "While Admin enjoys action and Parth prefers drama, this film offers strong storytelling and compelling characters that both might appreciate, suitable for an evening watch.",
  "platform": "HBO Max"
}
`,
});

const generateGroupCompromiseRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateGroupCompromiseRecommendationsFlow',
    inputSchema: GenerateGroupCompromiseRecommendationsInputSchema,
    outputSchema: GenerateGroupCompromiseRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output || [];
  }
);

// Make the output type available for the action
export type { GenerateGroupCompromiseRecommendationsOutput };
