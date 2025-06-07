
"use client";

import type { TimeOfDay } from '@/lib/types';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
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
  selectedTime: TimeOfDay | undefined;
  onTimeChange: (time: TimeOfDay) => void;
}

export function TimeSelector({ selectedTime, onTimeChange }: TimeSelectorProps) {
  // Use a local state to manage if the component is ready to display, to avoid hydration issues.
  const [isClientReady, setIsClientReady] = useState(false);
  
  // The hook now takes the selectedTime prop as its initial default.
  // This `selectedTime` comes from HomePage, which loads it from localStorage client-side.
  const { currentTimeOfDay: internalTime, isAuto, setAuto, setManually } = useTimeOfDay(selectedTime);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  // When selectedTime prop changes (e.g., loaded from localStorage in HomePage),
  // update the internal hook's state if it was in auto mode or didn't have a value.
  useEffect(() => {
    if (selectedTime && selectedTime !== internalTime) {
      setManually(selectedTime);
    }
  }, [selectedTime, internalTime, setManually]);


  const handleSelectChange = (value: string) => {
    const newTime = value as TimeOfDay;
    setManually(newTime); // Update internal hook state
    onTimeChange(newTime); // Propagate change to HomePage
  };

  const handleSetAuto = () => {
    setAuto(); // Update internal hook state to auto
    // The useTimeOfDay hook's useEffect will now calculate and set the time.
    // We need to propagate this auto-detected time back to HomePage.
    // To do this reliably after state update, we might need another effect in useTimeOfDay or a callback.
    // For now, we'll rely on the `internalTime` to update.
    // A more robust solution might involve the hook returning the newly auto-detected time.
    // For simplicity, let's assume onTimeChange will be called with the new auto time via an effect if internalTime changes
  };
  
  // Effect to call onTimeChange when internalTime (especially after auto-detection) changes
  useEffect(() => {
    if (isAuto && internalTime && internalTime !== selectedTime) {
      onTimeChange(internalTime);
    }
  }, [isAuto, internalTime, onTimeChange, selectedTime]);


  if (!isClientReady) {
    // Render a placeholder or skeleton while waiting for client-side readiness
    // This ensures server and initial client render are consistent.
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

  const displayTime = internalTime || "Loading...";
  const CurrentTimeIcon = timeOfDayOptions.find(opt => opt.value === internalTime)?.icon || Clock;

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
              Current setting: {displayTime}
            </Label>
            {!isAuto && internalTime && ( // Show auto-detect only if not auto and a time is set
              <Button variant="outline" size="sm" onClick={handleSetAuto}>
                Auto-detect
              </Button>
            )}
          </div>
          <Select
            value={internalTime || ""} // Select needs a string value, handle undefined
            onValueChange={handleSelectChange}
            disabled={!internalTime} // Disable select if time is still loading
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
          {isAuto && internalTime && <p className="text-sm text-muted-foreground">Time is being auto-detected. You can manually set it above.</p>}
          {!internalTime && <p className="text-sm text-muted-foreground">Detecting time or awaiting selection...</p>}
        </div>
      </CardContent>
    </Card>
  );
}
