
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
  posterUrl?: string; // Added for TMDB poster
}

export interface WatchPatternAnalysis {
  explanation: string;
  moodWeight: number; // Percentage 0-100. Default to 50 if not applicable.
  historyWeight: number; // Percentage 0-100. Default to 50 if not applicable.
  contentMix: Array<{ genre: string; proportion: number }>; // e.g., [{ genre: "comedy", proportion: 0.6 }]. Empty array if not applicable.
}
