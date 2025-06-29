'use client';

import { Film, Home, History, Users, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { Sheet, SheetContent, SheetClose, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/history', label: 'Watch History', icon: History },
  { href: '/group', label: 'Group Watch', icon: Users },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="py-3 px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b border-border/50 text-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* Left side: Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Film className="h-8 w-8 text-primary" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold shrink-0">FireSync</h1>
        </Link>
        
        {/* Desktop Nav in the middle */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant="ghost"
                className={cn(
                  'font-medium',
                  pathname === item.href && 'bg-accent/10 text-accent'
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
                <ThemeToggle />
                <Button asChild variant="ghost" size="sm">
                   <Link href="/select-user">
                       <LogOut className="mr-2 h-4 w-4" />
                       Log Out
                   </Link>
                </Button>
            </div>

            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0 flex flex-col bg-card">
                  <div className="p-6 border-b">
                     <SheetClose asChild>
                       <Link href="/" className="flex items-center gap-3">
                        <Film className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-headline font-bold">FireSync</h1>
                      </Link>
                    </SheetClose>
                  </div>
                  <nav className="flex flex-col gap-2 p-4 flex-grow">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link href={item.href} passHref>
                           <Button
                            variant={pathname === item.href ? "secondary" : "ghost"}
                            className="justify-start w-full text-md p-5"
                          >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                          </Button>
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="p-4 border-t space-y-4">
                      <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Theme</span>
                          <ThemeToggle />
                      </div>
                      <SheetClose asChild>
                        <Link href="/select-user" passHref>
                           <Button variant="outline" className="w-full text-md p-5">
                              <LogOut className="mr-2 h-4 w-4" />
                              Log Out
                           </Button>
                        </Link>
                      </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
