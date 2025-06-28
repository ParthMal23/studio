"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { MovieRecommendationItem } from '@/lib/types';
import { AppHeader } from '@/components/AppHeader';
import { MovieRecommendations } from '@/components/MovieRecommendations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from 'lucide-react';

const USER_ID_KEY = 'selectedUserId';

export default function GroupPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      router.push('/select-user');
    } else {
      setCurrentUserId(userId);
    }
  }, [router]);

  const handleFetchGroupRecommendations = useCallback(async () => {
    toast({
      title: "Coming Soon!",
      description: "The friends system is being built. Group recommendations will be available once you can add friends.",
    });
  }, [toast]);

  if (!currentUserId) {
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
      <main className="container mx-auto p-4 md:p-8 flex-grow flex flex-col items-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center items-center">
            <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Watch With a Friend
            </CardTitle>
            <CardDescription>
              Once the friends system is implemented, you'll be able to select a friend here to get group recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">The ability to add and select friends is coming soon!</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleFetchGroupRecommendations} className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Group Recommendations
            </Button>
          </CardFooter>
        </Card>
        
        <div className="w-full mt-8">
          <MovieRecommendations
            recommendations={[]}
            isLoading={false}
            error={null}
            onCardClick={() => {}}
            currentUserId={currentUserId} 
            title="Group Picks"
            emptyStateMessage="Select a friend and click 'Get Group Recommendations' to start."
          />
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        FireSync &copy; {new Date().getFullYear()} - Your Personal Content Guide
      </footer>
    </div>
  );
}
