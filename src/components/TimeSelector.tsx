"use client";

import type { TimeOfDay } from '@/lib/types';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, CloudSun, CloudMoon, Moon, Clock } from 'lucide-react';

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
  const { currentTimeOfDay, isAuto, setAuto, setManually } = useTimeOfDay(selectedTime);

  const handleSelectChange = (value: string) => {
    setManually(value as TimeOfDay);
    onTimeChange(value as TimeOfDay);
  };

  const handleSetAuto = () => {
    setAuto();
    if (currentTimeOfDay) { // currentTimeOfDay will be updated by setAuto
        const autoTime = new Date().getHours();
        let determinedTime: TimeOfDay = "Night";
        if (autoTime >= 5 && autoTime < 12) determinedTime = "Morning";
        else if (autoTime >= 12 && autoTime < 17) determinedTime = "Afternoon";
        else if (autoTime >= 17 && autoTime < 21) determinedTime = "Evening";
        onTimeChange(determinedTime);
    }
  };
  
  const CurrentTimeIcon = timeOfDayOptions.find(opt => opt.value === (selectedTime || currentTimeOfDay))?.icon || Clock;

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
              Current setting: {selectedTime || currentTimeOfDay || "Loading..."}
            </Label>
            {!isAuto && (
              <Button variant="outline" size="sm" onClick={handleSetAuto}>
                Auto-detect
              </Button>
            )}
          </div>
          <Select
            value={selectedTime || currentTimeOfDay}
            onValueChange={handleSelectChange}
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
          {isAuto && <p className="text-sm text-muted-foreground">Time is being auto-detected. You can manually set it above.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
