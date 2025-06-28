
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
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | undefined>();
  const [isAuto, setIsAuto] = useState(true);

  useEffect(() => {
    if (isAuto) {
      setTimeOfDay(getCurrentTimeOfDay());
    }
  }, [isAuto]);

  const setTimeManually = useCallback((time: TimeOfDay) => {
    setIsAuto(false);
    setTimeOfDay(time);
  }, []);

  const toggleAuto = useCallback((auto: boolean) => {
    setIsAuto(auto);
    if (!auto && !timeOfDay) {
      // When switching to manual from an undefined state, default to something to prevent being stuck.
      setTimeOfDay("Morning");
    }
  }, [timeOfDay]);
  
  return { timeOfDay, setTimeManually, isAuto, toggleAuto };
}
