
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Mood, TimeOfDay, UserWeights, ViewingHistoryEntry, MovieRecommendationItem, ContentType, UserProfileDataForGroupRecs } from '@/lib/types';
import { fetchContentRecommendationsAction, fetchGroupRecommendationsAction } from '@/lib/actions';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, Users, LogOut } from 'lucide-react';

type PendingFeedbackStorageItem = Pick<MovieRecommendationItem, 'title' | 'platform' | 'description' | 'reason' | 'posterUrl'>;

const USER_ID_STORAGE_KEY = 'selectedUserId';
const COMMON_RECOMMENDATION_REASON_PREFIX = "Common Pick:";

const userDisplayNames: Record<string, string> = {
  user1: 'Admin',
  user2: 'Parth',
};

export default function HomePage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentYear, setCurrentYear] = useState<string | number>('...');

  const [mood, setMood] = useState<Mood>("Neutral");
  const { 
    currentTimeOfDay: timeOfDay, 
    setCurrentTimeOfDay: setTimeOfDayDirectly, // Raw setter from hook
    isAuto: isTimeAuto, 
    setAuto: setTimeAutoDetect, 
    setManually: setTimeManually 
  } = useTimeOfDay(); // Initialize with auto-detection or from localStorage later

  const [contentType, setContentType] = useState<ContentType>("BOTH");
  const [userWeights, setUserWeights] = useState<UserWeights>({ mood: 50, time: 25, history: 25 });
  const [viewingHistory, setViewingHistory] = useState<ViewingHistoryEntry[]>([]);

  const [recommendations, setRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  const [groupRecommendations, setGroupRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [isLoadingGroupRecommendations, setIsLoadingGroupRecommendations] = useState(false);
  const [groupRecommendationError, setGroupRecommendationError] = useState<string | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [potentialGroupPartnerId, setPotentialGroupPartnerId] = useState<string | null>(null);
  const [groupRecsTitle, setGroupRecsTitle] = useState<string>("Group Picks");

  const [pendingFeedbackItemForDialog, setPendingFeedbackItemForDialog] = useState<PendingFeedbackStorageItem | null>(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
      if (storedUserId) {
        setCurrentUserId(storedUserId);
        setCurrentUserDisplayName(userDisplayNames[storedUserId] || storedUserId);
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
    if (!currentUserId || isLoadingUser) return;

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
        if (prefs.selectedTime) { // This corresponds to timeOfDay from the hook now
            setTimeManually(prefs.selectedTime); // Set hook to manual mode with this time
        }
        // If prefs.selectedTime is not present, useTimeOfDay hook will auto-detect or keep its current value.
      } catch (e) {
        console.error(`Failed to parse preferences from localStorage for key ${LS_USER_PREFERENCES_KEY}:`, e);
      }
    }
    
    checkForPendingFeedback();
    window.addEventListener('focus', checkForPendingFeedback);

    return () => {
      window.removeEventListener('focus', checkForPendingFeedback);
    };

  }, [currentUserId, isLoadingUser, getDynamicStorageKey, checkForPendingFeedback, setTimeManually]);
  

  useEffect(() => {
    if (!currentUserId || isLoadingUser) return;

    const LS_VIEWING_HISTORY_KEY = getDynamicStorageKey('fireSyncViewingHistory', currentUserId);
    const LS_USER_PREFERENCES_KEY = getDynamicStorageKey('fireSyncUserPreferences', currentUserId);

    if (!LS_VIEWING_HISTORY_KEY || !LS_USER_PREFERENCES_KEY) return;

    localStorage.setItem(LS_VIEWING_HISTORY_KEY, JSON.stringify(viewingHistory));
    // Save timeOfDay from the hook as selectedTime
    const preferencesToStore = { mood, selectedTime: timeOfDay, userWeights, contentType };
    localStorage.setItem(LS_USER_PREFERENCES_KEY, JSON.stringify(preferencesToStore));
  }, [currentUserId, isLoadingUser, viewingHistory, mood, timeOfDay, userWeights, contentType, getDynamicStorageKey]);

  const handleGetRecommendations = useCallback(async () => {
    if (!timeOfDay) {
      toast({ title: "Cannot get recommendations", description: "Time of day is not set.", variant: "destructive" });
      return;
    }
    if (!currentUserId) {
      toast({ title: "User not identified", description: "Please select a user profile.", variant: "destructive" });
      return;
    }
    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    const result = await fetchContentRecommendationsAction({ mood, timeOfDay, viewingHistory, contentType });
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
  }, [mood, timeOfDay, viewingHistory, contentType, toast, currentUserId]);

  const loadUserProfileData = useCallback((userIdToLoad: string): UserProfileDataForGroupRecs | null => {
    const historyKey = getDynamicStorageKey('fireSyncViewingHistory', userIdToLoad);
    const prefsKey = getDynamicStorageKey('fireSyncUserPreferences', userIdToLoad);

    if (!historyKey || !prefsKey) return null;

    let userHistory: ViewingHistoryEntry[] = [];
    let userMoodState: Mood = "Neutral";
    let userTimeOfDayState: TimeOfDay = "Morning"; // Default, will be overridden
    let userPrefsWeights: UserWeights = { mood: 50, time: 25, history: 25 };
    let userPrefsContentType: ContentType = "BOTH";

    const storedHistory = localStorage.getItem(historyKey);
    if (storedHistory) try { userHistory = JSON.parse(storedHistory); } catch (e) { console.error("Error parsing history for group", e); }

    const storedPreferences = localStorage.getItem(prefsKey);
    if (storedPreferences) {
      try {
        const prefs = JSON.parse(storedPreferences);
        if (prefs.mood) userMoodState = prefs.mood;
        if (prefs.userWeights) userPrefsWeights = prefs.userWeights;
        if (prefs.contentType) userPrefsContentType = prefs.contentType;
        if (prefs.selectedTime) userTimeOfDayState = prefs.selectedTime; // This is the key for time
      } catch (e) {
        console.error("Error parsing prefs for group", e);
      }
    } else {
        // If no stored preferences for the other user, try to get a sensible default time
        // This part is tricky as we don't have direct access to their hook.
        // For simplicity, default to "Morning" or the current user's timeOfDay if available.
        userTimeOfDayState = timeOfDay || "Morning";
    }
    
    return {
      userId: userIdToLoad,
      mood: userMoodState,
      timeOfDay: userTimeOfDayState,
      viewingHistory: userHistory,
      userWeights: userPrefsWeights,
      contentType: userPrefsContentType,
    };
  }, [getDynamicStorageKey, timeOfDay]);


  const handleFetchGroupRecommendations = useCallback(async () => {
    if (!currentUserId || !potentialGroupPartnerId) {
      toast({ title: "Group Error", description: "Current user or group partner not selected.", variant: "destructive" });
      return;
    }

    setIsGroupDialogOpen(false); 

    const user1Data = loadUserProfileData(currentUserId);
    const partnerData = loadUserProfileData(potentialGroupPartnerId);

    if (!user1Data || !partnerData) {
      toast({ title: "Error loading user data", description: "Could not load data for one or both users in the group.", variant: "destructive" });
      return;
    }
    
    setIsLoadingGroupRecommendations(true);
    setGroupRecommendationError(null);
    const result = await fetchGroupRecommendationsAction({ user1Data, user2Data: partnerData });
    setIsLoadingGroupRecommendations(false);

    if ('error' in result) {
      setGroupRecommendationError(result.error);
      setGroupRecommendations([]);
      toast({ title: "Group Recs Error", description: result.error, variant: "destructive" });
    } else {
      setGroupRecommendations(result);
      const partnerDisplayName = userDisplayNames[potentialGroupPartnerId] || potentialGroupPartnerId;
      setGroupRecsTitle(`Picks for You and ${partnerDisplayName}`);
      if (result.length === 0) {
        toast({ title: "No Group Recommendations", description: "Could not find common or compromise recommendations. Try adjusting preferences." });
      } else {
        const hasCommonPick = result.some(rec => rec.reason?.startsWith(COMMON_RECOMMENDATION_REASON_PREFIX));
        if (hasCommonPick) {
            toast({ title: "Group Recs Success!", description: `Found recommendations including common picks for you and ${partnerDisplayName}!` });
        } else {
            toast({ title: "Group Recs Found!", description: `Found some compromise recommendations for you and ${partnerDisplayName}.` });
        }
      }
    }
    setPotentialGroupPartnerId(null); 
  }, [currentUserId, potentialGroupPartnerId, loadUserProfileData, toast]);

  const handleTimeChange = (newTime: TimeOfDay) => {
    setTimeManually(newTime); // Use setManually from the hook
  };

  const handleCardClick = (movie: MovieRecommendationItem) => {
    // Logic is now primarily handled within MovieCard.tsx using sessionStorage.
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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_ID_STORAGE_KEY);
    }
    router.push('/select-user');
  };

  if (isLoadingUser || !currentUserId || !currentUserDisplayName) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground font-semibold">Loading User Profile...</p>
        <p className="text-sm text-muted-foreground mt-1">Please wait a moment.</p>
      </div>
    );
  }
  
  const otherUserInternalId = currentUserId === 'user1' ? 'user2' : 'user1';
  const otherUserDisplayName = userDisplayNames[otherUserInternalId] || otherUserInternalId;

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader currentUserId={currentUserDisplayName} onLogout={handleLogout} />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <MoodSelector selectedMood={mood} onMoodChange={setMood} />
            <TimeSelector 
              currentTime={timeOfDay} 
              onTimeChange={handleTimeChange} 
              isAuto={isTimeAuto}
              onSetAuto={setTimeAutoDetect}
            />
            <ContentTypeSelector selectedContentType={contentType} onContentTypeChange={setContentType} />
            <WeightCustomizer weights={userWeights} onWeightsChange={setUserWeights} />
            <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations || !timeOfDay} className="w-full text-lg py-6 bg-primary hover:bg-primary/90">
              {isLoadingRecommendations ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
              Get My Recommendations
            </Button>
            
            <Dialog open={isGroupDialogOpen} onOpenChange={(isOpen) => {
                setIsGroupDialogOpen(isOpen);
                if (!isOpen) setPotentialGroupPartnerId(null); 
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full text-lg py-6 border-primary text-primary hover:bg-primary/10">
                  <Users className="mr-2 h-5 w-5" />
                  Watch with a Friend
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select User to Watch With</DialogTitle>
                  <DialogDescription>
                    Choose who you'd like to get group recommendations with.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                  <p className="text-sm text-muted-foreground">You are: <span className="font-semibold text-primary">{currentUserDisplayName}</span></p>
                  <Button 
                    variant={potentialGroupPartnerId === otherUserInternalId ? 'default' : 'outline'} 
                    onClick={() => setPotentialGroupPartnerId(otherUserInternalId)}
                    className="w-full"
                  >
                    {otherUserDisplayName}
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => { setIsGroupDialogOpen(false); setPotentialGroupPartnerId(null); }}>Cancel</Button>
                  <Button onClick={handleFetchGroupRecommendations} disabled={!potentialGroupPartnerId || isLoadingGroupRecommendations}>
                    {isLoadingGroupRecommendations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Get Group Recommendations
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>

          <div className="lg:col-span-2 space-y-6">
            <MovieRecommendations
              recommendations={recommendations}
              isLoading={isLoadingRecommendations}
              error={recommendationError}
              onCardClick={handleCardClick}
              currentUserId={currentUserId}
              title="Here are your picks!"
            />
            
            { (groupRecommendations.length > 0 || isLoadingGroupRecommendations || groupRecommendationError) && <Separator className="my-8" /> }

            <MovieRecommendations
              recommendations={groupRecommendations}
              isLoading={isLoadingGroupRecommendations}
              error={groupRecommendationError}
              onCardClick={handleCardClick}
              currentUserId={currentUserId} 
              title={groupRecsTitle}
              emptyStateMessage="No group recommendations found. Try adjusting preferences or watch histories."
              showWhenEmpty={isLoadingGroupRecommendations || !!groupRecommendationError || groupRecommendations.length > 0}
            />

            <Separator className="my-8" />
            <ViewingHistoryTracker
              viewingHistory={viewingHistory}
              onHistoryChange={setViewingHistory}
              currentMood={mood} 
              currentTime={timeOfDay} 
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
          currentTimeOfDayAtWatch={timeOfDay}
          initialMoodAtWatch={mood} 
        />
      )}
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        FireSync &copy; {currentYear} - Your Personal Content Guide
      </footer>
    </div>
  );
}
    

      



    
