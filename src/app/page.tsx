
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Mood, TimeOfDay, UserWeights, ViewingHistoryEntry, MovieRecommendationItem, ContentType } from '@/lib/types';
import { fetchContentRecommendationsAction, fetchTextQueryRecommendationsAction } from '@/lib/actions';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { AppHeader } from '@/components/AppHeader';
import { MoodSelector } from '@/components/MoodSelector';
import { TimeSelector } from '@/components/TimeSelector';
import { ContentTypeSelector } from '@/components/ContentTypeSelector';
import { WeightCustomizer } from '@/components/WeightCustomizer';
import { MovieRecommendations } from '@/components/MovieRecommendations';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, Search as SearchIcon, Zap } from 'lucide-react';

type PendingFeedbackStorageItem = Pick<MovieRecommendationItem, 'title' | 'platform' | 'description' | 'reason' | 'posterUrl'>;

export default function HomePage() {
  const { data: session, status } = useSession();
  
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

  const [activeRecommendationType, setActiveRecommendationType] = useState<null | 'personal' | 'search'>(null);

  const [pendingFeedbackItemForDialog, setPendingFeedbackItemForDialog] = useState<PendingFeedbackStorageItem | null>(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const { toast } = useToast();

  // NOTE: In a real app, preferences and history would be fetched from the DB
  // For now, we are starting with a clean slate for each authenticated user session.
  // Phase 2 will involve fetching/saving this data.

  const handleGetRecommendations = useCallback(async () => {
    if (!timeOfDay || status !== 'authenticated') return;
    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    setRecommendations([]);
    setSearchRecommendations([]);
    setSearchRecommendationError(null);
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
  }, [mood, timeOfDay, viewingHistory, contentType, toast, status]);

  const handleGetTextQueryRecommendations = useCallback(async () => {
    if (!searchQuery.trim() || !timeOfDay || status !== 'authenticated') return;
    setIsLoadingSearchRecommendations(true);
    setSearchRecommendationError(null);
    setSearchRecommendations([]);
    setRecommendations([]);
    setRecommendationError(null);

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
  }, [searchQuery, mood, timeOfDay, viewingHistory, contentType, toast, status]);

  const handleCardClick = (movie: MovieRecommendationItem) => {};

  const handleFeedbackSubmit = (feedback: Omit<ViewingHistoryEntry, 'id'>) => {
    const newEntry: ViewingHistoryEntry = { ...feedback, id: Date.now().toString() };
    setViewingHistory(prevHistory => [...prevHistory, newEntry]);
    setIsFeedbackDialogOpen(false);
    setPendingFeedbackItemForDialog(null);
    toast({ title: "History Updated", description: `${feedback.title} added to your viewing history.` });
  };
  
  if (status === 'loading') {
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
          <h2 className="text-2xl font-headline font-semibold mb-4 text-primary flex items-center gap-2">
            <SearchIcon className="h-7 w-7 text-accent" /> Find Something Specific?
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., 'movie about a robot friend' or 'lighthearted comedy series'"
              className="flex-grow text-base"
              onKeyPress={(e) => { if (e.key === 'Enter') handleGetTextQueryRecommendations(); }}
            />
            <Button onClick={handleGetTextQueryRecommendations} disabled={isLoadingSearchRecommendations || !timeOfDay || !searchQuery.trim()} className="text-md py-2.5 px-6 bg-accent hover:bg-accent/90 text-accent-foreground">
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
            <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations || !timeOfDay} className="w-full text-lg py-6 bg-primary hover:bg-primary/90">
              {isLoadingRecommendations ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
              Get My Recommendations
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {activeRecommendationType === 'search' && (
              <MovieRecommendations
                recommendations={searchRecommendations} isLoading={isLoadingSearchRecommendations} error={searchRecommendationError}
                onCardClick={handleCardClick} currentUserId={session?.user.id || null}
                title={searchQuery ? `Results for "${searchQuery}"` : "Search For Something"}
                emptyStateMessage="No results for your search. Try a different query."
              />
            )}
            
            {activeRecommendationType === 'personal' && (
              <MovieRecommendations
                recommendations={recommendations} isLoading={isLoadingRecommendations} error={recommendationError}
                onCardClick={handleCardClick} currentUserId={session?.user.id || null}
                title="Tailored For You"
                emptyStateMessage="No personal recommendations yet. Adjust preferences or add to your watch history!"
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
