"use client";

import { useState, useEffect } from 'react';
import type { ViewingHistoryEntry, WatchPatternAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { analyzeWatchPatternsAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { History, ListChecks, Star, Activity, Trash2, Loader2, Lightbulb } from 'lucide-react';

interface ViewingHistoryTrackerProps {
  viewingHistory: ViewingHistoryEntry[];
  onHistoryChange: (history: ViewingHistoryEntry[]) => void;
  currentMood: string;
  currentTime: string | undefined;
}

export function ViewingHistoryTracker({ viewingHistory, onHistoryChange, currentMood, currentTime }: ViewingHistoryTrackerProps) {
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [newMovieRating, setNewMovieRating] = useState(3);
  const [newMovieCompleted, setNewMovieCompleted] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<WatchPatternAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAddMovie = () => {
    if (!newMovieTitle.trim()) {
      toast({ title: "Error", description: "Movie title cannot be empty.", variant: "destructive" });
      return;
    }
    const newEntry: ViewingHistoryEntry = {
      id: Date.now().toString(), // Simple unique ID
      title: newMovieTitle,
      rating: newMovieRating,
      completed: newMovieCompleted,
    };
    onHistoryChange([...viewingHistory, newEntry]);
    setNewMovieTitle('');
    setNewMovieRating(3);
    setNewMovieCompleted(true);
    toast({ title: "History Updated", description: `${newMovieTitle} added to your viewing history.` });
  };

  const handleRemoveMovie = (id: string) => {
    onHistoryChange(viewingHistory.filter(movie => movie.id !== id));
    toast({ title: "History Updated", description: `Movie removed from your viewing history.` });
  };

  const handleAnalyzePatterns = async () => {
    if (!currentTime) {
      toast({ title: "Error", description: "Current time not available for analysis.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const result = await analyzeWatchPatternsAction({ viewingHistory, currentMood, currentTime });
    setIsAnalyzing(false);
    if ('error' in result) {
      toast({ title: "Analysis Failed", description: result.error, variant: "destructive" });
    } else {
      try {
        const parsedAdjustments = JSON.parse(result.recommendationAdjustments) as WatchPatternAnalysis;
        setAnalysisResult(parsedAdjustments);
        toast({ title: "Analysis Complete", description: "Watch patterns analyzed successfully." });
      } catch (e) {
        toast({ title: "Analysis Error", description: "Could not parse analysis results.", variant: "destructive" });
        setAnalysisResult({ explanation: "Raw: " + result.recommendationAdjustments });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
            <History className="h-6 w-6" /> Your Viewing History
          </CardTitle>
          <CardDescription>Track movies you've watched to improve recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="movie-title">Movie Title</Label>
            <Input
              id="movie-title"
              value={newMovieTitle}
              onChange={(e) => setNewMovieTitle(e.target.value)}
              placeholder="e.g., The Cinematic Adventure"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="movie-rating">Rating (1-5)</Label>
              <Input
                id="movie-rating"
                type="number"
                min="1"
                max="5"
                value={newMovieRating}
                onChange={(e) => setNewMovieRating(parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="movie-completed"
                checked={newMovieCompleted}
                onCheckedChange={(checked) => setNewMovieCompleted(Boolean(checked))}
              />
              <Label htmlFor="movie-completed">Completed?</Label>
            </div>
          </div>
          <Button onClick={handleAddMovie} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <ListChecks className="mr-2 h-4 w-4" /> Add to History
          </Button>
        </CardContent>
      </Card>

      {viewingHistory.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Logged Movies</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {viewingHistory.map((movie) => (
                <li key={movie.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                  <div>
                    <p className="font-semibold">{movie.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Rating: {"⭐".repeat(movie.rating)}{" "}
                      ({movie.completed ? "Completed" : "Not Completed"})
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveMovie(movie.id)} aria-label="Remove movie">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnalyzePatterns} disabled={isAnalyzing || viewingHistory.length === 0} className="w-full">
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
              Analyze Watch Patterns
            </Button>
          </CardFooter>
        </Card>
      )}

      {analysisResult && (
        <Card className="shadow-lg animate-fade-in-up">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
             <Lightbulb className="h-6 w-6 text-accent" /> Watch Pattern Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {analysisResult.explanation && <p><span className="font-semibold">Explanation:</span> {analysisResult.explanation}</p>}
            {analysisResult.moodWeight !== undefined && <p><span className="font-semibold">Suggested Mood Weight:</span> {analysisResult.moodWeight}</p>}
            {analysisResult.historyWeight !== undefined && <p><span className="font-semibold">Suggested History Weight:</span> {analysisResult.historyWeight}</p>}
            {analysisResult.contentMix && (
              <div>
                <p className="font-semibold">Suggested Content Mix:</p>
                <ul className="list-disc list-inside ml-4">
                  {Object.entries(analysisResult.contentMix).map(([genre, weight]) => (
                    <li key={genre}>{genre}: {weight}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
