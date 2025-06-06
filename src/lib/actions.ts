"use server";

import { generateMovieRecommendations, GenerateMovieRecommendationsInput, GenerateMovieRecommendationsOutput } from "@/ai/flows/generate-movie-recommendations";
import { analyzeWatchPatterns, AnalyzeWatchPatternsInput, AnalyzeWatchPatternsOutput } from "@/ai/flows/analyze-watch-patterns";
import type { UserWeights, ViewingHistoryEntry } from "./types";

interface FetchMovieRecommendationsParams {
  mood: string;
  timeOfDay: string;
  viewingHistory: ViewingHistoryEntry[];
  userWeights: UserWeights; // Though not directly used by current AI flow, pass it for potential future use or logging
}

export async function fetchMovieRecommendationsAction(
  params: FetchMovieRecommendationsParams
): Promise<GenerateMovieRecommendationsOutput | { error: string }> {
  try {
    const viewingHistorySummary = params.viewingHistory.length > 0
      ? `User has watched: ${params.viewingHistory.map(m => `${m.title} (rated ${m.rating}/5)`).join(', ')}.`
      : "User has no viewing history yet.";

    // Potentially incorporate userWeights into the prompt if the AI flow were designed for it.
    // For now, the prompt in generate-movie-recommendations.ts handles the balancing.
    // Example: Add a sentence like: "The user prioritizes these factors as follows: Mood (${params.userWeights.mood}%), Time (${params.userWeights.time}%), History (${params.userWeights.history}%)."
    // This would require modifying the AI flow's prompt.

    const input: GenerateMovieRecommendationsInput = {
      mood: params.mood,
      timeOfDay: params.timeOfDay,
      viewingHistory: viewingHistorySummary,
    };
    const recommendations = await generateMovieRecommendations(input);
    return recommendations;
  } catch (error) {
    console.error("Error fetching movie recommendations:", error);
    return { error: "Failed to fetch movie recommendations. Please try again." };
  }
}

interface AnalyzeWatchPatternsParams {
  viewingHistory: ViewingHistoryEntry[];
  currentMood: string;
  currentTime: string;
}

export async function analyzeWatchPatternsAction(
  params: AnalyzeWatchPatternsParams
): Promise<AnalyzeWatchPatternsOutput | { error: string }> {
  try {
    const input: AnalyzeWatchPatternsInput = {
      viewingHistory: JSON.stringify(params.viewingHistory),
      currentMood: params.currentMood,
      currentTime: params.currentTime,
    };
    const analysis = await analyzeWatchPatterns(input);
    return analysis;
  } catch (error) {
    console.error("Error analyzing watch patterns:", error);
    return { error: "Failed to analyze watch patterns. Please try again." };
  }
}
