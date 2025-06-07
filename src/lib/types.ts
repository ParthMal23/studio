
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
  moodAtWatch?: Mood; // Added mood at time of watching
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
  contentMix: Array<{ genre: string; proportion: number }>; // e.g., [{ genre: "comedy", proportion: 0.6 }]. Empty array if not applicable.
}

