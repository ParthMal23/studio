
import { Film, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  currentUserId?: string | null;
  onLogout?: () => void;
}

export function AppHeader({ currentUserId, onLogout }: AppHeaderProps) {
  return (
    <header className="py-4 px-4 md:px-8 bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Film className="h-8 w-8" />
          <h1 className="text-3xl font-headline font-bold">FireSync</h1>
        </div>
        {currentUserId && onLogout && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="hover:bg-primary-foreground/10 text-primary-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout ({currentUserId})
          </Button>
        )}
      </div>
    </header>
  );
}
