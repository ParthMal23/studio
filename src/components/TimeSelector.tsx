
"use client";

import type { TimeOfDay } from '@/lib/types';
// Removed: import { useTimeOfDay } from '@/hooks/useTimeOfDay'; // No longer used here
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, CloudSun, CloudMoon, Moon, Clock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const timeOfDayOptions: { value: TimeOfDay; label: string, icon: React.ElementType }[] = [
  { value: "Morning", label: "Morning (5am - 12pm)", icon: Sun },
  { value: "Afternoon", label: "Afternoon (12pm - 5pm)", icon: CloudSun },
  { value: "Evening", label: "Evening (5pm - 9pm)", icon: CloudMoon },
  { value: "Night", label: "Night (9pm - 5am)", icon: Moon },
];

interface TimeSelectorProps {
  currentTime: TimeOfDay | undefined; // Receives current time from HomePage
  onTimeChange: (time: TimeOfDay) => void; // Callback to update time in HomePage (calls setManually)
  isAuto: boolean; // Receives auto status from HomePage
  onSetAuto: () => void; // Callback to set auto mode in HomePage
}

export function TimeSelector({ currentTime, onTimeChange, isAuto, onSetAuto }: TimeSelectorProps) {
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const handleSelectChange = (value: string) => {
    const newTime = value as TimeOfDay;
    onTimeChange(newTime); // Propagate change to HomePage (which will call setManually)
  };

  const handleSetAuto = () => {
    onSetAuto(); // Propagate auto-set to HomePage
  };

  if (!isClientMounted) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" /> Loading Time...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>
          <div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const displayTime = currentTime || "Loading...";
  const CurrentTimeIcon = timeOfDayOptions.find(opt => opt.value === currentTime)?.icon || Clock;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
          <CurrentTimeIcon className="h-6 w-6" /> What time is it?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="time-select" className="text-base">
              Current setting: {displayTime} {isAuto && currentTime ? "(Auto)" : ""}
            </Label>
            {!isAuto && currentTime && ( 
              <Button variant="outline" size="sm" onClick={handleSetAuto}>
                Auto-detect
              </Button>
            )}
          </div>
          <Select
            value={currentTime || ""} 
            onValueChange={handleSelectChange}
            disabled={!currentTime && !isAuto} // Allow select if auto and loading, or if manual and set
          >
            <SelectTrigger id="time-select" className="w-full">
              <SelectValue placeholder="Select time of day" />
            </SelectTrigger>
            <SelectContent>
              {timeOfDayOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4 text-muted-foreground" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAuto && currentTime && <p className="text-sm text-muted-foreground">Time is being auto-detected. You can manually set it above.</p>}
          {!currentTime && isAuto && <p className="text-sm text-muted-foreground">Auto-detecting time...</p>}
          {!currentTime && !isAuto && <p className="text-sm text-muted-foreground">Please select a time or use auto-detect.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
