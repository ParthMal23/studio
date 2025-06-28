
'use client';

import { Film, LogOut, Home, History, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  currentUserId?: string | null;
  onLogout?: () => void;
}

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/history', label: 'Watch History', icon: History },
  { href: '/group', label: 'Group Watch', icon: Users },
];

export function AppHeader({ currentUserId, onLogout }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="py-3 px-4 md:px-8 bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex items-center justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <Film className="h-8 w-8" />
          <h1 className="text-3xl font-headline font-bold">FireSync</h1>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant="ghost"
                className={cn(
                  'hover:bg-primary-foreground/10 text-primary-foreground',
                  pathname === item.href && 'bg-primary-foreground/20'
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

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
       {/* Mobile Nav */}
       <div className="md:hidden mt-3 container mx-auto">
        <nav className="flex items-center justify-around gap-1 rounded-md bg-primary-foreground/10 p-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref className="flex-1">
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full hover:bg-primary-foreground/10 text-primary-foreground',
                    pathname === item.href && 'bg-primary-foreground/20'
                  )}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
        </div>
    </header>
  );
}
