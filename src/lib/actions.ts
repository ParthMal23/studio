
"use server";

import { generateContentRecommendations, GenerateContentRecommendationsInput } from "@/ai/flows/generate-movie-recommendations";
import { analyzeWatchPatterns, AnalyzeWatchPatternsInput, AnalyzeWatchPatternsOutput } from "@/ai/flows/analyze-watch-patterns";
import { generateGroupCompromiseRecommendations, GenerateGroupCompromiseRecommendationsInput, GenerateGroupCompromiseRecommendationsOutput } from "@/ai/flows/generate-group-compromise-recommendations";
import { fetchContentDetailsFromTmdb } from "@/services/tmdbService";
import type { ViewingHistoryEntry, ContentType, MovieRecommendationItem, FetchGroupRecommendationsParams, UserProfileDataForGroupRecs } from "./types";

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

const normalizeTitle = (title: string): string => {
  if (!title) return '';
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
};

export async function fetchGroupRecommendationsAction(
  params: FetchGroupRecommendationsParams
): Promise<MovieRecommendationItem[] | { error: string; type?: 'common' | 'compromise' }> {
  try {
    const recs1Result = await fetchContentRecommendationsAction({
      mood: params.user1Data.mood,
      timeOfDay: params.user1Data.timeOfDay,
      viewingHistory: params.user1Data.viewingHistory,
      contentType: params.user1Data.contentType,
    });

    const recs2Result = await fetchContentRecommendationsAction({
      mood: params.user2Data.mood,
      timeOfDay: params.user2Data.timeOfDay,
      viewingHistory: params.user2Data.viewingHistory,
      contentType: params.user2Data.contentType,
    });

    if ('error' in recs1Result) return { error: `Error fetching recommendations for User 1: ${recs1Result.error}`, type: 'common' };
    if ('error' in recs2Result) return { error: `Error fetching recommendations for User 2: ${recs2Result.error}`, type: 'common' };

    const recs1 = recs1Result as MovieRecommendationItem[];
    const recs2 = recs2Result as MovieRecommendationItem[];

    const commonRecommendations: MovieRecommendationItem[] = [];
    const titlesInRecs1 = new Set(recs1.map(rec => normalizeTitle(rec.title)));

    for (const rec of recs2) {
      if (titlesInRecs1.has(normalizeTitle(rec.title))) {
        commonRecommendations.push({
          ...rec, // Use details from rec2 as it includes posterUrl etc.
          reason: "This pick appeared in recommendations for both users, making it a great choice to watch together!",
        });
      }
    }
    
    if (commonRecommendations.length > 0) {
      return commonRecommendations;
    }

    // Fallback: No common recommendations, try to generate compromise ones.
    console.log("No common recommendations found, attempting compromise flow.");
    const user1HistoryTitles = params.user1Data.viewingHistory.map(h => h.title).slice(0, 10).join(', ') || 'None';
    const user2HistoryTitles = params.user2Data.viewingHistory.map(h => h.title).slice(0, 10).join(', ') || 'None';
    
    const user1ProfileSummary = `User 1: Mood - ${params.user1Data.mood}, Time - ${params.user1Data.timeOfDay}, Key History - ${user1HistoryTitles}.`;
    const user2ProfileSummary = `User 2: Mood - ${params.user2Data.mood}, Time - ${params.user2Data.timeOfDay}, Key History - ${user2HistoryTitles}.`;

    let compromiseContentType: ContentType = "BOTH";
    if (params.user1Data.contentType === params.user2Data.contentType) {
      compromiseContentType = params.user1Data.contentType;
    }

    const compromiseInput: GenerateGroupCompromiseRecommendationsInput = {
      user1ProfileSummary,
      user2ProfileSummary,
      currentTimeOfDay: params.user1Data.timeOfDay, // Using User 1's time as a reference
      targetContentType: compromiseContentType,
    };

    const compromiseRecsFromAI = await generateGroupCompromiseRecommendations(compromiseInput);

    if (!compromiseRecsFromAI || compromiseRecsFromAI.length === 0) {
      // If compromise also fails or returns nothing, return an empty array (or a specific error if preferred)
      return []; 
    }

    const compromiseRecsWithDetails: MovieRecommendationItem[] = await Promise.all(
      compromiseRecsFromAI.map(async (rec) => {
        const tmdbDetails = await fetchContentDetailsFromTmdb(rec.title, compromiseContentType);
        return {
          ...rec, // AI provides the reason specifically for the group
          posterUrl: tmdbDetails.posterUrl,
          watchUrl: tmdbDetails.watchUrl,
        };
      })
    );
    
    return compromiseRecsWithDetails;

  } catch (error) {
    console.error("Error fetching group content recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: `Failed to fetch group content recommendations: ${errorMessage}`, type: 'compromise' };
  }
}
