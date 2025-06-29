
export type Mood = "Happy" | "Sad" | "Goofy" | "Excited" | "Relaxed" | "Adventurous" | "Romantic" | "Neutral";

export type TimeOfDay = "Morning" | "Afternoon" | "Evening" | "Night";

export type ContentType = "MOVIES" | "TV_SERIES" | "BOTH";

export const LANGUAGES = ["Any", "English", "Spanish", "French", "German", "Italian", "Hindi", "Japanese", "Korean"] as const;
export type Language = typeof LANGUAGES[number];

export interface UserWeights {
  mood: number; // 0-100
  time: number; // 0-100
  history: number; // 0-100
}

export interface ViewingHistoryEntry {
  id: string;
  title: string;
  rating: number; // 1-5
  completed: boolean;
  moodAtWatch?: Mood;
  timeOfDayAtWatch?: TimeOfDay;
  languageAtWatch?: string;
}

export interface MovieRecommendationItem {
  title: string;
  description: string;
  reason: string;
  platform: string;
  posterUrl?: string;
  watchUrl?: string; // Link to TMDB watch page or similar
}

export interface WatchPatternAnalysis {
  explanation: string;
  moodWeight: number; // Percentage 0-100.
  historyWeight: number; // Percentage 0-100.
  contentMix: Array<{ genre: string; proportion: number }>; // e.g., [{
}

// For Group Recommendations
export interface UserProfileDataForGroupRecs {
  userId: string;
  mood: Mood;
  timeOfDay: TimeOfDay;
  viewingHistory: ViewingHistoryEntry[];
  userWeights: UserWeights;
  contentType: ContentType;
  language: Language;
}

export interface FetchGroupRecommendationsParams {
  user1Data: UserProfileDataForGroupRecs;
  user2Data: UserProfileDataForGroupRecs;
}

export interface UserPreferences {
    mood: Mood;
    contentType: ContentType;
    userWeights: UserWeights;
    language: Language;
}
