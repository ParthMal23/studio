
"use client";

import { useState } from 'react';
import type { MovieRecommendationItem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, X } from 'lucide-react';
import { Checkbox } from './ui/checkbox';

interface FeedbackDialogProps {
  isOpen: boolean;
  movie: MovieRecommendationItem | null;
  onSubmit: (watched: boolean, rating?: number, completed?: boolean) => void;
  onDismiss: () => void;
}

export function FeedbackDialog({ isOpen, movie, onSubmit, onDismiss }: FeedbackDialogProps) {
  const [watched, setWatched] = useState<boolean | undefined>(undefined);
  const [rating, setRating] = useState<number>(3);
  const [completed, setCompleted] = useState<boolean>(true);

  if (!movie) return null;

  const handleSubmit = () => {
    if (watched === undefined) { // User didn't select yes or no for watching
        onDismiss(); // Or show a message to select an option
        return;
    }
    onSubmit(watched, watched ? rating : undefined, watched ? completed : undefined);
    resetState();
  };

  const handleDismiss = () => {
    onDismiss();
    resetState();
  };
  
  const resetState = () => {
    setWatched(undefined);
    setRating(3);
    setCompleted(true);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Feedback for {movie.title}</DialogTitle>
          <DialogDescription>
            Did you watch "{movie.title}"? Your feedback helps improve future recommendations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Did you watch it?</Label>
            <RadioGroup onValueChange={(value) => setWatched(value === "yes")} value={watched === undefined ? "" : (watched ? "yes" : "no")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`watch-yes-${movie.id}`} />
                <Label htmlFor={`watch-yes-${movie.id}`}>Yes, I watched it</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`watch-no-${movie.id}`} />
                <Label htmlFor={`watch-no-${movie.id}`}>No, I didn't watch it (or not yet)</Label>
              </div>
            </RadioGroup>
          </div>

          {watched && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="rating">Your Rating (1-5 stars)</Label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="ghost"
                      size="icon"
                      onClick={() => setRating(star)}
                      className={rating >= star ? 'text-accent' : 'text-muted-foreground'}
                      aria-label={`Rate ${star} star`}
                    >
                      <Star className="h-6 w-6" />
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`completed-${movie.id}`}
                  checked={completed}
                  onCheckedChange={(checked) => setCompleted(Boolean(checked))}
                />
                <Label htmlFor={`completed-${movie.id}`}>Did you complete it?</Label>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleDismiss}>Dismiss</Button>
          <Button onClick={handleSubmit} disabled={watched === undefined} className="bg-primary hover:bg-primary/90">Submit Feedback</Button>
        </DialogFooter>
         <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={handleDismiss}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

// Placeholder for movie.id if it's not available
interface MovieRecommendationItem {
  id?: string; // Adding optional id for keying if needed, actual MovieRecommendationItem doesn't have it
  title: string;
  description: string;
  reason: string;
  platform: string;
  platformUrl?: string;
}
