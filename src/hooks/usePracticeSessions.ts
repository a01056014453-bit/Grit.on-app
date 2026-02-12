"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getAllSessions, type PracticeSession } from "@/lib/db";

interface UsePracticeSessionsReturn {
  sessions: PracticeSession[];
  sessionsByDate: Record<string, PracticeSession[]>;
  isLoading: boolean;
  reload: () => Promise<void>;
}

// Global cache to share data across components within the same page lifecycle
let cachedSessions: PracticeSession[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3000; // 3 seconds

export function usePracticeSessions(): UsePracticeSessionsReturn {
  const [sessions, setSessions] = useState<PracticeSession[]>(cachedSessions || []);
  const [isLoading, setIsLoading] = useState(!cachedSessions);

  const loadSessions = useCallback(async () => {
    try {
      const allSessions = await getAllSessions();
      const sorted = allSessions.sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      cachedSessions = sorted;
      cacheTimestamp = Date.now();
      setSessions(sorted);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Use cache if fresh enough
    if (cachedSessions && Date.now() - cacheTimestamp < CACHE_TTL) {
      setSessions(cachedSessions);
      setIsLoading(false);
      return;
    }
    loadSessions();
  }, [loadSessions]);

  // Reload when page becomes visible (tab switch back)
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        loadSessions();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadSessions]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, PracticeSession[]> = {};
    sessions.forEach((s) => {
      const d = new Date(s.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  return {
    sessions,
    sessionsByDate,
    isLoading,
    reload: loadSessions,
  };
}
