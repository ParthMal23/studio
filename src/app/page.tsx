"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Mood, TimeOfDay, UserWeights, ViewingHistoryEntry, MovieRecommendationItem, ContentType } from '@/lib/types';
import { fetchContentRecommendationsAction, fetchTextQueryRecommendationsAction, fetchSurpriseRecommendationsAction } from '@/lib/actions';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { AppHeader } from '@/components/AppHeader';
import { MoodSelector } from '@/components/MoodSelector';
import { TimeSelector } from '@/components/TimeSelector';
import { ContentTypeSelector } from '@/components/ContentTypeSelector';
import { WeightCustomizer } from '@/components/WeightCustomizer';
import { MovieRecommendations } from '@/components/MovieRecommendations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, Search as SearchIcon, Zap, Gift } from 'lucide-react';

const USER_ID_KEY = 'selectedUserId';
const PREFERENCES_KEY_PREFIX = 'userPreferences_';
const HISTORY_KEY_PREFIX = 'viewingHistory_';

export default function HomePage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [mood, setMood] = useState<Mood>("Neutral");
  const { timeOfDay, setTimeManually, isAuto, toggleAuto } = useTimeOfDay();
  const [contentType, setContentType] = useState<ContentType>("BOTH");
  const [userWeights, setUserWeights] = useState<UserWeights>({ mood: 50, time: 25, history: 25 });
  const [viewingHistory, setViewingHistory] = useState<ViewingHistoryEntry[]>([]);

  const [recommendations, setRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchRecommendations, setSearchRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [isLoadingSearchRecommendations, setIsLoadingSearchRecommendations] = useState(false);
  const [searchRecommendationError, setSearchRecommendationError] = useState<string | null>(null);

  const [surpriseRecommendations, setSurpriseRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [isLoadingSurprise, setIsLoadingSurprise] = useState(false);
  const [surpriseError, setSurpriseError] = useState<string | null>(null);

  const [activeRecommendationType, setActiveRecommendationType] = useState<null | 'personal' | 'search' | 'surprise'>(null);

  const { toast } = useToast();
  
  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      router.push('/select-user');
    } else {
      setCurrentUserId(userId);
      const savedPrefs = localStorage.getItem(`${PREFERENCES_KEY_PREFIX}${userId}`);
      if (savedPrefs) {
        try {
          const { mood, contentType, userWeights } = JSON.parse(savedPrefs);
          if (mood) setMood(mood);
          if (contentType) setContentType(contentType);
          if (userWeights) setUserWeights(userWeights);
        } catch (e) {
            console.error("Failed to parse preferences from localStorage", e);
        }
      }
      const savedHistory = localStorage.getItem(`${HISTORY_KEY_PREFIX}${userId}`);
      if (savedHistory) {
         try {
            setViewingHistory(JSON.parse(savedHistory));
         } catch(e) {
            console.error("Failed to parse history from localStorage", e);
         }
      }
    }
  }, [router]);

  useEffect(() => {
    if (currentUserId) {
      const prefsToSave = JSON.stringify({ mood, contentType, userWeights });
      localStorage.setItem(`${PREFERENCES_KEY_PREFIX}${currentUserId}`, prefsToSave);
    }
  }, [mood, contentType, userWeights, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`${HISTORY_KEY_PREFIX}${currentUserId}`, JSON.stringify(viewingHistory));
    }
  }, [viewingHistory, currentUserId]);

  const handleGetRecommendations = useCallback(async () => {
    if (!timeOfDay || !currentUserId) return;
    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    setRecommendations([]);
    setSearchRecommendations([]);
    setSearchRecommendationError(null);
    setSurpriseRecommendations([]);
    setSurpriseError(null);
    setSearchQuery('');

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
    setActiveRecommendationType('personal');
  }, [mood, timeOfDay, viewingHistory, contentType, toast, currentUserId]);

  const handleGetTextQueryRecommendations = useCallback(async () => {
    if (!searchQuery.trim() || !timeOfDay || !currentUserId) return;
    setIsLoadingSearchRecommendations(true);
    setSearchRecommendationError(null);
    setSearchRecommendations([]);
    setRecommendations([]);
    setRecommendationError(null);
    setSurpriseRecommendations([]);
    setSurpriseError(null);

    const result = await fetchTextQueryRecommendationsAction({ searchQuery, mood, timeOfDay, viewingHistory, contentType });
    setIsLoadingSearchRecommendations(false);
    if ('error' in result) {
      setSearchRecommendationError(result.error);
      setSearchRecommendations([]);
      toast({ title: "Search Error", description: result.error, variant: "destructive" });
    } else {
      setSearchRecommendations(result);
      if (result.length === 0) {
        toast({ title: "No Results", description: "No recommendations found for your search." });
      } else {
         toast({ title: "Search Success", description: `Found recommendations for "${searchQuery}"!` });
      }
    }
    setActiveRecommendationType('search');
  }, [searchQuery, mood, timeOfDay, viewingHistory, contentType, toast, currentUserId]);

  const handleGetSurpriseRecommendations = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoadingSurprise(true);
    setSurpriseError(null);
    setRecommendations([]);
    setRecommendationError(null);
    setSearchRecommendations([]);
    setSearchRecommendationError(null);

    const result = await fetchSurpriseRecommendationsAction({ viewingHistory, contentType });
    setIsLoadingSurprise(false);
    if ('error' in result) {
      setSurpriseError(result.error);
      setSurpriseRecommendations([]);
      toast({ title: "Surprise Error", description: result.error, variant: "destructive" });
    } else {
      setSurpriseRecommendations(result);
      if (result.length === 0) {
        toast({ title: "Hmm...", description: "Couldn't find a surprise this time. Try adding more to your history!" });
      } else {
         toast({ title: "Voila!", description: "Here's something unexpected for you!" });
      }
    }
    setActiveRecommendationType('surprise');
  }, [viewingHistory, contentType, toast, currentUserId]);


  const handleCardClick = (movie: MovieRecommendationItem) => {};
  
  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="mb-8 p-6 bg-card shadow-lg rounded-lg border">
          <h2 className="text-2xl font-headline font-semibold mb-4 text-accent flex items-center gap-2">
            <SearchIcon className="h-7 w-7 text-primary" /> Find Something Specific?
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., 'movie about a robot friend' or 'lighthearted comedy series'"
              className="flex-grow text-base"
              onKeyPress={(e) => { if (e.key === 'Enter') handleGetTextQueryRecommendations(); }}
            />
            <Button onClick={handleGetTextQueryRecommendations} disabled={isLoadingSearchRecommendations || !timeOfDay || !searchQuery.trim()} className="text-md py-2.5 px-6 bg-accent-hover text-accent-hover-foreground hover:bg-accent-hover/90">
              {isLoadingSearchRecommendations ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <SearchIcon className="mr-2 h-5 w-5" />}
              Search
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <MoodSelector selectedMood={mood} onMoodChange={setMood} />
            <TimeSelector currentTime={timeOfDay} onTimeChange={setTimeManually} isAuto={isAuto} onToggleAuto={toggleAuto} />
            <ContentTypeSelector selectedContentType={contentType} onContentTypeChange={setContentType} />
            <WeightCustomizer weights={userWeights} onWeightsChange={setUserWeights} />
            <div className="flex flex-col sm:flex-row gap-2">
               <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations || !timeOfDay} className="w-full text-lg py-6 flex-1">
                {isLoadingRecommendations ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                Get My Recommendations
              </Button>
              <Button onClick={handleGetSurpriseRecommendations} disabled={isLoadingSurprise} className="w-full text-lg py-6 flex-1" variant="secondary">
                {isLoadingSurprise ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Gift className="mr-2 h-5 w-5" />}
                Surprise Me!
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {activeRecommendationType === 'search' && (
              <MovieRecommendations
                recommendations={searchRecommendations} isLoading={isLoadingSearchRecommendations} error={searchRecommendationError}
                onCardClick={handleCardClick} currentUserId={currentUserId}
                title={searchQuery ? `Results for "${searchQuery}"` : "Search For Something"}
                emptyStateMessage="No results for your search. Try a different query."
                onRefresh={handleGetTextQueryRecommendations}
              />
            )}
            
            {activeRecommendationType === 'personal' && (
              <MovieRecommendations
                recommendations={recommendations} isLoading={isLoadingRecommendations} error={recommendationError}
                onCardClick={handleCardClick} currentUserId={currentUserId}
                title="Tailored For You"
                emptyStateMessage="No personal recommendations yet. Adjust preferences or add to your watch history!"
                onRefresh={handleGetRecommendations}
              />
            )}

            {activeRecommendationType === 'surprise' && (
              <MovieRecommendations
                recommendations={surpriseRecommendations} isLoading={isLoadingSurprise} error={surpriseError}
                onCardClick={handleCardClick} currentUserId={currentUserId}
                title="Something Different"
                emptyStateMessage="Couldn't conjure up a surprise. Try again!"
              />
            )}

            {activeRecommendationType === null && (
               <Card className="shadow-lg border-dashed border-primary/30">
                <CardContent className="p-10 text-center">
                  <Zap className="h-12 w-12 text-primary/50 mx-auto mb-4" />
                  <p className="text-muted-foreground font-semibold text-lg">Ready for some recommendations?</p>
                  <p className="text-muted-foreground">Use the search bar above or the buttons on the left to get started!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        FireSync &copy; {new Date().getFullYear()} - Your Personal Content Guide
      </footer>
    </div>
  );
}
