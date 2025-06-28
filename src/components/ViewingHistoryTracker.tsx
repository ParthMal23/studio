
"use client";

import { useState, useRef } from 'react';
import type { ViewingHistoryEntry, Mood, TimeOfDay } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { History, ListChecks, Star, Activity, Trash2, Loader2, Upload, Smile, Frown, Meh, Zap, Coffee, ShieldQuestion, Clock } from 'lucide-react';
import Papa from 'papaparse';

const moodsForSelection: { value: Mood; label: string; icon?: React.ElementType }[] = [
  { value: "Happy", label: "Happy", icon: Smile },
  { value: "Sad", label: "Sad", icon: Frown },
  { value: "Relaxed", label: "Relaxed", icon: Coffee },
  { value: "Excited", label: "Excited", icon: Zap },
  { value: "Calm", label: "Calm", icon: Coffee },
  { value: "Adventurous", label: "Adventurous", icon: Zap },
  { value: "Neutral", label: "Neutral", icon: Meh },
];

interface ViewingHistoryTrackerProps {
  viewingHistory: ViewingHistoryEntry[];
  onHistoryChange: (history: ViewingHistoryEntry[]) => void;
  currentMood: Mood;
  currentTime: TimeOfDay | undefined;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export function ViewingHistoryTracker({ viewingHistory, onHistoryChange, currentMood, currentTime, onAnalyze, isAnalyzing }: ViewingHistoryTrackerProps) {
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [newMovieRating, setNewMovieRating] = useState(3);
  const [newMovieCompleted, setNewMovieCompleted] = useState(true);
  const [newMovieMoodAtWatch, setNewMovieMoodAtWatch] = useState<Mood | undefined>(undefined);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddMovie = () => {
    if (!newMovieTitle.trim()) {
      toast({ title: "Error", description: "Title cannot be empty.", variant: "destructive" });
      return;
    }
    const newEntry: ViewingHistoryEntry = {
      id: Date.now().toString(),
      title: newMovieTitle,
      rating: newMovieRating,
      completed: newMovieCompleted,
      moodAtWatch: newMovieMoodAtWatch,
      timeOfDayAtWatch: currentTime,
    };
    onHistoryChange([...viewingHistory, newEntry]);
    setNewMovieTitle('');
    setNewMovieRating(3);
    setNewMovieCompleted(true);
    setNewMovieMoodAtWatch(undefined);
    toast({ title: "History Updated", description: `${newMovieTitle} added to your viewing history.` });
  };

  const handleRemoveMovie = (id: string) => {
    onHistoryChange(viewingHistory.filter(movie => movie.id !== id));
    toast({ title: "History Updated", description: `Item removed from your viewing history.` });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: "File Error", description: "No file selected.", variant: "destructive" });
      return;
    }
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({ title: "File Error", description: "Please upload a CSV file.", variant: "destructive" });
        return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newEntries: ViewingHistoryEntry[] = [];
        results.data.forEach((row, index) => {
          const title = row['Title'] || row['title'];
          if (title) {
            newEntries.push({
              id: `${Date.now()}-${index}`,
              title: title.trim(),
              rating: 3,
              completed: true,
            });
          }
        });

        if (newEntries.length > 0) {
          onHistoryChange([...viewingHistory, ...newEntries]);
          toast({ title: "History Imported", description: `${newEntries.length} items imported from CSV.` });
        } else {
          toast({ title: "Import Info", description: "No new items found or 'Title' column missing in CSV.", variant: "default" });
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        toast({ title: "CSV Parsing Error", description: error.message, variant: "destructive" });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
            <History className="h-6 w-6" /> Your Viewing History
          </CardTitle>
          <CardDescription>Track content you've watched to improve recommendations. Add manually or import a CSV.
            {currentTime && <span className="block text-xs mt-1">Items added manually will note time as <Clock className="inline h-3 w-3 mr-0.5" /> {currentTime}.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="item-title">Title</Label>
            <Input
              id="item-title"
              value={newMovieTitle}
              onChange={(e) => setNewMovieTitle(e.target.value)}
              placeholder="e.g., The Grand Adventure"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item-rating">Rating (1-5)</Label>
              <Input
                id="item-rating"
                type="number"
                min="1"
                max="5"
                value={newMovieRating}
                onChange={(e) => setNewMovieRating(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="item-mood-at-watch">Mood When Watched (Optional)</Label>
              <Select value={newMovieMoodAtWatch} onValueChange={(value) => setNewMovieMoodAtWatch(value as Mood)}>
                <SelectTrigger id="item-mood-at-watch">
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined">None</SelectItem>
                  {moodsForSelection.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      <div className="flex items-center gap-2">
                        {mood.icon && <mood.icon className="h-4 w-4 text-muted-foreground" />}
                        {mood.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="item-completed"
              checked={newMovieCompleted}
              onCheckedChange={(checked) => setNewMovieCompleted(Boolean(checked))}
            />
            <Label htmlFor="item-completed">Completed?</Label>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleAddMovie} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
              <ListChecks className="mr-2 h-4 w-4" /> Add Manually
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
              <Upload className="mr-2 h-4 w-4" /> Upload Watch History
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {viewingHistory.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Logged Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {viewingHistory.map((item) => (
                <li key={item.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Rating: {"⭐".repeat(item.rating)}{" "}
                      ({item.completed ? "Completed" : "Not Completed"})
                      {item.moodAtWatch && `, Mood: ${item.moodAtWatch}`}
                      {item.timeOfDayAtWatch && `, Time: ${item.timeOfDayAtWatch}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveMovie(item.id)} aria-label="Remove item">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={onAnalyze} disabled={isAnalyzing || viewingHistory.length === 0} className="w-full">
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
              Analyze Watch Patterns
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
