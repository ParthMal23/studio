
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TimeOfDay } from '@/lib/types';

const getCurrentTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
};

export function useTimeOfDay(defaultTime?: TimeOfDay) {
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay | undefined>(defaultTime);
  const [isAuto, setIsAuto] = useState(true);

  useEffect(() => {
    if (isAuto || defaultTime === undefined) {
      setCurrentTimeOfDay(getCurrentTimeOfDay());
    }
  }, [isAuto, defaultTime]);

  const setManually = useCallback((time: TimeOfDay) => {
    setCurrentTimeOfDay(time);
    setIsAuto(false);
  }, []);

  const setAuto = useCallback(() => {
    setIsAuto(true);
    setCurrentTimeOfDay(getCurrentTimeOfDay());
  }, []);
  
  // Ensure initial value is set on client mount
  useEffect(() => {
    if (currentTimeOfDay === undefined) {
      setCurrentTimeOfDay(getCurrentTimeOfDay());
    }
  }, [currentTimeOfDay]);


  return { currentTimeOfDay, setCurrentTimeOfDay: setManually, isAuto, setAuto, setManually };
}
