'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating personalized movie recommendations.
 *
 * - generateMovieRecommendations - A function that generates movie recommendations based on user mood, time of day, and viewing history.
 * - GenerateMovieRecommendationsInput - The input type for the generateMovieRecommendations function.
 * - GenerateMovieRecommendationsOutput - The output type for the generateMovieRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMovieRecommendationsInputSchema = z.object({
  mood: z
    .string()
    .describe('The current mood of the user (e.g., happy, sad, relaxed).'),
  timeOfDay: z
    .string()
    .describe('The current time of day (e.g., morning, afternoon, evening, night).'),
  viewingHistory: z
    .string()
    .describe('A summary of the user historical viewing data.'),
});
export type GenerateMovieRecommendationsInput = z.infer<
  typeof GenerateMovieRecommendationsInputSchema
>;

const MovieRecommendationSchema = z.object({
  title: z.string().describe('The title of the movie.'),
  description: z.string().describe('A brief description of the movie.'),
  reason: z
    .string()
    .describe(
      'The reason for recommending this movie based on the user\'s mood, time of day, and viewing history.'
    ),
});

const GenerateMovieRecommendationsOutputSchema = z.array(
  MovieRecommendationSchema
);

export type GenerateMovieRecommendationsOutput = z.infer<
  typeof GenerateMovieRecommendationsOutputSchema
>;

export async function generateMovieRecommendations(
  input: GenerateMovieRecommendationsInput
): Promise<GenerateMovieRecommendationsOutput> {
  return generateMovieRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMovieRecommendationsPrompt',
  input: {schema: GenerateMovieRecommendationsInputSchema},
  output: {schema: GenerateMovieRecommendationsOutputSchema},
  prompt: `You are a movie recommendation expert. Generate a list of personalized movie recommendations based on the user's current mood, the time of day, and their viewing history.

  Consider the following information:
  Mood: {{{mood}}}
  Time of day: {{{timeOfDay}}}
  Viewing history: {{{viewingHistory}}}

  Provide the movie recommendations with their title, a brief description, and a reason for the suggestion based on the user's current state (mood, time) and past history.
  Each recommendation should have the following information:
  - title: The title of the movie.
  - description: A brief description of the movie.
  - reason: The reason for recommending this movie based on the user's mood, time of day, and viewing history.

  Return a JSON array of movie recommendations.`,
});

const generateMovieRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateMovieRecommendationsFlow',
    inputSchema: GenerateMovieRecommendationsInputSchema,
    outputSchema: GenerateMovieRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
