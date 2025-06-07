
"use server";

import { generateContentRecommendations, GenerateContentRecommendationsInput } from "@/ai/flows/generate-movie-recommendations";
import { analyzeWatchPatterns, AnalyzeWatchPatternsInput, AnalyzeWatchPatternsOutput } from "@/ai/flows/analyze-watch-patterns";
import { fetchContentDetailsFromTmdb } from "@/services/tmdbService";
import type { ViewingHistoryEntry, ContentType, MovieRecommendationItem } from "./types";

interface FetchContentRecommendationsParams {
  mood: string;
  timeOfDay: string;
  viewingHistory: ViewingHistoryEntry[];
  contentType: ContentType;
}

export async function fetchContentRecommendationsAction(
  params: FetchContentRecommendationsParams
): Promise<MovieRecommendationItem[] | { error: string }> {
  try {
    const viewingHistorySummary = params.viewingHistory.length > 0
      ? `User has watched: ${params.viewingHistory.map(m =>
          `${m.title} (rated ${m.rating}/5, completed: ${m.completed}${m.moodAtWatch ? `, mood when watched: ${m.moodAtWatch}` : ''}${m.timeOfDayAtWatch ? `, time: ${m.timeOfDayAtWatch}` : ''})`
        ).join(', ')}.`
      : "User has no viewing history yet.";

    const input: GenerateContentRecommendationsInput = {
      mood: params.mood,
      timeOfDay: params.timeOfDay,
      viewingHistory: viewingHistorySummary,
      contentType: params.contentType,
    };

    const recommendationsFromAI = await generateContentRecommendations(input);

    if (!recommendationsFromAI) {
      return [];
    }

    const recommendationsWithDetails: MovieRecommendationItem[] = await Promise.all(
      recommendationsFromAI.map(async (rec) => {
        const tmdbDetails = await fetchContentDetailsFromTmdb(rec.title, params.contentType);
        return {
          ...rec,
          posterUrl: tmdbDetails.posterUrl,
          watchUrl: tmdbDetails.watchUrl,
        };
      })
    );

    return recommendationsWithDetails;

  } catch (error) {
    console.error("Error fetching content recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: `Failed to fetch content recommendations: ${errorMessage}` };
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
    // viewingHistory will now include timeOfDayAtWatch if present on entries
    const input: AnalyzeWatchPatternsInput = {
      viewingHistory: JSON.stringify(params.viewingHistory),
      currentMood: params.currentMood,
      currentTime: params.currentTime,
    };
    const analysis = await analyzeWatchPatterns(input);
    return {
      explanation: analysis.explanation || "No explanation provided.",
      moodWeight: analysis.moodWeight === undefined ? 50 : analysis.moodWeight,
      historyWeight: analysis.historyWeight === undefined ? 50 : analysis.historyWeight,
      contentMix: analysis.contentMix || [],
    };
  } catch (error) {
    console.error("Error analyzing watch patterns:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: `Failed to analyze watch patterns: ${errorMessage}` };
  }
}
