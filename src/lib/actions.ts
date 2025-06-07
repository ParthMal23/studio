
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

const COMMON_RECOMMENDATION_REASON_PREFIX = "Common Pick:";
const userDisplayNames: Record<string, string> = {
  user1: 'Admin',
  user2: 'Parth',
};


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
): Promise<MovieRecommendationItem[] | { error: string; type?: 'common' | 'compromise' | 'combined' }> {
  try {
    const finalRecommendations: MovieRecommendationItem[] = [];
    const processedTitles = new Set<string>();

    const user1DisplayName = userDisplayNames[params.user1Data.userId] || params.user1Data.userId;
    const user2DisplayName = userDisplayNames[params.user2Data.userId] || params.user2Data.userId;

    // 1. Fetch individual recommendations to find common ones
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

    if ('error' in recs1Result) return { error: `Error fetching recommendations for ${user1DisplayName}: ${recs1Result.error}`, type: 'common' };
    if ('error' in recs2Result) return { error: `Error fetching recommendations for ${user2DisplayName}: ${recs2Result.error}`, type: 'common' };

    const recs1 = recs1Result as MovieRecommendationItem[];
    const recs2 = recs2Result as MovieRecommendationItem[];

    const titlesInRecs1 = new Map(recs1.map(rec => [normalizeTitle(rec.title), rec]));

    for (const rec2 of recs2) {
      const normalizedRec2Title = normalizeTitle(rec2.title);
      if (titlesInRecs1.has(normalizedRec2Title)) {
        const rec1Details = titlesInRecs1.get(normalizedRec2Title);
        if (rec1Details && !processedTitles.has(normalizedRec2Title)) {
            finalRecommendations.push({
            ...rec1Details, 
            reason: `${COMMON_RECOMMENDATION_REASON_PREFIX} A great match for both ${user1DisplayName} and ${user2DisplayName}!`,
            });
            processedTitles.add(normalizedRec2Title);
        }
      }
    }
    
    // 2. Fetch compromise recommendations
    const user1HistoryTitles = params.user1Data.viewingHistory.map(h => h.title).slice(0, 10).join(', ') || 'None';
    const user2HistoryTitles = params.user2Data.viewingHistory.map(h => h.title).slice(0, 10).join(', ') || 'None';
    
    const user1ProfileSummary = `${user1DisplayName}: Mood - ${params.user1Data.mood}, Time - ${params.user1Data.timeOfDay}, Key History - ${user1HistoryTitles}.`;
    const user2ProfileSummary = `${user2DisplayName}: Mood - ${params.user2Data.mood}, Time - ${params.user2Data.timeOfDay}, Key History - ${user2HistoryTitles}.`;

    let compromiseContentType: ContentType = "BOTH";
    if (params.user1Data.contentType === params.user2Data.contentType) {
      compromiseContentType = params.user1Data.contentType;
    }

    const compromiseInput: GenerateGroupCompromiseRecommendationsInput = {
      user1ProfileSummary,
      user2ProfileSummary,
      currentTimeOfDay: params.user1Data.timeOfDay, 
      targetContentType: compromiseContentType,
    };

    const compromiseRecsFromAI = await generateGroupCompromiseRecommendations(compromiseInput);

    if (compromiseRecsFromAI && compromiseRecsFromAI.length > 0) {
      const compromiseRecsWithDetails: MovieRecommendationItem[] = await Promise.all(
        compromiseRecsFromAI.map(async (rec) => {
          const tmdbDetails = await fetchContentDetailsFromTmdb(rec.title, compromiseContentType);
          return {
            ...rec, 
            posterUrl: tmdbDetails.posterUrl,
            watchUrl: tmdbDetails.watchUrl,
          };
        })
      );
      
      for (const compromiseRec of compromiseRecsWithDetails) {
        const normalizedCompromiseTitle = normalizeTitle(compromiseRec.title);
        if (!processedTitles.has(normalizedCompromiseTitle)) {
          finalRecommendations.push(compromiseRec);
          processedTitles.add(normalizedCompromiseTitle);
        }
      }
    }
    
    return finalRecommendations;

  } catch (error) {
    console.error("Error fetching group content recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: `Failed to fetch group content recommendations: ${errorMessage}`, type: 'combined' };
  }
}
