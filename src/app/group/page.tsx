
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Mood, TimeOfDay, UserWeights, ViewingHistoryEntry, MovieRecommendationItem, ContentType, UserProfileDataForGroupRecs } from '@/lib/types';
import { fetchGroupRecommendationsAction } from '@/lib/actions';
import { AppHeader } from '@/components/AppHeader';
import { MovieRecommendations } from '@/components/MovieRecommendations';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from 'lucide-react';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

type PendingFeedbackStorageItem = Pick<MovieRecommendationItem, 'title' | 'platform' | 'description' | 'reason' | 'posterUrl'>;

const USER_ID_STORAGE_KEY = 'selectedUserId';
const COMMON_RECOMMENDATION_REASON_PREFIX = "Common Pick:";
const userDisplayNames: Record<string, string> = { user1: 'Admin', user2: 'Parth' };

export default function GroupPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [groupRecommendations, setGroupRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [isLoadingGroupRecommendations, setIsLoadingGroupRecommendations] = useState(false);
  const [groupRecommendationError, setGroupRecommendationError] = useState<string | null>(null);
  const [potentialGroupPartnerId, setPotentialGroupPartnerId] = useState<string | null>(null);
  const [groupRecsTitle, setGroupRecsTitle] = useState<string>("Group Picks");
  
  const [viewingHistory, setViewingHistory] = useState<ViewingHistoryEntry[]>([]);
  const [mood, setMood] = useState<Mood>("Neutral");
  const { timeOfDay } = useTimeOfDay();

  const [pendingFeedbackItemForDialog, setPendingFeedbackItemForDialog] = useState<PendingFeedbackStorageItem | null>(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const { toast } = useToast();

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
        console.error("Failed to parse pending feedback item", e);
        sessionStorage.removeItem(SS_PENDING_FEEDBACK_KEY);
      }
    }
  }, [currentUserId, getDynamicStorageKey]);

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
  
  useEffect(() => {
    if (!currentUserId || isLoadingUser) return;
    const LS_VIEWING_HISTORY_KEY = getDynamicStorageKey('fireSyncViewingHistory', currentUserId);
    if (!LS_VIEWING_HISTORY_KEY) return;
    const storedHistory = localStorage.getItem(LS_VIEWING_HISTORY_KEY);
    if (storedHistory) try { setViewingHistory(JSON.parse(storedHistory)); } catch (e) {}

    const LS_USER_PREFERENCES_KEY = getDynamicStorageKey('fireSyncUserPreferences', currentUserId);
    if(LS_USER_PREFERENCES_KEY) {
        const storedPreferences = localStorage.getItem(LS_USER_PREFERENCES_KEY);
        if (storedPreferences) {
            try {
                const prefs = JSON.parse(storedPreferences);
                if (prefs.mood) setMood(prefs.mood);
            } catch (e) {}
        }
    }

    checkForPendingFeedback();
    window.addEventListener('focus', checkForPendingFeedback);
    return () => window.removeEventListener('focus', checkForPendingFeedback);
  }, [currentUserId, isLoadingUser, getDynamicStorageKey, checkForPendingFeedback]);

  useEffect(() => {
    if (!currentUserId || isLoadingUser) return;
    const LS_VIEWING_HISTORY_KEY = getDynamicStorageKey('fireSyncViewingHistory', currentUserId);
    if (!LS_VIEWING_HISTORY_KEY) return;
    localStorage.setItem(LS_VIEWING_HISTORY_KEY, JSON.stringify(viewingHistory));
  }, [currentUserId, isLoadingUser, viewingHistory, getDynamicStorageKey]);

  const loadUserProfileData = useCallback((userIdToLoad: string): UserProfileDataForGroupRecs | null => {
    const historyKey = getDynamicStorageKey('fireSyncViewingHistory', userIdToLoad);
    const prefsKey = getDynamicStorageKey('fireSyncUserPreferences', userIdToLoad);
    if (!historyKey || !prefsKey) return null;

    let userHistory: ViewingHistoryEntry[] = [];
    let userMoodState: Mood = "Neutral";
    let userTimeOfDayState: TimeOfDay = "Morning"; 
    let userPrefsWeights: UserWeights = { mood: 50, time: 25, history: 25 };
    let userPrefsContentType: ContentType = "BOTH";

    const storedHistory = localStorage.getItem(historyKey);
    if (storedHistory) try { userHistory = JSON.parse(storedHistory); } catch (e) {}

    const storedPreferences = localStorage.getItem(prefsKey);
    if (storedPreferences) {
      try {
        const prefs = JSON.parse(storedPreferences);
        userMoodState = prefs.mood || "Neutral";
        userPrefsWeights = prefs.userWeights || { mood: 50, time: 25, history: 25 };
        userPrefsContentType = prefs.contentType || "BOTH";
        userTimeOfDayState = prefs.selectedTime || "Morning"; 
      } catch (e) {}
    } else {
        userTimeOfDayState = timeOfDay || "Morning";
    }
    
    return { userId: userIdToLoad, mood: userMoodState, timeOfDay: userTimeOfDayState, viewingHistory: userHistory, userWeights: userPrefsWeights, contentType: userPrefsContentType };
  }, [getDynamicStorageKey, timeOfDay]);

  const handleFetchGroupRecommendations = useCallback(async () => {
    if (!currentUserId || !potentialGroupPartnerId) return;

    const user1Data = loadUserProfileData(currentUserId);
    const partnerData = loadUserProfileData(potentialGroupPartnerId);
    if (!user1Data || !partnerData) {
      toast({ title: "Error loading user data", description: "Could not load data for one or both users.", variant: "destructive" });
      return;
    }
    
    setIsLoadingGroupRecommendations(true);
    setGroupRecommendationError(null);
    setGroupRecommendations([]); 

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
        toast({ title: "No Group Recommendations", description: "Could not find common or compromise recommendations." });
      } else {
        const hasCommonPick = result.some(rec => rec.reason?.startsWith(COMMON_RECOMMENDATION_REASON_PREFIX));
        if (hasCommonPick) {
            toast({ title: "Group Recs Success!", description: `Found recommendations including common picks for you and ${partnerDisplayName}!` });
        } else {
            toast({ title: "Group Recs Found!", description: `Found some compromise recommendations for you and ${partnerDisplayName}.` });
        }
      }
    }
  }, [currentUserId, potentialGroupPartnerId, loadUserProfileData, toast]);

  const handleCardClick = (movie: MovieRecommendationItem) => {};
  
  const handleFeedbackSubmit = (feedback: Omit<ViewingHistoryEntry, 'id'>) => {
    const newEntry: ViewingHistoryEntry = { ...feedback, id: Date.now().toString() };
    setViewingHistory(prevHistory => [...prevHistory, newEntry]);
    setIsFeedbackDialogOpen(false);
    setPendingFeedbackItemForDialog(null);
    toast({ title: "History Updated", description: `${feedback.title} added to your viewing history.` });
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(USER_ID_STORAGE_KEY);
    router.push('/select-user');
  };

  if (isLoadingUser || !currentUserId || !currentUserDisplayName) {
     return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center bg-background p-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const otherUserInternalId = currentUserId === 'user1' ? 'user2' : 'user1';
  const otherUserDisplayName = userDisplayNames[otherUserInternalId] || otherUserInternalId;

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader currentUserId={currentUserDisplayName} onLogout={handleLogout} />
      <main className="container mx-auto p-4 md:p-8 flex-grow flex flex-col items-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center items-center">
            <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Watch With a Friend
            </CardTitle>
            <CardDescription>
              Choose who you'd like to get group recommendations with.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">You are: <span className="font-semibold text-primary">{currentUserDisplayName}</span></p>
            <Button 
              variant={potentialGroupPartnerId === otherUserInternalId ? 'default' : 'outline'} 
              onClick={() => setPotentialGroupPartnerId(otherUserInternalId)}
              className="w-full"
            >
              {otherUserDisplayName}
            </Button>
          </CardContent>
          <CardFooter>
            <Button onClick={handleFetchGroupRecommendations} className="w-full" disabled={!potentialGroupPartnerId || isLoadingGroupRecommendations}>
              {isLoadingGroupRecommendations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Group Recommendations
            </Button>
          </CardFooter>
        </Card>
        
        <div className="w-full mt-8">
          <MovieRecommendations
            recommendations={groupRecommendations}
            isLoading={isLoadingGroupRecommendations}
            error={groupRecommendationError}
            onCardClick={handleCardClick}
            currentUserId={currentUserId} 
            title={groupRecsTitle}
            emptyStateMessage="Select a friend and click 'Get Group Recommendations' to start."
          />
        </div>
      </main>
      {pendingFeedbackItemForDialog && (
        <FeedbackDialog
          isOpen={isFeedbackDialogOpen}
          onClose={() => { setIsFeedbackDialogOpen(false); setPendingFeedbackItemForDialog(null); }}
          onSubmit={handleFeedbackSubmit}
          movieItem={pendingFeedbackItemForDialog}
          currentTimeOfDayAtWatch={timeOfDay}
          initialMoodAtWatch={mood} 
        />
      )}
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        FireSync &copy; {new Date().getFullYear()} - Your Personal Content Guide
      </footer>
    </div>
  );
}
