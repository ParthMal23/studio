
"use client";

import { useState, useRef, useEffect } from 'react';
import type { ViewingHistoryEntry, Mood, TimeOfDay } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { History, ListChecks, Star, Activity, Trash2, Loader2, Upload, Smile, Frown, Meh, Zap, Drama, Clock, Coffee, Compass, Heart, Sun, CloudSun, CloudMoon, Moon } from 'lucide-react';
import Papa from 'papaparse';

const moodsForSelection: { value: Mood; label: string; icon?: React.ElementType }[] = [
  { value: "Happy", label: "Happy", icon: Smile },
  { value: "Sad", label: "Sad", icon: Frown },
  { value: "Goofy", label: "Goofy", icon: Drama },
  { value: "Excited", label: "Excited", icon: Zap },
  { value: "Relaxed", label: "Relaxed", icon: Coffee },
  { value: "Adventurous", label: "Adventurous", icon: Compass },
  { value: "Romantic", label: "Romantic", icon: Heart },
  { value: "Neutral", label: "Neutral", icon: Meh },
];

const timeOfDayOptions: { value: TimeOfDay; label: string, icon: React.ElementType }[] = [
    { value: "Morning", label: "Morning", icon: Sun },
    { value: "Afternoon", label: "Afternoon", icon: CloudSun },
    { value: "Evening", label: "Evening", icon: CloudMoon },
    { value: "Night", label: "Night", icon: Moon },
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
  const [newMovieMoodAtWatch, setNewMovieMoodAtWatch] = useState<Mood | undefined>(currentMood);
  const [newMovieTimeOfDayAtWatch, setNewMovieTimeOfDayAtWatch] = useState<TimeOfDay | undefined>(currentTime);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNewMovieMoodAtWatch(currentMood);
  }, [currentMood]);

  useEffect(() => {
    setNewMovieTimeOfDayAtWatch(currentTime);
  }, [currentTime]);

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
      timeOfDayAtWatch: newMovieTimeOfDayAtWatch,
    };
    onHistoryChange([...viewingHistory, newEntry]);
    setNewMovieTitle('');
    setNewMovieRating(3);
    setNewMovieCompleted(true);
    setNewMovieMoodAtWatch(currentMood);
    setNewMovieTimeOfDayAtWatch(currentTime);
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
          <CardTitle className="font-headline text-xl text-accent flex items-center gap-2">
            <History className="h-6 w-6 text-primary" /> Your Viewing History
          </CardTitle>
          <CardDescription>Track content you've watched to improve recommendations. Add manually or import a CSV.</CardDescription>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="item-mood-at-watch">Mood When Watched</Label>
              <Select value={newMovieMoodAtWatch} onValueChange={(value) => setNewMovieMoodAtWatch(value === "undefined" ? undefined : value as Mood)}>
                <SelectTrigger id="item-mood-at-watch">
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined">None</SelectItem>
                  {moodsForSelection.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      <div className="flex items-center gap-2">
                        {mood.icon && <mood.icon className="h-4 w-4" />}
                        {mood.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="item-time-at-watch">Time When Watched</Label>
               <Select value={newMovieTimeOfDayAtWatch} onValueChange={(value) => setNewMovieTimeOfDayAtWatch(value as TimeOfDay)}>
                <SelectTrigger id="item-time-at-watch">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOfDayOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      <div className="flex items-center gap-2">
                        {time.icon && <time.icon className="h-4 w-4" />}
                        {time.label}
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
            <Button onClick={handleAddMovie} className="flex-1">
              <ListChecks className="mr-2 h-4 w-4" /> Add Manually
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-1">
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
