
import type { MovieRecommendationItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Info, ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: MovieRecommendationItem;
  index: number;
  onCardClick?: (movie: MovieRecommendationItem) => void;
  currentUserId: string | null; // Added currentUserId prop
}

export function MovieCard({ movie, index, onCardClick, currentUserId }: MovieCardProps) {
  const handleCardInteraction = () => {
    if (typeof window !== 'undefined' && currentUserId) {
      try {
        const itemToStore = {
          title: movie.title,
          platform: movie.platform,
          description: movie.description,
          reason: movie.reason,
          posterUrl: movie.posterUrl
        };
        const SS_PENDING_FEEDBACK_KEY = `pendingFeedbackItem_${currentUserId}`;
        sessionStorage.setItem(SS_PENDING_FEEDBACK_KEY, JSON.stringify(itemToStore));
      } catch (e) {
        console.error("Error saving to sessionStorage:", e);
      }
    }

    const searchTerm = movie.title;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
    window.open(googleSearchUrl, '_blank', 'noopener,noreferrer');

    if (onCardClick) {
      onCardClick(movie);
    }
  };
  
  const getAiHint = (title: string): string => {
    const cleanedTitle = title.split(':')[0].replace(/[^\\w\\s]/gi, '').trim();
    const words = cleanedTitle.split(/\\s+/).filter(Boolean);
    if (words.length === 1) return words[0].toLowerCase();
    if (words.length >= 2) return words.slice(0, 2).join(' ').toLowerCase();
    return "movie poster"; 
  };
  
  const aiHint = getAiHint(movie.title);

  return (
    <Card
      className="group h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-card cursor-pointer hover:scale-105 hover:border-primary hover:bg-accent-hover"
      onClick={handleCardInteraction}
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardInteraction(); }}
      role="button"
      tabIndex={0}
      aria-label={`Search Google for ${movie.title}`}
    >
      <CardHeader className="p-0 relative aspect-[2/3] bg-muted/30">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`Poster for ${movie.title}`}
            width={600}
            height={900}
            className="w-full h-full object-cover"
            priority={index < 3}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            <ImageOff className="w-16 h-16 mb-2" />
            <span className="text-xs">No Poster Available</span>
            <Image
              src="https://placehold.co/600x900.png" 
              alt=""
              width={600}
              height={900}
              className="w-0 h-0 absolute" 
              data-ai-hint={aiHint}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-3 md:p-4 flex-grow">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="font-headline text-lg md:text-xl text-foreground group-hover:text-accent-hover-foreground">{movie.title}</CardTitle>
          <Badge variant="secondary" className="whitespace-nowrap ml-2 shrink-0 group-hover:bg-accent-hover-foreground group-hover:text-accent-hover">
            {movie.platform}
          </Badge>
        </div>
        <CardDescription className="text-sm text-foreground/80 mb-3 font-body leading-relaxed line-clamp-2 sm:line-clamp-3 group-hover:text-accent-hover-foreground">
          {movie.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-3 md:p-4 mt-auto bg-muted/30 border-t group-hover:bg-accent-soft group-hover:border-accent-soft">
        <div className="flex items-start space-x-2 text-sm text-muted-foreground group-hover:text-accent-soft-foreground">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5 group-hover:text-accent-soft-foreground" />
          <p className="font-body"><span className="font-semibold text-foreground/90 group-hover:text-accent-soft-foreground">Why this?</span> {movie.reason}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
