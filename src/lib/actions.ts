
"use server";

import { generateContentRecommendations, GenerateContentRecommendationsInput, GenerateContentRecommendationsOutput } from "@/ai/flows/generate-movie-recommendations";
import { analyzeWatchPatterns, AnalyzeWatchPatternsInput, AnalyzeWatchPatternsOutput } from "@/ai/flows/analyze-watch-patterns";
import type { UserWeights, ViewingHistoryEntry, ContentType, WatchPatternAnalysis } from "./types";

interface FetchContentRecommendationsParams {
  mood: string;
  timeOfDay: string;
  viewingHistory: ViewingHistoryEntry[];
  userWeights: UserWeights;
  contentType: ContentType;
}

export async function fetchContentRecommendationsAction(
  params: FetchContentRecommendationsParams
): Promise<GenerateContentRecommendationsOutput | { error: string }> {
  try {
    const viewingHistorySummary = params.viewingHistory.length > 0
      ? `User has watched: ${params.viewingHistory.map(m => `${m.title} (rated ${m.rating}/5, completed: ${m.completed})`).join(', ')}.`
      : "User has no viewing history yet.";

    const input: GenerateContentRecommendationsInput = {
      mood: params.mood,
      timeOfDay: params.timeOfDay,
      viewingHistory: viewingHistorySummary,
      contentType: params.contentType,
      // Pass userWeights if the AI model is to be made aware of them.
      // For now, userWeights are primarily a client-side concept guiding the prompt or future logic.
      // userPreferenceWeights: JSON.stringify(params.userWeights),
    };
    const recommendations = await generateContentRecommendations(input);
    return recommendations;
  } catch (error) {
    console.error("Error fetching content recommendations:", error);
    return { error: "Failed to fetch content recommendations. Please try again." };
  }
}

interface AnalyzeWatchPatternsParams {
  viewingHistory: ViewingHistoryEntry[];
  currentMood: string;
  currentTime: string;
}

export async function analyzeWatchPatternsAction(
  params: AnalyzeWatchPatternsParams
): Promise<AnalyzeWatchPatternsOutput | { error: string }> { // Changed return type to AnalyzeWatchPatternsOutput
  try {
    const input: AnalyzeWatchPatternsInput = {
      viewingHistory: JSON.stringify(params.viewingHistory),
      currentMood: params.currentMood,
      currentTime: params.currentTime,
    };
    // The analyzeWatchPatterns flow now directly returns the structured object
    const analysis = await analyzeWatchPatterns(input);
    return analysis;
  } catch (error) {
    console.error("Error analyzing watch patterns:", error);
    return { error: "Failed to analyze watch patterns. Please try again." };
  }
}
