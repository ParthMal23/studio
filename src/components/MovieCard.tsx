import type { MovieRecommendationItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Star, Info, ExternalLink, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MovieCardProps {
  movie: MovieRecommendationItem;
  index: number;
  onCardClick: (movie: MovieRecommendationItem) => void;
}

export function MovieCard({ movie, index, onCardClick }: MovieCardProps) {
  const animationDelay = `${index * 100}ms`;

  const CardContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (movie.platformUrl) {
      return (
        <a
          href={movie.platformUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onCardClick(movie)}
          className="block hover:ring-2 hover:ring-primary rounded-lg transition-all"
          aria-label={`Watch ${movie.title} on ${movie.platform}`}
        >
          {children}
        </a>
      );
    }
    return (
      <div onClick={() => onCardClick(movie)} className="cursor-pointer hover:ring-2 hover:ring-primary rounded-lg transition-all">
        {children}
      </div>
    );
  };


  return (
    <Card 
      className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-fade-in-up bg-card"
      style={{ animationDelay }}
    >
      <CardContentWrapper>
        <CardHeader className="p-0 relative">
          <Image
            src={`https://placehold.co/600x400.png?text=${encodeURIComponent(movie.title)}`}
            alt={`Poster for ${movie.title}`}
            width={600}
            height={400}
            className="w-full h-48 object-cover"
            data-ai-hint="movie poster"
          />
          {movie.platformUrl && (
            <div className="absolute top-2 right-2 bg-black/70 p-2 rounded-full">
              <PlayCircle className="h-6 w-6 text-white" />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <div className="flex justify-between items-start mb-1">
            <CardTitle className="font-headline text-xl text-primary">{movie.title}</CardTitle>
            <Badge variant="secondary" className="whitespace-nowrap ml-2 shrink-0">
              {movie.platform}
              {movie.platformUrl && <ExternalLink className="h-3 w-3 ml-1.5" />}
            </Badge>
          </div>
          <CardDescription className="text-sm text-foreground/80 mb-3 font-body leading-relaxed line-clamp-3">
            {movie.description}
          </CardDescription>
        </CardContent>
      </CardContentWrapper>
      <CardFooter className="p-4 bg-secondary/50 border-t">
        <div className="flex items-start space-x-2 text-sm text-muted-foreground">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="font-body"><span className="font-semibold text-foreground/90">Why this?</span> {movie.reason}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
