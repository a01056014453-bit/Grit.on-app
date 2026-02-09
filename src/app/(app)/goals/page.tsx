"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { StatsCard } from "@/components/app";
import { getAllSessions, getPracticeStats, type PracticeSession } from "@/lib/db";

export default function GoalsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [totalHours, setTotalHours] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [allSessions, setAllSessions] = useState<PracticeSession[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  // Calculate streak
  function calculateStreak(sessions: { startTime: Date }[]): number {
    if (sessions.length === 0) return 0;

    const dateSet = new Set<string>();
    sessions.forEach((s) => {
      const date = new Date(s.startTime);
      date.setHours(0, 0, 0, 0);
      dateSet.add(date.toISOString());
    });

    if (dateSet.size === 0) return 0;

    let streak = 0;
    const checkDate = new Date(today);
    const todayStr = today.toISOString();

    if (!dateSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (!dateSet.has(checkDate.toISOString())) {
        return 0;
      }
    }

    while (dateSet.has(checkDate.toISOString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Total hours
        const stats = await getPracticeStats();
        setTotalHours(Math.round(stats.totalPracticeTime / 3600));

        // Week sessions
        const sessions = await getAllSessions();
        setAllSessions(sessions);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const thisWeekSessions = sessions.filter((s) => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= weekStart;
        });
        setWeekSessions(thisWeekSessions.length);

        // Streak
        const streak = calculateStreak(sessions);
        setStreakDays(streak);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate calendar data for a month
  const getMonthCalendarData = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Create calendar grid
    const calendar: Array<{
      date: Date | null;
      sessionCount: number;
      isToday: boolean;
      dayOfWeek: number;
    }> = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push({ date: null, sessionCount: 0, isToday: false, dayOfWeek: i });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      // Count sessions for this day
      const daySessions = allSessions.filter((s) => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });

      calendar.push({
        date,
        sessionCount: daySessions.length,
        isToday: date.getTime() === today.getTime(),
        dayOfWeek: date.getDay(),
      });
    }

    return calendar;
  };

  const calendarData = getMonthCalendarData();
  const monthYear = `${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth() + 1}월`;

  // Count total practice days in the month
  const practiceDaysCount = calendarData.filter((c) => c.sessionCount > 0).length;

  const goToPrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCalendarMonth(new Date());
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto bg-white min-h-screen">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-gray-200 rounded-2xl h-48 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto bg-white min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-black">연습 기록</h1>
      </div>

      {/* Stats Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-4 divide-x divide-gray-100 grid grid-cols-3">
        <StatsCard value={totalHours} unit="시간" label="총 연습" />
        <StatsCard value={weekSessions} unit="세션" label="이번 주" />
        <StatsCard value={streakDays} unit="일" label="연속" />
      </div>

      {/* Monthly Calendar */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-lg">{monthYear}</span>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-amber-400">✓</span>
              <span className="text-white font-medium">{practiceDaysCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={goToNextMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
            {(calendarMonth.getMonth() !== today.getMonth() || calendarMonth.getFullYear() !== today.getFullYear()) && (
              <button
                onClick={goToToday}
                className="px-3 py-1.5 bg-gray-700 text-white text-xs font-medium rounded-full hover:bg-gray-600"
              >
                월
              </button>
            )}
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((name, idx) => (
            <div
              key={name}
              className={`text-center text-xs font-medium ${
                idx === 0 ? "text-red-400" : idx === 6 ? "text-blue-400" : "text-gray-400"
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarData.map((cell, idx) => (
            <div key={idx} className="flex flex-col items-center">
              {cell.date ? (
                <>
                  {/* Clover Shape Cell */}
                  <div
                    className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${
                      cell.sessionCount > 0
                        ? "bg-amber-200"
                        : "bg-gray-700"
                    }`}
                  >
                    {cell.sessionCount > 0 ? (
                      cell.sessionCount === 1 ? (
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      ) : (
                        <span className="text-gray-800 font-bold text-sm">{cell.sessionCount}</span>
                      )
                    ) : null}
                  </div>
                  {/* Date Number */}
                  <span
                    className={`text-xs mt-1 font-medium ${
                      cell.isToday
                        ? "bg-white text-black rounded-full w-6 h-6 flex items-center justify-center"
                        : cell.dayOfWeek === 0
                        ? "text-red-400"
                        : cell.dayOfWeek === 6
                        ? "text-blue-400"
                        : "text-gray-300"
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                </>
              ) : (
                <div className="w-10 h-10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Start Practice Button */}
      <button
        onClick={() => router.push("/practice")}
        className="fixed bottom-24 left-4 right-4 max-w-lg mx-auto py-4 bg-black text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5 fill-white" />
        연습 시작하기
      </button>
    </div>
  );
}
