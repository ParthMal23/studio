
"use client";

import type { TimeOfDay } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sun, CloudSun, CloudMoon, Moon, Loader2, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

const timeOfDayOptions: { value: TimeOfDay; label: string, icon: React.ElementType }[] = [
  { value: "Morning", label: "Morning", icon: Sun },
  { value: "Afternoon", label: "Afternoon", icon: CloudSun },
  { value: "Evening", label: "Evening", icon: CloudMoon },
  { value: "Night", label: "Night", icon: Moon },
];

interface TimeSelectorProps {
  currentTime: TimeOfDay | undefined;
  onTimeChange: (time: TimeOfDay) => void;
  isAuto: boolean;
  onToggleAuto: (auto: boolean) => void;
}

export function TimeSelector({ currentTime, onTimeChange, isAuto, onToggleAuto }: TimeSelectorProps) {
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  if (!isClientMounted || !currentTime) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="font-headline text-xl text-accent flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" /> Loading Time...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid h-[116px] grid-cols-2 gap-3">
            <div className="animate-pulse rounded-md bg-muted"></div>
            <div className="animate-pulse rounded-md bg-muted"></div>
            <div className="animate-pulse rounded-md bg-muted"></div>
            <div className="animate-pulse rounded-md bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="font-headline text-xl text-accent flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Time of Day
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Label htmlFor="automatic-time" className="text-sm font-medium">Automatic</Label>
          <Switch
            id="automatic-time"
            checked={isAuto}
            onCheckedChange={onToggleAuto}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {timeOfDayOptions.map((option) => (
            <Button
              key={option.value}
              variant={currentTime === option.value ? 'default' : 'secondary'}
              className={cn(
                'h-auto justify-start p-3 text-base gap-3',
                // When in auto mode, the selected button should be fully opaque, not faded by the disabled state.
                isAuto && currentTime === option.value && 'disabled:opacity-100'
              )}
              onClick={() => onTimeChange(option.value)}
              disabled={isAuto}
              aria-pressed={currentTime === option.value}
            >
              <option.icon className="h-5 w-5" />
              <span>{option.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
