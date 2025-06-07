
import type { MovieRecommendationItem } from '@/lib/types';
import { MovieCard } from './MovieCard';
import { AlertTriangle, Zap, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MovieRecommendationsProps {
  recommendations: MovieRecommendationItem[] | undefined;
  isLoading: boolean;
  error?: string | null;
  onCardClick: (movie: MovieRecommendationItem) => void;
  currentUserId: string | null;
  title: string; 
  emptyStateMessage?: string; 
  showWhenEmpty?: boolean; 
}

export function MovieRecommendations({
  recommendations,
  isLoading,
  error,
  onCardClick,
  currentUserId,
  title,
  emptyStateMessage = "Adjust your preferences and try again!",
  showWhenEmpty = true, 
}: MovieRecommendationsProps) {
  const currentRecommendations = recommendations || [];
  const IconComponent = title.toLowerCase().includes("group") ? Users : Zap;

  if (!showWhenEmpty && !isLoading && !error && currentRecommendations.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-headline font-semibold mb-6 text-primary flex items-center gap-2">
          <IconComponent className="h-7 w-7 animate-pulse-soft" /> Conjuring Recommendations...
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 bg-destructive/10 border border-destructive text-destructive rounded-lg flex items-center gap-3">
        <AlertTriangle className="h-8 w-8" />
        <div>
          <h3 className="font-semibold text-lg">Oops! Something went wrong.</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (currentRecommendations.length === 0 && !isLoading) {
    // Use a more generic empty state heading for group recommendations now that there's a fallback
    const emptyStateHeading = title.toLowerCase().includes("group") ? "No Group Picks Found" : "No recommendations yet.";
    return (
      <div className="mt-8 text-center py-10">
        <IconComponent className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-headline font-semibold text-muted-foreground">{emptyStateHeading}</h2>
        <p className="text-muted-foreground">{emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-headline font-semibold mb-6 text-primary flex items-center gap-2">
        <IconComponent className="h-7 w-7 text-accent" /> {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentRecommendations.map((movie, index) => (
          <MovieCard
            key={`${movie.title}-${index}-${currentUserId}`} 
            movie={movie}
            index={index}
            onCardClick={onCardClick}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 border rounded-lg shadow-md bg-card">
      <Skeleton className="h-40 w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full mt-2 rounded-md" />
    </div>
  )
}
