
import type { MovieRecommendationItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MovieCardProps {
  movie: MovieRecommendationItem;
  index: number;
  onCardClick?: (movie: MovieRecommendationItem) => void;
}

export function MovieCard({ movie, index, onCardClick }: MovieCardProps) {
  const animationDelay = `${index * 100}ms`;

  const handleCardInteraction = () => {
    // Open Google search in a new tab
    const searchTerm = movie.title; // Removed " movie" suffix
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
    window.open(googleSearchUrl, '_blank', 'noopener,noreferrer');

    if (onCardClick) {
      onCardClick(movie);
    }
  };

  return (
    <Card
      className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-fade-in-up bg-card cursor-pointer"
      style={{ animationDelay }}
      onClick={handleCardInteraction}
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardInteraction(); }}
      role="button"
      tabIndex={0}
    >
      <CardHeader className="p-0 relative">
        <Image
          src={`https://placehold.co/600x400.png?text=${encodeURIComponent(movie.title)}`}
          alt={`Poster for ${movie.title}`}
          width={600}
          height={400}
          className="w-full h-48 object-cover"
          data-ai-hint="movie poster"
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="font-headline text-xl text-primary">{movie.title}</CardTitle>
          <Badge variant="secondary" className="whitespace-nowrap ml-2 shrink-0">
            {movie.platform}
          </Badge>
        </div>
        <CardDescription className="text-sm text-foreground/80 mb-3 font-body leading-relaxed line-clamp-3">
          {movie.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 bg-secondary/50 border-t">
        <div className="flex items-start space-x-2 text-sm text-muted-foreground">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="font-body"><span className="font-semibold text-foreground/90">Why this?</span> {movie.reason}</p>
        </div>
      </CardFooter>
    </Card>
  );
}

