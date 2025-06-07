
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

export function useTimeOfDay(initialDefaultTime?: TimeOfDay | undefined) {
  // Initialize currentTimeOfDay with initialDefaultTime if provided, otherwise undefined
  // It will be set by auto-detection in useEffect if isAuto is true and no initialDefaultTime.
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay | undefined>(initialDefaultTime);
  
  // isAuto is true if no initialDefaultTime is provided, or if explicitly set to auto.
  // If initialDefaultTime IS provided, we assume it's a manual setting initially.
  const [isAuto, setIsAuto] = useState(!initialDefaultTime); 

  useEffect(() => {
    let isActive = true;
    if (isAuto) {
      const detectedTime = getCurrentTimeOfDay();
      if (isActive) {
        setCurrentTimeOfDay(detectedTime);
      }
    } else if (currentTimeOfDay === undefined && initialDefaultTime) {
      // This case handles if initialDefaultTime was provided but hook was set to manual,
      // then ensure currentTimeOfDay reflects initialDefaultTime.
      // However, with the current useState init, this might be redundant.
       if (isActive) {
        setCurrentTimeOfDay(initialDefaultTime);
       }
    }
    return () => {isActive = false;}
  }, [isAuto, initialDefaultTime]); // Rerun if isAuto changes or if an initialDefaultTime is newly provided.


  const setManually = useCallback((time: TimeOfDay) => {
    setCurrentTimeOfDay(time);
    setIsAuto(false);
  }, []);

  const setAuto = useCallback(() => {
    setIsAuto(true);
    // The useEffect above will pick up the change to isAuto and detect current time
  }, []);
  
  // Expose the raw setCurrentTimeOfDay for cases where HomePage might need to directly set it
  // without changing the 'isAuto' mode (e.g., when loading from localStorage initially).
  // However, using setManually is preferred for user interactions.
  return { currentTimeOfDay, setCurrentTimeOfDay, isAuto, setAuto, setManually };
}
