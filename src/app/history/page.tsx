
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { ViewingHistoryEntry, WatchPatternAnalysis, Mood, TimeOfDay } from '@/lib/types';
import { analyzeWatchPatternsAction } from '@/lib/actions';
import { AppHeader } from '@/components/AppHeader';
import { ViewingHistoryTracker } from '@/components/ViewingHistoryTracker';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export default function HistoryPage() {
  const { data: session, status } = useSession();

  const [viewingHistory, setViewingHistory] = useState<ViewingHistoryEntry[]>([]);
  const { timeOfDay } = useTimeOfDay();
  const [mood, setMood] = useState<Mood>("Neutral");

  const [analysisResult, setAnalysisResult] = useState<WatchPatternAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { toast } = useToast();
  
  // NOTE: Viewing history is currently stored in-memory per session.
  // Phase 2 will involve fetching/saving this data to the database.
  useEffect(() => {
    if (status === 'authenticated') {
      // Here you would fetch viewing history from your database for the logged-in user.
      // e.g., fetch(`/api/history?userId=${session.user.id}`).then(...)
      // For now, it will be empty on each page load.
      setViewingHistory([]);
    }
  }, [status]);


  const handleAnalyzePatterns = async () => {
    if (!timeOfDay) {
      toast({ title: "Error", description: "Current time not available for analysis.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const result = await analyzeWatchPatternsAction({ viewingHistory, currentMood: mood, currentTime: timeOfDay });
    setIsAnalyzing(false);
    if ('error' in result) {
      toast({ title: "Analysis Failed", description: result.error, variant: "destructive" });
    } else {
      setAnalysisResult(result);
      toast({ title: "Analysis Complete", description: "Watch patterns analyzed successfully." });
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center bg-background p-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-6">
          <ViewingHistoryTracker
            viewingHistory={viewingHistory}
            onHistoryChange={setViewingHistory}
            currentMood={mood} 
            currentTime={timeOfDay}
            onAnalyze={handleAnalyzePatterns}
            isAnalyzing={isAnalyzing}
          />

          {analysisResult && (
            <Card className="shadow-lg animate-fade-in-up">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-accent" /> Watch Pattern Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {analysisResult.explanation && <p><span className="font-semibold">Explanation:</span> {analysisResult.explanation}</p>}
                {analysisResult.moodWeight !== undefined && <p><span className="font-semibold">Suggested Mood Weight:</span> {analysisResult.moodWeight}%</p>}
                {analysisResult.historyWeight !== undefined && <p><span className="font-semibold">Suggested History Weight:</span> {analysisResult.historyWeight}%</p>}
                {analysisResult.contentMix && analysisResult.contentMix.length > 0 && (
                  <div>
                    <p className="font-semibold">Suggested Content Mix:</p>
                    <ul className="list-disc list-inside ml-4">
                      {analysisResult.contentMix.map((item) => (
                        <li key={item.genre}>{item.genre}: {(item.proportion * 100).toFixed(0)}%</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisResult.contentMix && analysisResult.contentMix.length === 0 && (
                    <p><span className="font-semibold">Suggested Content Mix:</span> No specific mix suggested.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        FireSync &copy; {new Date().getFullYear()} - Your Personal Content Guide
      </footer>
    </div>
  );
}
