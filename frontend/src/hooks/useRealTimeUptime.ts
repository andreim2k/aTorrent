'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to calculate real-time uptime
 * Takes the server's reported uptime and continuously updates it client-side
 */
export function useRealTimeUptime(serverUptime?: number, isEnabled: boolean = true) {
  const [currentUptime, setCurrentUptime] = useState<number>(serverUptime || 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const serverUptimeRef = useRef<number>(serverUptime || 0);
  const startTimeRef = useRef<number>(Date.now());

  // Update references when serverUptime changes
  useEffect(() => {
    if (serverUptime !== undefined && serverUptime !== serverUptimeRef.current) {
      serverUptimeRef.current = serverUptime;
      startTimeRef.current = Date.now();
      setCurrentUptime(serverUptime);
    }
  }, [serverUptime]);

  // Start/stop the real-time counter
  useEffect(() => {
    if (!isEnabled || serverUptime === undefined) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start new interval to update every second
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setCurrentUptime(serverUptimeRef.current + elapsed);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isEnabled, serverUptime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return currentUptime;
}
