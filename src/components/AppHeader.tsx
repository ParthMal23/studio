'use client';

import { Film, Home, History, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/history', label: 'Watch History', icon: History },
  { href: '/group', label: 'Group Watch', icon: Users },
];

export function AppHeader() {
  const pathname = usePathname();
  const hoverClasses = 'dark:hover:bg-accent/20 light:hover:bg-accent-hover light:hover:text-accent-hover-foreground';

  return (
    <header className="py-3 px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b border-border/50 text-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left side: Logo + Desktop Nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Film className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline font-bold">FireSync</h1>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant="ghost"
                  className={cn(
                    hoverClasses,
                    pathname === item.href && 'bg-accent/10 text-accent'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side: Desktop Logout Button + Theme Toggle */}
        <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className={cn(hoverClasses)}>
               <Link href="/select-user">
                   <LogOut className="mr-2 h-4 w-4" />
                   Log Out
               </Link>
            </Button>
        </div>
      </div>

       {/* Mobile Nav (includes Logout) */}
       <div className="md:hidden mt-3 container mx-auto">
        <nav className="flex items-center justify-around gap-1 rounded-md bg-accent/10 p-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref className="flex-1">
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full',
                    hoverClasses,
                    pathname === item.href && 'bg-accent/20 text-accent'
                  )}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            ))}
            <Link href="/select-user" passHref className="flex-1">
                <Button
                  variant="ghost"
                  className={cn('w-full', hoverClasses)}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  <span className="text-xs">Log Out</span>
                </Button>
              </Link>
          </nav>
        </div>
    </header>
  );
}
