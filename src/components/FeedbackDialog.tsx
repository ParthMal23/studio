
"use client";

import { useState, useEffect } from 'react';
import type { Mood, ViewingHistoryEntry, TimeOfDay } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smile, Frown, Meh, Zap, Drama, Star, Clock, Coffee, Compass, Heart, Sun, CloudSun, CloudMoon, Moon } from 'lucide-react';

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

type PendingFeedbackStorageItem = {
  title: string;
  platform: string;
  description?: string;
  reason?: string;
  posterUrl?: string;
};

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Omit<ViewingHistoryEntry, 'id'>) => void;
  movieItem: PendingFeedbackStorageItem | null;
  currentTimeOfDayAtWatch: TimeOfDay | undefined;
  initialMoodAtWatch?: Mood;
}

export function FeedbackDialog({ isOpen, onClose, onSubmit, movieItem, currentTimeOfDayAtWatch, initialMoodAtWatch }: FeedbackDialogProps) {
  const [rating, setRating] = useState(3);
  const [moodAtWatch, setMoodAtWatch] = useState<Mood | undefined>(initialMoodAtWatch);
  const [timeOfDayAtWatch, setTimeOfDayAtWatch] = useState<TimeOfDay | undefined>(currentTimeOfDayAtWatch);
  const [completed, setCompleted] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setRating(3);
      setMoodAtWatch(initialMoodAtWatch);
      setTimeOfDayAtWatch(currentTimeOfDayAtWatch);
      setCompleted(true);
    }
  }, [isOpen, movieItem, initialMoodAtWatch, currentTimeOfDayAtWatch]);

  if (!movieItem) return null;

  const handleSubmit = () => {
    onSubmit({
      title: movieItem.title,
      rating: rating,
      completed: completed,
      moodAtWatch: moodAtWatch,
      timeOfDayAtWatch: timeOfDayAtWatch,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-accent" />
            Add to Your Viewing History
          </DialogTitle>
          <DialogDescription>
            How was your experience with <span className="font-semibold text-primary">{movieItem.title}</span>?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rating" className="text-right col-span-1">
              Rating
            </Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value, 10))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="moodAtWatch" className="text-right col-span-1">
              Mood
            </Label>
            <Select value={moodAtWatch} onValueChange={(value) => setMoodAtWatch(value === "undefined" ? undefined : value as Mood)}>
              <SelectTrigger id="moodAtWatch" className="col-span-3">
                <SelectValue placeholder="Select mood when watched" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="undefined">Don't know</SelectItem>
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
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timeAtWatch" className="text-right col-span-1">
              Time
            </Label>
            <Select value={timeOfDayAtWatch} onValueChange={(value) => setTimeOfDayAtWatch(value as TimeOfDay)}>
              <SelectTrigger id="timeAtWatch" className="col-span-3">
                <SelectValue placeholder="Select time when watched" />
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="completed" className="text-right col-span-1">
              Status
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="completed"
                checked={completed}
                onCheckedChange={(checked) => setCompleted(Boolean(checked))}
              />
              <Label htmlFor="completed" className="text-sm font-normal">
                I completed this
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add to History</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
