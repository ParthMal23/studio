
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
      ? `User has watched: ${params.viewingHistory.map(m => `${m.title} (rated ${m.rating}/5, completed: ${m.completed}${m.moodAtWatch ? `, mood when watched: ${m.moodAtWatch}` : ''})`).join(', ')}.`
      : "User has no viewing history yet.";

    const input: GenerateContentRecommendationsInput = {
      mood: params.mood,
      timeOfDay: params.timeOfDay,
      viewingHistory: viewingHistorySummary,
      contentType: params.contentType,
    };
    const recommendations = await generateContentRecommendations(input);
    return recommendations || [];
  } catch (error) {
    console.error("Error fetching content recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: `Failed to fetch content recommendations: ${errorMessage}` };
  }
}

interface AnalyzeWatchPatternsParams {
  viewingHistory: ViewingHistoryEntry[]; // This will now include moodAtWatch
  currentMood: string;
  currentTime: string;
}

export async function analyzeWatchPatternsAction(
  params: AnalyzeWatchPatternsParams
): Promise<AnalyzeWatchPatternsOutput | { error: string }> {
  try {
    const input: AnalyzeWatchPatternsInput = {
      viewingHistory: JSON.stringify(params.viewingHistory), // viewingHistory objects now include moodAtWatch
      currentMood: params.currentMood,
      currentTime: params.currentTime,
    };
    const analysis = await analyzeWatchPatterns(input);
    return analysis;
  } catch (error) {
    console.error("Error analyzing watch patterns:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: `Failed to analyze watch patterns: ${errorMessage}` };
  }
}
