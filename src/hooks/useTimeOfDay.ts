
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TimeOfDay } from '@/lib/types';

const getCurrentTimeOfDay = (): TimeOfDay => {
  if (typeof window === 'undefined') {
    // Return a default or placeholder for server-side rendering
    // This specific value won't be used if logic is correct, but prevents errors.
    return "Morning"; 
  }
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
};

export function useTimeOfDay(defaultTime?: TimeOfDay | undefined) {
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay | undefined>(defaultTime);
  const [isAuto, setIsAuto] = useState(!defaultTime); // Auto if no defaultTime is provided

  useEffect(() => {
    if (isAuto) {
      setCurrentTimeOfDay(getCurrentTimeOfDay());
    } else if (defaultTime) {
      setCurrentTimeOfDay(defaultTime);
    }
    // If !isAuto and !defaultTime, it means a manual selection was cleared or never set,
    // it will remain undefined until setManually or setAuto is called.
  }, [isAuto, defaultTime]);

  const setManually = useCallback((time: TimeOfDay) => {
    setCurrentTimeOfDay(time);
    setIsAuto(false);
  }, []);

  const setAuto = useCallback(() => {
    setIsAuto(true);
    // Effect above will pick this up and set currentTimeOfDay
  }, []);
  
  return { currentTimeOfDay, setCurrentTimeOfDay: setManually, isAuto, setAuto, setManually };
}
