
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { MovieRecommendationItem, UserProfileDataForGroupRecs, Mood, TimeOfDay, ContentType, UserWeights, ViewingHistoryEntry } from '@/lib/types';
import { fetchGroupRecommendationsAction } from '@/lib/actions';
import { AppHeader } from '@/components/AppHeader';
import { MovieRecommendations } from '@/components/MovieRecommendations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from 'lucide-react';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

const USER_ID_KEY = 'selectedUserId';
const PREFERENCES_KEY_PREFIX = 'userPreferences_';
const HISTORY_KEY_PREFIX = 'viewingHistory_';

const availableUsers = [
  { id: 'user1', name: 'Admin' },
  { id: 'user2', name: 'Parth' },
];

const userDisplayNames: Record<string, string> = {
  user1: 'Admin',
  user2: 'Parth',
};


export default function GroupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { timeOfDay } = useTimeOfDay();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  
  const [groupRecommendations, setGroupRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      router.push('/select-user');
    } else {
      setCurrentUserId(userId);
    }
  }, [router]);

  const getUserData = useCallback((userId: string, currentTimeOfDay: TimeOfDay): UserProfileDataForGroupRecs => {
    const savedPrefs = localStorage.getItem(`${PREFERENCES_KEY_PREFIX}${userId}`);
    const savedHistory = localStorage.getItem(`${HISTORY_KEY_PREFIX}${userId}`);

    let preferences: { mood: Mood, contentType: ContentType, userWeights: UserWeights } = {
        mood: "Neutral",
        contentType: "BOTH",
        userWeights: { mood: 50, time: 25, history: 25 },
    };
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        preferences = { ...preferences, ...parsed };
      } catch (e) {
        console.error(`Failed to parse preferences for ${userId}`, e);
      }
    }

    let history: ViewingHistoryEntry[] = [];
    if (savedHistory) {
        try {
            history = JSON.parse(savedHistory);
        } catch (e) {
            console.error(`Failed to parse history for ${userId}`, e);
        }
    }

    return {
      userId: userId,
      mood: preferences.mood,
      timeOfDay: currentTimeOfDay, // Use the current time for both for this session
      viewingHistory: history,
      userWeights: preferences.userWeights,
      contentType: preferences.contentType
    };
  }, []);

  const handleFetchGroupRecommendations = useCallback(async () => {
    if (!currentUserId || !selectedFriendId || !timeOfDay) {
      toast({
        title: "Missing Information",
        description: "Please select a friend and ensure time of day is available.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGroupRecommendations([]);

    const user1Data = getUserData(currentUserId, timeOfDay);
    const user2Data = getUserData(selectedFriendId, timeOfDay);

    const result = await fetchGroupRecommendationsAction({ user1Data, user2Data });

    setIsLoading(false);
    if ('error' in result) {
      setError(result.error);
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setGroupRecommendations(result);
      if (result.length > 0) {
        toast({ title: "Group Picks Are In!", description: `Found recommendations for ${userDisplayNames[currentUserId]} and ${userDisplayNames[selectedFriendId]}.` });
      } else {
        toast({ title: "No Group Picks Found", description: "Couldn't find any overlapping recommendations. Try adjusting individual preferences." });
      }
    }
  }, [currentUserId, selectedFriendId, toast, getUserData, timeOfDay]);

  if (!currentUserId || !timeOfDay) {
     return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center bg-background p-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const friendOptions = availableUsers.filter(user => user.id !== currentUserId);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8 flex-grow flex flex-col items-center">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="text-center items-center">
            <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Watch With a Friend
            </CardTitle>
            <CardDescription>
              Select a friend to get recommendations you'll both enjoy, based on your combined tastes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="friend-selector" className="text-sm font-medium text-muted-foreground">Select a friend:</Label>
              <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
                <SelectTrigger id="friend-selector" className="w-full mt-1">
                  <SelectValue placeholder="Choose a profile..." />
                </SelectTrigger>
                <SelectContent>
                  {friendOptions.map(friend => (
                    <SelectItem key={friend.id} value={friend.id}>
                      {friend.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
             <p className="text-xs text-muted-foreground p-2 bg-muted rounded-lg text-center">
                This will use each user's saved mood, preferences, and watch history to generate recommendations.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleFetchGroupRecommendations} className="w-full" disabled={isLoading || !selectedFriendId}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Group Recommendations
            </Button>
          </CardFooter>
        </Card>
        
        <div className="w-full mt-8">
          <MovieRecommendations
            recommendations={groupRecommendations}
            isLoading={isLoading}
            error={error}
            onCardClick={() => {}}
            currentUserId={currentUserId} 
            title="Group Picks"
            emptyStateMessage="Select a friend and click 'Get Group Recommendations' to start."
          />
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        FireSync &copy; {new Date().getFullYear()} - Your Personal Content Guide
      </footer>
    </div>
  );
}
