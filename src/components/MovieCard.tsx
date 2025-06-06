import type { MovieRecommendationItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Star, Info } from 'lucide-react';

interface MovieCardProps {
  movie: MovieRecommendationItem;
  index: number;
}

export function MovieCard({ movie, index }: MovieCardProps) {
  // Simple animation delay based on index
  const animationDelay = `${index * 100}ms`;

  return (
    <Card 
      className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-fade-in-up"
      style={{ animationDelay }}
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
        <CardTitle className="font-headline text-xl mb-1 text-primary">{movie.title}</CardTitle>
        <CardDescription className="text-sm text-foreground/80 mb-3 font-body leading-relaxed line-clamp-3">
          {movie.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 bg-secondary/50 border-t">
        <div className="flex items-start space-x-2 text-sm text-muted-foreground">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="font-body"><span className="font-semibold text-foreground/90">Why this movie?</span> {movie.reason}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
