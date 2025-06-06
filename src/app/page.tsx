
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Mood, TimeOfDay, UserWeights, ViewingHistoryEntry, MovieRecommendationItem, ContentType } from '@/lib/types';
import { fetchContentRecommendationsAction } from '@/lib/actions';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { AppHeader } from '@/components/AppHeader';
import { MoodSelector } from '@/components/MoodSelector';
import { TimeSelector } from '@/components/TimeSelector';
import { ContentTypeSelector } from '@/components/ContentTypeSelector';
import { WeightCustomizer } from '@/components/WeightCustomizer';
import { MovieRecommendations } from '@/components/MovieRecommendations';
import { ViewingHistoryTracker } from '@/components/ViewingHistoryTracker';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LS_VIEWING_HISTORY_KEY = 'fireSyncViewingHistory';
const LS_USER_PREFERENCES_KEY = 'fireSyncUserPreferences';
const LS_PENDING_FEEDBACK_KEY = 'fireSyncPendingFeedbackItem';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);

  const [mood, setMood] = useState<Mood>("Neutral");
  const { currentTimeOfDay: detectedTime, setCurrentTimeOfDay: setSelectedTimeManually } = useTimeOfDay();
  const [selectedTime, setSelectedTime] = useState<TimeOfDay | undefined>(undefined);
  const [contentType, setContentType] = useState<ContentType>("BOTH");
  const [userWeights, setUserWeights] = useState<UserWeights>({ mood: 50, time: 25, history: 25 });
  const [viewingHistory, setViewingHistory] = useState<ViewingHistoryEntry[]>([]);

  const [recommendations, setRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  const [pendingFeedbackMovie, setPendingFeedbackMovie] = useState<MovieRecommendationItem | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true); 

    const storedHistory = localStorage.getItem(LS_VIEWING_HISTORY_KEY);
    if (storedHistory) {
      try {
        setViewingHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse viewing history from localStorage", e);
      }
    }

    const storedPreferences = localStorage.getItem(LS_USER_PREFERENCES_KEY);
    if (storedPreferences) {
      try {
        const prefs = JSON.parse(storedPreferences);
        if (prefs.mood) setMood(prefs.mood);
        if (prefs.userWeights) setUserWeights(prefs.userWeights);
        if (prefs.contentType) setContentType(prefs.contentType);
        if (prefs.selectedTime) setSelectedTime(prefs.selectedTime);
      } catch (e) {
        console.error("Failed to parse preferences from localStorage", e);
      }
    }

    const pendingItemJSON = localStorage.getItem(LS_PENDING_FEEDBACK_KEY);
    if (pendingItemJSON) {
      try {
        const item = JSON.parse(pendingItemJSON) as MovieRecommendationItem;
        setPendingFeedbackMovie(item);
        setShowFeedbackDialog(true);
      } catch (e) {
        console.error("Failed to parse pending feedback item from localStorage", e);
        localStorage.removeItem(LS_PENDING_FEEDBACK_KEY); // Clear corrupted item
      }
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (selectedTime === undefined && detectedTime !== undefined) {
      const storedPreferences = localStorage.getItem(LS_USER_PREFERENCES_KEY);
      let canSetFromDetectedTime = true;
      if (storedPreferences) {
        try {
          const prefs = JSON.parse(storedPreferences);
          if (prefs.hasOwnProperty('selectedTime') && prefs.selectedTime !== undefined) {
            // localStorage had a selectedTime, it should have been set.
          }
        } catch (e) { /* ignore */ }
      }
      if (canSetFromDetectedTime) {
        setSelectedTime(detectedTime);
      }
    }
  }, [isMounted, detectedTime, selectedTime]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(LS_VIEWING_HISTORY_KEY, JSON.stringify(viewingHistory));
    const preferencesToStore = { mood, selectedTime, userWeights, contentType };
    localStorage.setItem(LS_USER_PREFERENCES_KEY, JSON.stringify(preferencesToStore));
  }, [isMounted, viewingHistory, mood, selectedTime, userWeights, contentType]);

  const handleGetRecommendations = useCallback(async () => {
    if (!selectedTime) {
      toast({ title: "Cannot get recommendations", description: "Time of day is not set.", variant: "destructive" });
      return;
    }
    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    const result = await fetchContentRecommendationsAction({ mood, timeOfDay: selectedTime, viewingHistory, userWeights, contentType });
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
        toast({ title: "Success", description: "Fresh recommendations are here!" });
      }
    }
  }, [mood, selectedTime, viewingHistory, userWeights, contentType, toast]);

  const handleTimeChange = (newTime: TimeOfDay) => {
    setSelectedTime(newTime);
    setSelectedTimeManually(newTime); 
  };

  const handleCardClick = (movie: MovieRecommendationItem) => {
    if (movie.platformUrl) { // Only store if it's an external link they might watch
        localStorage.setItem(LS_PENDING_FEEDBACK_KEY, JSON.stringify(movie));
    }
  };

  const handleFeedbackSubmit = (watched: boolean, rating?: number, completed?: boolean) => {
    if (pendingFeedbackMovie && watched && rating !== undefined && completed !== undefined) {
      const newEntry: ViewingHistoryEntry = {
        id: Date.now().toString(),
        title: pendingFeedbackMovie.title,
        rating: rating,
        completed: completed,
      };
      setViewingHistory(prev => [...prev, newEntry]);
      toast({ title: "History Updated", description: `${pendingFeedbackMovie.title} added with your feedback.` });
    }
    localStorage.removeItem(LS_PENDING_FEEDBACK_KEY);
    setShowFeedbackDialog(false);
    setPendingFeedbackMovie(null);
  };

  const handleFeedbackDismiss = () => {
    localStorage.removeItem(LS_PENDING_FEEDBACK_KEY);
    setShowFeedbackDialog(false);
    setPendingFeedbackMovie(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <MoodSelector selectedMood={mood} onMoodChange={setMood} />
            {isMounted ? (
              <TimeSelector selectedTime={selectedTime} onTimeChange={handleTimeChange} />
            ) : (
              <Card className="shadow-lg">
                <Skeleton className="h-48 w-full" />
              </Card>
            )}
            <ContentTypeSelector selectedContentType={contentType} onContentTypeChange={setContentType} />
            <WeightCustomizer weights={userWeights} onWeightsChange={setUserWeights} />
            <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations || !selectedTime || !isMounted} className="w-full text-lg py-6 bg-primary hover:bg-primary/90">
              {isLoadingRecommendations ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
              Get Recommendations
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <MovieRecommendations
              recommendations={recommendations}
              isLoading={isLoadingRecommendations}
              error={recommendationError}
              onCardClick={handleCardClick}
            />
            <Separator className="my-8" />
            {isMounted ? (
              <ViewingHistoryTracker
                viewingHistory={viewingHistory}
                onHistoryChange={setViewingHistory}
                currentMood={mood}
                currentTime={selectedTime}
              />
            ) : (
              <Card className="shadow-lg">
                <Skeleton className="h-72 w-full" />
              </Card>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        FireSync &copy; {isMounted ? new Date().getFullYear() : '...'} - Your Personal Content Guide
      </footer>
      {isMounted && pendingFeedbackMovie && (
        <FeedbackDialog
          isOpen={showFeedbackDialog}
          movie={pendingFeedbackMovie}
          onSubmit={handleFeedbackSubmit}
          onDismiss={handleFeedbackDismiss}
        />
      )}
    </div>
  );
}
