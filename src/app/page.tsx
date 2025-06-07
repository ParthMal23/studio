
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
import { FeedbackDialog } from '@/components/FeedbackDialog'; // New component
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LS_VIEWING_HISTORY_KEY = 'fireSyncViewingHistory';
const LS_USER_PREFERENCES_KEY = 'fireSyncUserPreferences';
const SS_PENDING_FEEDBACK_KEY = 'pendingFeedbackItem';

// Define a type for the item stored in sessionStorage for feedback
type PendingFeedbackStorageItem = Pick<MovieRecommendationItem, 'title' | 'platform' | 'description' | 'reason' | 'posterUrl'>;


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

  const [pendingFeedbackItemForDialog, setPendingFeedbackItemForDialog] = useState<PendingFeedbackStorageItem | null>(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const { toast } = useToast();

  const checkForPendingFeedback = useCallback(() => {
    if (!isMounted) return;
    const storedItem = sessionStorage.getItem(SS_PENDING_FEEDBACK_KEY);
    if (storedItem) {
      try {
        const item: PendingFeedbackStorageItem = JSON.parse(storedItem);
        setPendingFeedbackItemForDialog(item);
        setIsFeedbackDialogOpen(true);
        sessionStorage.removeItem(SS_PENDING_FEEDBACK_KEY); // Clear after processing
      } catch (e) {
        console.error("Failed to parse pending feedback item from sessionStorage", e);
        sessionStorage.removeItem(SS_PENDING_FEEDBACK_KEY); // Clear if parsing fails
      }
    }
  }, [isMounted]);

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
    
    checkForPendingFeedback(); // Check on initial mount
    window.addEventListener('focus', checkForPendingFeedback); // Check when tab regains focus

    return () => {
      window.removeEventListener('focus', checkForPendingFeedback);
    };

  }, [checkForPendingFeedback]); // Add checkForPendingFeedback to dependency array

  useEffect(() => {
    if (!isMounted) return;
    if (selectedTime === undefined && detectedTime !== undefined) {
      const storedPreferences = localStorage.getItem(LS_USER_PREFERENCES_KEY);
      if (storedPreferences) {
        try {
          const prefs = JSON.parse(storedPreferences);
          if (prefs.hasOwnProperty('selectedTime') && prefs.selectedTime !== undefined) {
            // localStorage had a selectedTime, it should have been set.
          } else {
             setSelectedTime(detectedTime);
          }
        } catch (e) { 
           setSelectedTime(detectedTime);
        }
      } else {
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
    // This function could be used for other future interactions if needed
    // console.log("Card clicked, preparing for potential feedback:", movie.title);
  };

  const handleFeedbackSubmit = (feedback: Omit<ViewingHistoryEntry, 'id'>) => {
    const newEntry: ViewingHistoryEntry = {
      ...feedback,
      id: Date.now().toString(),
    };
    setViewingHistory(prevHistory => [...prevHistory, newEntry]);
    setIsFeedbackDialogOpen(false);
    setPendingFeedbackItemForDialog(null);
    toast({ title: "History Updated", description: `${feedback.title} added to your viewing history.` });
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
              onCardClick={handleCardClick} // Pass the handler
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
      {pendingFeedbackItemForDialog && (
        <FeedbackDialog
          isOpen={isFeedbackDialogOpen}
          onClose={() => {
            setIsFeedbackDialogOpen(false);
            setPendingFeedbackItemForDialog(null);
          }}
          onSubmit={handleFeedbackSubmit}
          movieItem={pendingFeedbackItemForDialog}
        />
      )}
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        FireSync &copy; {isMounted ? new Date().getFullYear() : '...'} - Your Personal Content Guide
      </footer>
    </div>
  );
}
