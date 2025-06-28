"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TimeOfDay } from '@/lib/types';

const getCurrentTimeOfDay = (): TimeOfDay => {
  if (typeof window === 'undefined') {
    return "Morning"; // Default for SSR, actual detection client-side
  }
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
};

export function useTimeOfDay() {
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay | undefined>();
  const [isAuto, setIsAuto] = useState(true);

  useEffect(() => {
    // When isAuto is true, we want to detect the time.
    // This effect will run on initial mount and whenever isAuto is set back to true.
    if (isAuto) {
      setCurrentTimeOfDay(getCurrentTimeOfDay());
    }
  }, [isAuto]);

  const setTimeManually = useCallback((time: TimeOfDay) => {
    // When a user sets the time manually, switch to manual mode and set the time.
    setIsAuto(false);
    setCurrentTimeOfDay(time);
  }, []);

  const setAuto = useCallback(() => {
    // When a user wants to auto-detect, just switch the mode.
    // The useEffect will handle setting the time.
    setIsAuto(true);
  }, []);
  
  return { timeOfDay: currentTimeOfDay, setTimeManually, isAuto, setAuto };
}
