
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { RefreshCw, Loader2, LogOut } from 'lucide-react';

type PendingFeedbackStorageItem = Pick<MovieRecommendationItem, 'title' | 'platform' | 'description' | 'reason' | 'posterUrl'>;

const USER_ID_STORAGE_KEY = 'selectedUserId';

export default function HomePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentYear, setCurrentYear] = useState<string | number>('...');

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

  useEffect(() => {
    setIsMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
      if (storedUserId) {
        setCurrentUserId(storedUserId);
      } else {
        router.push('/select-user');
      }
      setIsLoadingUser(false);
    }
  }, [router]);

  const getDynamicStorageKey = useCallback((baseKey: string, userId: string | null) => {
    return userId ? `${baseKey}_${userId}` : null;
  }, []);

  const checkForPendingFeedback = useCallback(() => {
    if (typeof window === 'undefined' || !currentUserId) return;
    const SS_PENDING_FEEDBACK_KEY = getDynamicStorageKey('pendingFeedbackItem', currentUserId);
    if (!SS_PENDING_FEEDBACK_KEY) return;

    const storedItem = sessionStorage.getItem(SS_PENDING_FEEDBACK_KEY);
    if (storedItem) {
      try {
        const item: PendingFeedbackStorageItem = JSON.parse(storedItem);
        setPendingFeedbackItemForDialog(item);
        setIsFeedbackDialogOpen(true);
        sessionStorage.removeItem(SS_PENDING_FEEDBACK_KEY);
      } catch (e) {
        console.error("Failed to parse pending feedback item from sessionStorage", e);
        sessionStorage.removeItem(SS_PENDING_FEEDBACK_KEY);
      }
    }
  }, [currentUserId, getDynamicStorageKey]);


  useEffect(() => {
    if (!isMounted || !currentUserId || isLoadingUser) return;

    const LS_VIEWING_HISTORY_KEY = getDynamicStorageKey('fireSyncViewingHistory', currentUserId);
    const LS_USER_PREFERENCES_KEY = getDynamicStorageKey('fireSyncUserPreferences', currentUserId);

    if (!LS_VIEWING_HISTORY_KEY || !LS_USER_PREFERENCES_KEY) return;

    const storedHistory = localStorage.getItem(LS_VIEWING_HISTORY_KEY);
    if (storedHistory) {
      try {
        setViewingHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error(`Failed to parse viewing history from localStorage for key ${LS_VIEWING_HISTORY_KEY}:`, e);
      }
    }

    const storedPreferences = localStorage.getItem(LS_USER_PREFERENCES_KEY);
    if (storedPreferences) {
      try {
        const prefs = JSON.parse(storedPreferences);
        if (prefs.mood) setMood(prefs.mood);
        if (prefs.userWeights) setUserWeights(prefs.userWeights);
        if (prefs.contentType) setContentType(prefs.contentType);
        if (prefs.selectedTime) {
            setSelectedTime(prefs.selectedTime);
            setSelectedTimeManually(prefs.selectedTime);
        }
      } catch (e) {
        console.error(`Failed to parse preferences from localStorage for key ${LS_USER_PREFERENCES_KEY}:`, e);
      }
    }
    
    checkForPendingFeedback();
    window.addEventListener('focus', checkForPendingFeedback);

    return () => {
      window.removeEventListener('focus', checkForPendingFeedback);
    };

  }, [isMounted, currentUserId, isLoadingUser, setSelectedTimeManually, getDynamicStorageKey, checkForPendingFeedback]);

  useEffect(() => {
    if (isMounted && !selectedTime && detectedTime) {
        setSelectedTime(detectedTime);
    }
  }, [isMounted, selectedTime, detectedTime]);

  useEffect(() => {
    if (!isMounted || !currentUserId || isLoadingUser) return;

    const LS_VIEWING_HISTORY_KEY = getDynamicStorageKey('fireSyncViewingHistory', currentUserId);
    const LS_USER_PREFERENCES_KEY = getDynamicStorageKey('fireSyncUserPreferences', currentUserId);

    if (!LS_VIEWING_HISTORY_KEY || !LS_USER_PREFERENCES_KEY) return;

    localStorage.setItem(LS_VIEWING_HISTORY_KEY, JSON.stringify(viewingHistory));
    const preferencesToStore = { mood, selectedTime, userWeights, contentType };
    localStorage.setItem(LS_USER_PREFERENCES_KEY, JSON.stringify(preferencesToStore));
  }, [isMounted, currentUserId, isLoadingUser, viewingHistory, mood, selectedTime, userWeights, contentType, getDynamicStorageKey]);

  const handleGetRecommendations = useCallback(async () => {
    if (!selectedTime) {
      toast({ title: "Cannot get recommendations", description: "Time of day is not set.", variant: "destructive" });
      return;
    }
    if (!currentUserId) {
      toast({ title: "User not identified", description: "Please select a user profile.", variant: "destructive" });
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
  }, [mood, selectedTime, viewingHistory, userWeights, contentType, toast, currentUserId]);

  const handleTimeChange = (newTime: TimeOfDay) => {
    setSelectedTime(newTime);
    setSelectedTimeManually(newTime);
  };

  const handleCardClick = (movie: MovieRecommendationItem) => {
    // Logic now inside MovieCard for sessionStorage, page handles dialog opening
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

  const handleSwitchUser = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_ID_STORAGE_KEY); // Optional: clear current user to ensure selection page logic triggers
      // Or, simply navigate, and the user selection page will overwrite
    }
    router.push('/select-user');
  };

  if (isLoadingUser || !currentUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground font-semibold">Loading User Profile...</p>
        <p className="text-sm text-muted-foreground mt-1">Please wait a moment.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <MoodSelector selectedMood={mood} onMoodChange={setMood} />
            <TimeSelector selectedTime={selectedTime} onTimeChange={handleTimeChange} />
            <ContentTypeSelector selectedContentType={contentType} onContentTypeChange={setContentType} />
            <WeightCustomizer weights={userWeights} onWeightsChange={setUserWeights} />
            <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations || !selectedTime || !isMounted} className="w-full text-lg py-6 bg-primary hover:bg-primary/90">
              {isLoadingRecommendations ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
              Get Recommendations
            </Button>
            <Button variant="outline" onClick={handleSwitchUser} className="w-full text-md py-3">
             <LogOut className="mr-2 h-4 w-4" /> Switch User Profile
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <MovieRecommendations
              recommendations={recommendations}
              isLoading={isLoadingRecommendations}
              error={recommendationError}
              onCardClick={handleCardClick}
              currentUserId={currentUserId}
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
      {pendingFeedbackItemForDialog && (
        <FeedbackDialog
          isOpen={isFeedbackDialogOpen}
          onClose={() => {
            setIsFeedbackDialogOpen(false);
            setPendingFeedbackItemForDialog(null);
          }}
          onSubmit={handleFeedbackSubmit}
          movieItem={pendingFeedbackItemForDialog}
          currentTimeOfDayAtWatch={selectedTime}
        />
      )}
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        FireSync &copy; {currentYear} - Your Personal Content Guide (Profile: {currentUserId})
      </footer>
    </div>
  );
}
