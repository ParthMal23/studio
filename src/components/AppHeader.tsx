import { Film } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-6 px-4 md:px-8 bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex items-center gap-3">
        <Film className="h-8 w-8" />
        <h1 className="text-3xl font-headline font-bold">FireSync</h1>
      </div>
    </header>
  );
}
