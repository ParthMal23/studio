
export type Mood = "Happy" | "Sad" | "Relaxed" | "Excited" | "Calm" | "Adventurous" | "Neutral";

export type TimeOfDay = "Morning" | "Afternoon" | "Evening" | "Night";

export type ContentType = "MOVIES" | "TV_SERIES" | "BOTH";

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
}

export interface MovieRecommendationItem { // Name kept for broader compatibility, but applies to TV series too
  title: string;
  description: string;
  reason: string;
  platform: string; // e.g., "Netflix", "Hulu"
  platformUrl?: string; // Optional direct URL to the content
}

export interface WatchPatternAnalysis {
  moodWeight?: number;
  historyWeight?: number;
  contentMix?: Record<string, number>;
  explanation?: string;
}
