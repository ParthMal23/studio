
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Users } from 'lucide-react';

const USER_ID_KEY = 'selectedUserId';

export default function SelectUserPage() {
  const router = useRouter();

  const handleUserSelect = (userId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_ID_KEY, userId);
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4 selection:bg-primary/20">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="items-center">
          <div className="p-3 bg-primary/10 rounded-full mb-3">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline text-center text-primary">
            Select User Profile
          </CardTitle>
          <CardDescription className="text-center pt-1">
            Choose a profile to load your personalized FireSync experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <Button
            onClick={() => handleUserSelect('user1')}
            className="w-full text-lg py-7 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300"
            size="lg"
          >
            <User className="mr-2 h-5 w-5" /> User 1
          </Button>
          <Button
            onClick={() => handleUserSelect('user2')}
            className="w-full text-lg py-7 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-all duration-300"
            size="lg"
          >
            <User className="mr-2 h-5 w-5" /> User 2
          </Button>
        </CardContent>
      </Card>
       <p className="mt-8 text-xs text-muted-foreground max-w-md text-center">
        This is a multi-user simulation. All data (viewing history, preferences) is stored locally in your browser and is specific to the selected user profile.
      </p>
    </div>
  );
}
