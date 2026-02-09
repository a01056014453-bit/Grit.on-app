"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Target, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { ProgressRing, StatsCard } from "@/components/app";
import { getAllSessions, getTodayPracticeTime, getPracticeStats, type PracticeSession } from "@/lib/db";

export default function GoalsPage() {
  const router = useRouter();
  const [dailyGoal, setDailyGoal] = useState(60);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(60);
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
        // Today's practice time
        const todayData = await getTodayPracticeTime();
        setTodayMinutes(Math.round(todayData.practiceTime / 60));

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

        // Daily goal
        const savedGoal = localStorage.getItem("grit-on-daily-goal");
        if (savedGoal) {
          setDailyGoal(parseInt(savedGoal, 10));
          setTempGoal(parseInt(savedGoal, 10));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save goal
  const handleSaveGoal = () => {
    setDailyGoal(tempGoal);
    localStorage.setItem("grit-on-daily-goal", tempGoal.toString());
    setIsEditingGoal(false);
  };

  const progress = Math.min((todayMinutes / dailyGoal) * 100, 100);

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
    const calendar: Array<{ date: Date | null; minutes: number; isToday: boolean }> = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push({ date: null, minutes: 0, isToday: false });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      // Calculate practice minutes for this day
      const daySessions = allSessions.filter((s) => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });

      const minutes = Math.floor(
        daySessions.reduce((sum, s) => sum + s.practiceTime, 0) / 60
      );

      calendar.push({
        date,
        minutes,
        isToday: date.getTime() === today.getTime(),
      });
    }

    return calendar;
  };

  const calendarData = getMonthCalendarData();
  const monthYear = `${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth() + 1}월`;

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
        <h1 className="text-xl font-bold text-black">오늘의 목표</h1>
      </div>

      {/* Goal Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-black">일일 목표</span>
          </div>
          {!isEditingGoal ? (
            <button
              onClick={() => setIsEditingGoal(true)}
              className="text-sm text-gray-500 hover:text-black"
            >
              수정
            </button>
          ) : (
            <button
              onClick={handleSaveGoal}
              className="text-sm font-medium text-black"
            >
              저장
            </button>
          )}
        </div>

        {isEditingGoal ? (
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={10}
              max={180}
              step={10}
              value={tempGoal}
              onChange={(e) => setTempGoal(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
            <span className="text-2xl font-bold text-black w-20 text-right">
              {tempGoal}분
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <ProgressRing progress={progress} size={80} strokeWidth={6} showValue={false} />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-black to-violet-500 bg-clip-text text-transparent">
                  {todayMinutes}
                </span>
                <span className="text-gray-500">/ {dailyGoal}분</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {dailyGoal - todayMinutes > 0
                  ? `${dailyGoal - todayMinutes}분 더 연습하면 목표 달성!`
                  : "목표 달성 완료! 🎉"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-4 divide-x divide-gray-100 grid grid-cols-3">
        <StatsCard value={totalHours} unit="시간" label="총 연습" />
        <StatsCard value={weekSessions} unit="세션" label="이번 주" />
        <StatsCard value={streakDays} unit="일" label="연속" />
      </div>

      {/* Monthly Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-black">{monthYear}</span>
            {(calendarMonth.getMonth() !== today.getMonth() || calendarMonth.getFullYear() !== today.getFullYear()) && (
              <button
                onClick={goToToday}
                className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-full"
              >
                오늘
              </button>
            )}
          </div>
          <button
            onClick={goToNextMonth}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((name) => (
            <div key={name} className="text-center text-[10px] text-gray-400 font-medium">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((cell, idx) => (
            <div key={idx} className="aspect-square flex items-center justify-center">
              {cell.date ? (
                <div
                  className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-xs ${
                    cell.isToday
                      ? "bg-black text-white"
                      : cell.minutes > 0
                      ? "bg-violet-100 text-violet-700"
                      : "bg-gray-50 text-gray-400"
                  }`}
                >
                  <span className={`font-medium ${cell.isToday ? "text-white" : ""}`}>
                    {cell.date.getDate()}
                  </span>
                  {cell.minutes > 0 && (
                    <span className={`text-[9px] ${cell.isToday ? "text-white/80" : "text-violet-500"}`}>
                      {cell.minutes}분
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-violet-100" />
            <span>연습함</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-black" />
            <span>오늘</span>
          </div>
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
