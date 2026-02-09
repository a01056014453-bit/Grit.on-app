"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, ChevronLeft, ChevronRight, Check, X, Clock, Music } from "lucide-react";
import { StatsCard } from "@/components/app";
import { getAllSessions, getPracticeStats, savePracticeSession, type PracticeSession } from "@/lib/db";
import { mockDrillCards, groupDrillsBySong } from "@/data";

interface Drill {
  id: string;
  song: string;
  measures: string;
  title: string;
  mode?: "duration" | "recurrence";
  duration?: number;
  recurrence?: number;
  tempo?: number;
}

interface CompletedDrillsData {
  date: string;
  completedDrillIds: string[];
}

export default function GoalsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [totalHours, setTotalHours] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [allSessions, setAllSessions] = useState<PracticeSession[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // Get sessions for selected date
  const getSessionsForDate = (date: Date) => {
    return allSessions.filter((s) => {
      const sessionDate = new Date(s.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === targetDate.getTime();
    });
  };

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${dayNames[date.getDay()]}요일`;
  };

  // Get practice type label
  const getPracticeTypeLabel = (type?: string) => {
    switch (type) {
      case "runthrough":
        return { label: "전곡 연습", color: "bg-blue-100 text-blue-700" };
      case "partial":
        return { label: "구간 연습", color: "bg-purple-100 text-purple-700" };
      case "routine":
        return { label: "루틴 연습", color: "bg-green-100 text-green-700" };
      default:
        return { label: "연습", color: "bg-gray-100 text-gray-700" };
    }
  };

  // Helper: Format date to YYYY-MM-DD
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Get completed drills for a specific date
  const getCompletedDrillsForDate = (date: Date): Drill[] => {
    const dateKey = formatDateKey(date);

    // Get completed drill IDs
    const completedData = localStorage.getItem(`grit-on-completed-${dateKey}`);
    if (!completedData) return [];

    const parsed: CompletedDrillsData = JSON.parse(completedData);
    const completedIds = new Set(parsed.completedDrillIds || []);

    if (completedIds.size === 0) return [];

    // Get all available drills (mock + custom)
    const mockDrills = groupDrillsBySong(mockDrillCards).flatMap(g => g.drills);
    const customDrillsData = localStorage.getItem("grit-on-custom-drills");
    const customDrills: Drill[] = customDrillsData ? JSON.parse(customDrillsData) : [];

    // Also check for drills saved on that specific date
    const dateDrillsData = localStorage.getItem(`grit-on-drills-${dateKey}`);
    const dateDrills: Drill[] = dateDrillsData ? JSON.parse(dateDrillsData) : [];

    const allDrills = [...mockDrills, ...customDrills, ...dateDrills];

    // Filter to only completed drills
    return allDrills.filter(d => completedIds.has(d.id));
  };

  // Group drills by song name
  const groupDrillsBySongName = (drills: Drill[]) => {
    const grouped: Record<string, Drill[]> = {};
    drills.forEach(drill => {
      if (!grouped[drill.song]) {
        grouped[drill.song] = [];
      }
      grouped[drill.song].push(drill);
    });
    return Object.entries(grouped);
  };

  const selectedDateDrills = selectedDate ? getCompletedDrillsForDate(selectedDate) : [];
  const groupedSelectedDrills = groupDrillsBySongName(selectedDateDrills);

  // Create sample sessions for testing
  const createSampleSessions = async () => {
    const samplePieces = [
      { id: "1", name: "F. Chopin Ballade Op.23 No.1" },
      { id: "2", name: "L. v. Beethoven Sonata Op.13 No.8" },
      { id: "3", name: "J.S. Bach Prelude in C Major" },
    ];

    // Sample drills for each piece
    const sampleDrills: Record<string, Drill[]> = {
      "F. Chopin Ballade Op.23 No.1": [
        { id: "sample-drill-1", song: "F. Chopin Ballade Op.23 No.1", measures: "57-60마디", title: "리듬 흔들림", tempo: 76, recurrence: 4 },
        { id: "sample-drill-2", song: "F. Chopin Ballade Op.23 No.1", measures: "23-26마디", title: "양손 어긋남", tempo: 72, recurrence: 3 },
        { id: "sample-drill-3", song: "F. Chopin Ballade Op.23 No.1", measures: "81-84마디", title: "페달 잔향 겹침", tempo: 80, recurrence: 2 },
      ],
      "L. v. Beethoven Sonata Op.13 No.8": [
        { id: "sample-drill-4", song: "L. v. Beethoven Sonata Op.13 No.8", measures: "33-38마디", title: "다이나믹 부족", tempo: 84, recurrence: 2 },
        { id: "sample-drill-5", song: "L. v. Beethoven Sonata Op.13 No.8", measures: "1-8마디", title: "서주 템포", tempo: 60, recurrence: 3 },
      ],
      "J.S. Bach Prelude in C Major": [
        { id: "sample-drill-6", song: "J.S. Bach Prelude in C Major", measures: "1-16마디", title: "아르페지오 균일성", tempo: 72, recurrence: 5 },
      ],
    };

    // Helper to get date key
    const getDateKey = (daysAgo: number) => {
      const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Save sample drills and completion for 3 days ago
    const threeDaysAgoKey = getDateKey(3);
    const threeDaysDrills = [
      ...sampleDrills["F. Chopin Ballade Op.23 No.1"],
      ...sampleDrills["L. v. Beethoven Sonata Op.13 No.8"],
    ];
    localStorage.setItem(`grit-on-drills-${threeDaysAgoKey}`, JSON.stringify(threeDaysDrills));
    localStorage.setItem(`grit-on-completed-${threeDaysAgoKey}`, JSON.stringify({
      date: threeDaysAgoKey,
      completedDrillIds: threeDaysDrills.map(d => d.id),
    }));

    // Save sample drills for 5 days ago
    const fiveDaysAgoKey = getDateKey(5);
    const fiveDaysDrills = sampleDrills["F. Chopin Ballade Op.23 No.1"];
    localStorage.setItem(`grit-on-drills-${fiveDaysAgoKey}`, JSON.stringify(fiveDaysDrills));
    localStorage.setItem(`grit-on-completed-${fiveDaysAgoKey}`, JSON.stringify({
      date: fiveDaysAgoKey,
      completedDrillIds: fiveDaysDrills.slice(0, 2).map(d => d.id), // Only 2 completed
    }));

    // Save sample drills for yesterday
    const yesterdayKey = getDateKey(1);
    const yesterdayDrills = sampleDrills["J.S. Bach Prelude in C Major"];
    localStorage.setItem(`grit-on-drills-${yesterdayKey}`, JSON.stringify(yesterdayDrills));
    localStorage.setItem(`grit-on-completed-${yesterdayKey}`, JSON.stringify({
      date: yesterdayKey,
      completedDrillIds: yesterdayDrills.map(d => d.id),
    }));

    const sessions = [
      // 5일 전
      {
        pieceId: "1",
        pieceName: samplePieces[0].name,
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
        totalTime: 3600,
        practiceTime: 2700,
        synced: false,
        practiceType: "runthrough" as const,
        label: "연습",
      },
      // 3일 전 - 2개 세션
      {
        pieceId: "2",
        pieceName: samplePieces[1].name,
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000),
        totalTime: 1800,
        practiceTime: 1500,
        synced: false,
        practiceType: "partial" as const,
        label: "연습",
      },
      {
        pieceId: "1",
        pieceName: samplePieces[0].name,
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
        totalTime: 3600,
        practiceTime: 3000,
        synced: false,
        practiceType: "runthrough" as const,
        label: "연습",
      },
      // 어제
      {
        pieceId: "3",
        pieceName: samplePieces[2].name,
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20.75 * 60 * 60 * 1000),
        totalTime: 2700,
        practiceTime: 2400,
        synced: false,
        practiceType: "routine" as const,
        label: "연습",
      },
    ];

    for (const session of sessions) {
      await savePracticeSession(session);
    }

    // Reload data
    const newSessions = await getAllSessions();
    setAllSessions(newSessions);

    const stats = await getPracticeStats();
    setTotalHours(Math.round(stats.totalPracticeTime / 3600));

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeekSessions = newSessions.filter((s) => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= weekStart;
    });
    setWeekSessions(thisWeekSessions.length);
    setStreakDays(calculateStreak(newSessions));
  };

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-black">연습 기록</h1>
        </div>
        <button
          onClick={createSampleSessions}
          className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200"
        >
          샘플 추가
        </button>
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
          <div className="flex items-center gap-3">
            <span className="font-bold text-black text-lg">{monthYear}</span>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-amber-500">✓</span>
              <span className="text-black font-medium">{practiceDaysCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={goToNextMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            {(calendarMonth.getMonth() !== today.getMonth() || calendarMonth.getFullYear() !== today.getFullYear()) && (
              <button
                onClick={goToToday}
                className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded-full hover:bg-gray-800"
              >
                오늘
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
                idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : "text-gray-500"
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarData.map((cell, idx) => {
            const isPastOrToday = cell.date && cell.date.getTime() <= today.getTime();
            return (
              <button
                key={idx}
                className="flex flex-col items-center"
                onClick={() => cell.date && isPastOrToday && setSelectedDate(cell.date)}
                disabled={!cell.date || !isPastOrToday}
              >
                {cell.date ? (
                  <>
                    {/* Clover Shape Cell */}
                    <div
                      className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-transform ${
                        cell.sessionCount > 0
                          ? "bg-amber-200 hover:scale-105 cursor-pointer"
                          : isPastOrToday
                          ? "bg-gray-100 hover:bg-gray-200 cursor-pointer"
                          : "bg-gray-50"
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
                          ? "bg-black text-white rounded-full w-6 h-6 flex items-center justify-center"
                          : cell.dayOfWeek === 0
                          ? "text-red-500"
                          : cell.dayOfWeek === 6
                          ? "text-blue-500"
                          : "text-gray-600"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                  </>
                ) : (
                  <div className="w-10 h-10" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg animate-in slide-in-from-bottom duration-300 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-black text-lg">{formatDateDisplay(selectedDate)}</p>
                <p className="text-sm text-gray-500">
                  {selectedDateDrills.length > 0 && `${selectedDateDrills.length}개 드릴`}
                  {selectedDateDrills.length > 0 && selectedDateSessions.length > 0 && " · "}
                  {selectedDateSessions.length > 0 && `${selectedDateSessions.length}개 세션`}
                  {selectedDateDrills.length === 0 && selectedDateSessions.length === 0 && "기록 없음"}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Completed Drills - Grouped by Song */}
            {groupedSelectedDrills.length > 0 && (
              <div className="space-y-3 mb-4">
                {groupedSelectedDrills.map(([songName, drills]) => (
                  <div key={songName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Song Header */}
                    <div className="px-4 py-3">
                      <p className="font-semibold text-black">{songName}</p>
                    </div>
                    {/* Drills */}
                    <div className="px-4 pb-3 space-y-3">
                      {drills.map((drill) => (
                        <div
                          key={drill.id}
                          className="flex items-center gap-3"
                        >
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
                          </div>
                          <p className="flex-1 text-sm text-gray-500">
                            {drill.measures}
                            {drill.title && ` - ${drill.title}`}
                            {drill.tempo && ` 템포 ${drill.tempo}`}
                            {drill.recurrence ? ` ${drill.recurrence}회` : drill.duration ? ` ${drill.duration}분` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sessions List */}
            {selectedDateSessions.length > 0 && (
              <>
                <p className="text-xs font-medium text-gray-500 mb-2">연습 세션</p>
                <div className="space-y-2">
                  {selectedDateSessions.map((session) => {
                    const typeInfo = getPracticeTypeLabel(session.practiceType);
                    return (
                      <div
                        key={session.id}
                        className="bg-gray-50 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                            <Music className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-black text-sm">{session.pieceName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(session.practiceTime)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(session.startTime).toLocaleTimeString("ko-KR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-green-600">
                              {session.totalTime > 0
                                ? `${Math.round((session.practiceTime / session.totalTime) * 100)}%`
                                : "0%"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Empty State */}
            {groupedSelectedDrills.length === 0 && selectedDateSessions.length === 0 && (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">이 날 연습 기록이 없습니다</p>
              </div>
            )}

            {/* Total Stats */}
            {selectedDateSessions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">총 연습 시간</span>
                  <span className="font-bold text-black">
                    {formatTime(selectedDateSessions.reduce((sum, s) => sum + s.practiceTime, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
