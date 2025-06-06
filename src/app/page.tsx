"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Mood, TimeOfDay, UserWeights, ViewingHistoryEntry, MovieRecommendationItem, WatchPatternAnalysis } from '@/lib/types';
import { fetchMovieRecommendationsAction } from '@/lib/actions';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { AppHeader } from '@/components/AppHeader';
import { MoodSelector } from '@/components/MoodSelector';
import { TimeSelector } from '@/components/TimeSelector';
import { WeightCustomizer } from '@/components/WeightCustomizer';
import { MovieRecommendations } from '@/components/MovieRecommendations';
import { ViewingHistoryTracker } from '@/components/ViewingHistoryTracker';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2 } from 'lucide-react';

const LS_VIEWING_HISTORY_KEY = 'fireSyncViewingHistory';
const LS_USER_PREFERENCES_KEY = 'fireSyncUserPreferences';

export default function HomePage() {
  const [mood, setMood] = useState<Mood>("Neutral");
  const { currentTimeOfDay: detectedTime, setCurrentTimeOfDay: setSelectedTimeManually } = useTimeOfDay();
  const [selectedTime, setSelectedTime] = useState<TimeOfDay | undefined>(undefined);

  const [userWeights, setUserWeights] = useState<UserWeights>({ mood: 50, time: 25, history: 25 });
  const [viewingHistory, setViewingHistory] = useState<ViewingHistoryEntry[]>([]);
  const [recommendations, setRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  const { toast } = useToast();

  // Load preferences and history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem(LS_VIEWING_HISTORY_KEY);
    if (storedHistory) {
      setViewingHistory(JSON.parse(storedHistory));
    }
    const storedPreferences = localStorage.getItem(LS_USER_PREFERENCES_KEY);
    if (storedPreferences) {
      const { mood: storedMood, selectedTime: storedTime, userWeights: storedWeights } = JSON.parse(storedPreferences);
      if (storedMood) setMood(storedMood);
      if (storedTime) setSelectedTime(storedTime); else setSelectedTime(detectedTime); // fallback to detected if not stored
      if (storedWeights) setUserWeights(storedWeights);
    } else {
       setSelectedTime(detectedTime); // Initialize if no stored preferences
    }
  }, [detectedTime]);
  
   // Effect to ensure selectedTime is initialized with detectedTime if it's undefined
  useEffect(() => {
    if (selectedTime === undefined && detectedTime !== undefined) {
      setSelectedTime(detectedTime);
    }
  }, [selectedTime, detectedTime]);


  // Save preferences and history to localStorage when they change
  useEffect(() => {
    localStorage.setItem(LS_VIEWING_HISTORY_KEY, JSON.stringify(viewingHistory));
    const preferencesToStore = { mood, selectedTime, userWeights };
    localStorage.setItem(LS_USER_PREFERENCES_KEY, JSON.stringify(preferencesToStore));
  }, [viewingHistory, mood, selectedTime, userWeights]);


  const handleGetRecommendations = useCallback(async () => {
    if (!selectedTime) {
      toast({ title: "Cannot get recommendations", description: "Time of day is not set.", variant: "destructive" });
      return;
    }
    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    const result = await fetchMovieRecommendationsAction({ mood, timeOfDay: selectedTime, viewingHistory, userWeights });
    setIsLoadingRecommendations(false);
    if ('error' in result) {
      setRecommendationError(result.error);
      setRecommendations([]);
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setRecommendations(result);
      if (result.length === 0) {
        toast({ title: "No Recommendations", description: "Try adjusting your preferences or adding to your watch history." });
      } else {
        toast({ title: "Success", description: "Fresh movie recommendations are here!" });
      }
    }
  }, [mood, selectedTime, viewingHistory, userWeights, toast]);

  // Initial recommendations fetch when essential data is ready
  useEffect(() => {
    if (mood && selectedTime && typeof userWeights.mood === 'number') { // Check if all necessary states are initialized
      // Optionally, auto-fetch on load if desired, or require user interaction.
      // For now, let's require user interaction via the button.
      // handleGetRecommendations(); 
    }
  }, [mood, selectedTime, userWeights, handleGetRecommendations]);


  const handleTimeChange = (newTime: TimeOfDay) => {
    setSelectedTime(newTime);
    setSelectedTimeManually(newTime); // also update the hook's state if it's being used for display
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-1 space-y-6">
            <MoodSelector selectedMood={mood} onMoodChange={setMood} />
            <TimeSelector selectedTime={selectedTime} onTimeChange={handleTimeChange} />
            <WeightCustomizer weights={userWeights} onWeightsChange={setUserWeights} />
            <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations || !selectedTime} className="w-full text-lg py-6 bg-primary hover:bg-primary/90">
              {isLoadingRecommendations ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
              Get Movie Recommendations
            </Button>
          </div>

          {/* Recommendations & History Column */}
          <div className="lg:col-span-2 space-y-6">
            <MovieRecommendations
              recommendations={recommendations}
              isLoading={isLoadingRecommendations}
              error={recommendationError}
            />
            <Separator className="my-8" />
            <ViewingHistoryTracker
              viewingHistory={viewingHistory}
              onHistoryChange={setViewingHistory}
              currentMood={mood}
              currentTime={selectedTime}
            />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        FireSync &copy; {new Date().getFullYear()} - Your Personal Movie Guide
      </footer>
    </div>
  );
}
