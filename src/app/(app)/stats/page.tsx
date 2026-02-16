"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, Flame, Calendar, Clock, Target, TrendingUp,
  BarChart3, ArrowUp, ArrowDown, Award, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { getAllSessions, savePracticeSession, clearAllSessions, type PracticeSession } from "@/lib/db";
import { RefreshCw } from "lucide-react";

type TabType = "weekly" | "monthly";

// Blur-in text animation (per character)
const charVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  show: (i: number) => ({
    opacity: 1,
    filter: "blur(0px)",
    transition: { delay: i * 0.04, duration: 0.4, ease: "easeOut" },
  }),
};

// 샘플 데이터 생성 함수
async function generateSampleData(): Promise<void> {
  const pieces = [
    { name: "F. Chopin Ballade Op.23 No.1", composer: "Chopin" },
    { name: "L.v. Beethoven Sonata Op.13 Pathétique", composer: "Beethoven" },
    { name: "C. Debussy Clair de Lune", composer: "Debussy" },
    { name: "F. Liszt La Campanella", composer: "Liszt" },
    { name: "J.S. Bach Invention No.1", composer: "Bach" },
  ];

  const today = new Date();

  for (let daysAgo = 0; daysAgo < 45; daysAgo++) {
    if (Math.random() > 0.3) {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);

      const sessionsCount = Math.floor(Math.random() * 3) + 1;

      for (let s = 0; s < sessionsCount; s++) {
        const piece = pieces[Math.floor(Math.random() * pieces.length)];
        const startHour = 9 + Math.floor(Math.random() * 12);

        const startTime = new Date(date);
        startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);

        const totalMinutes = 15 + Math.floor(Math.random() * 60);
        const concentration = 0.5 + Math.random() * 0.4;

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + totalMinutes);

        await savePracticeSession({
          pieceId: piece.name.toLowerCase().replace(/\s/g, "-"),
          pieceName: piece.name,
          composer: piece.composer,
          startTime,
          endTime,
          totalTime: totalMinutes * 60,
          practiceTime: Math.round(totalMinutes * 60 * concentration),
          synced: false,
          practiceType: ["partial", "routine", "runthrough"][Math.floor(Math.random() * 3)] as "partial" | "routine" | "runthrough",
        });
      }
    }
  }
}

// 헬퍼 함수들
function formatMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

function formatTimeDisplay(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  return `${mins}분`;
}

// 연속 연습 일수 계산
function calculateStreak(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0;

  const practiceDays = new Set<string>();
  sessions.forEach(s => {
    const date = new Date(s.startTime);
    practiceDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (practiceDays.has(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function StatsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("weekly");
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const weeklyGoal = 420; // 주간 목표: 7시간 (420분)

  const loadSessions = async () => {
    try {
      let allSessions = await getAllSessions();
      if (allSessions.length === 0) {
        await generateSampleData();
        allSessions = await getAllSessions();
      }
      setSessions(allSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // 샘플 데이터 재생성
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await clearAllSessions();
      await generateSampleData();
      const allSessions = await getAllSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error("Failed to regenerate:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // ============ 주간 데이터 ============
  const weeklyData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const days = ["월", "화", "수", "목", "금", "토", "일"];
    const dailyMinutes: number[] = Array(7).fill(0);

    sessions.forEach(s => {
      const sessionDate = new Date(s.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((sessionDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        dailyMinutes[diffDays] += s.practiceTime;
      }
    });

    const dailyMinutesFormatted = dailyMinutes.map(s => formatMinutes(s));
    const maxMinutes = Math.max(...dailyMinutesFormatted, 60);

    let bestDayIndex = 0;
    let bestDayMinutes = 0;
    dailyMinutesFormatted.forEach((mins, i) => {
      if (mins > bestDayMinutes) {
        bestDayMinutes = mins;
        bestDayIndex = i;
      }
    });

    const totalMinutes = dailyMinutesFormatted.reduce((a, b) => a + b, 0);
    const goalProgress = Math.min(Math.round((totalMinutes / weeklyGoal) * 100), 100);
    const streak = calculateStreak(sessions);
    const practiceDays = dailyMinutesFormatted.filter(m => m > 0).length;

    return {
      days,
      dailyMinutes: dailyMinutesFormatted,
      maxMinutes,
      bestDay: days[bestDayIndex],
      bestDayMinutes,
      totalMinutes,
      goalProgress,
      streak,
      practiceDays,
    };
  }, [sessions, weeklyGoal]);

  // ============ 월간 데이터 ============
  const monthlyData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const dailyData: { [key: number]: number } = {};
    const monthSessions = sessions.filter(s => {
      const d = new Date(s.startTime);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    monthSessions.forEach(s => {
      const day = new Date(s.startTime).getDate();
      dailyData[day] = (dailyData[day] || 0) + s.practiceTime;
    });

    const totalMinutes = formatMinutes(monthSessions.reduce((sum, s) => sum + s.practiceTime, 0));
    const totalSessions = monthSessions.length;
    const practiceDays = Object.keys(dailyData).length;
    const avgDailyMinutes = practiceDays > 0 ? Math.round(totalMinutes / practiceDays) : 0;

    const lastMonth = month === 0 ? 11 : month - 1;
    const lastMonthYear = month === 0 ? year - 1 : year;
    const lastMonthSessions = sessions.filter(s => {
      const d = new Date(s.startTime);
      return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
    });
    const lastMonthMinutes = formatMinutes(lastMonthSessions.reduce((sum, s) => sum + s.practiceTime, 0));

    const growthPercent = lastMonthMinutes > 0
      ? Math.round(((totalMinutes - lastMonthMinutes) / lastMonthMinutes) * 100)
      : totalMinutes > 0 ? 100 : 0;

    return {
      year,
      month: month + 1,
      daysInMonth,
      startWeekday,
      dailyData,
      totalMinutes,
      totalSessions,
      practiceDays,
      avgDailyMinutes,
      lastMonthMinutes,
      growthPercent,
    };
  }, [sessions]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-blob-violet flex items-center justify-center max-w-lg mx-auto">
        <div className="bg-blob-extra" />
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-4 h-4 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      </div>
    );
  }

  const titleText = "연습 통계";

  return (
    <div className="min-h-screen bg-blob-violet px-4 py-6 max-w-lg mx-auto pb-24">
      <div className="bg-blob-extra" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 flex">
            {titleText.split("").map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={charVariants}
                initial="hidden"
                animate="show"
                className={char === " " ? "inline-block w-1.5" : ""}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="text-xs text-gray-500"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            나의 연습 기록을 확인하세요
          </motion.p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isRegenerating ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabs */}
      <motion.div
        className="flex gap-2 mb-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <button
          onClick={() => setActiveTab("weekly")}
          className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === "weekly"
              ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm shadow-violet-500/20"
              : "bg-white/40 backdrop-blur-sm text-gray-500 hover:bg-white/60 border border-white/30"
          }`}
        >
          주간 통계
        </button>
        <button
          onClick={() => setActiveTab("monthly")}
          className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === "monthly"
              ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm shadow-violet-500/20"
              : "bg-white/40 backdrop-blur-sm text-gray-500 hover:bg-white/60 border border-white/30"
          }`}
        >
          월간 통계
        </button>
      </motion.div>

      <div className="space-y-4">
        {activeTab === "weekly" ? (
          <>
            {/* ========== 주간 연습량 바 차트 ========== */}
            <motion.div
              className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <h3 className="font-bold text-gray-900 mb-1">이번 주 연습량</h3>
              <p className="text-xs text-gray-500 mb-4">일별 연습 시간을 확인해보세요</p>

              <div className="flex items-end justify-between gap-2 h-32 mb-3">
                {weeklyData.days.map((day, i) => {
                  const minutes = weeklyData.dailyMinutes[i];
                  const height = weeklyData.maxMinutes > 0
                    ? (minutes / weeklyData.maxMinutes) * 100
                    : 0;
                  const isToday = i === ((new Date().getDay() + 6) % 7);
                  const isBestDay = day === weeklyData.bestDay && minutes > 0;

                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      {minutes > 0 && (
                        <span className="text-[10px] text-gray-500 font-medium">{minutes}분</span>
                      )}
                      <div className="w-full flex flex-col items-center justify-end h-20">
                        <motion.div
                          className={`w-full max-w-7 rounded-t-lg ${
                            isBestDay
                              ? "bg-gradient-to-t from-violet-600 to-purple-400"
                              : minutes > 0
                              ? "bg-violet-300/80"
                              : "bg-white/40"
                          }`}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(height, minutes > 0 ? 8 : 2)}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        isToday ? "text-violet-600" : "text-gray-400"
                      }`}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* ========== 연습 집중 요일 인사이트 ========== */}
            {weeklyData.bestDayMinutes > 0 && (
              <motion.div
                className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-violet-500/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">이번 주는 {weeklyData.bestDay}요일에 가장 오래 연습했어요!</p>
                    <p className="text-sm text-white/80 mt-0.5">{weeklyData.bestDayMinutes}분 연습</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========== 주간 목표 달성 현황 ========== */}
            <motion.div
              className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-violet-500" />
                  주간 목표 달성
                </h3>
                <span className="font-number text-2xl font-bold text-violet-600">{weeklyData.goalProgress}%</span>
              </div>

              <div className="h-3 bg-white/50 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-400 to-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${weeklyData.goalProgress}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{formatTimeDisplay(weeklyData.totalMinutes)}</span>
                <span className="text-gray-400">목표: {formatTimeDisplay(weeklyGoal)}</span>
              </div>
            </motion.div>

            {/* ========== 연속 연습 기록 (Streak) ========== */}
            <motion.div
              className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100/80 rounded-xl">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-number text-3xl font-extrabold text-gray-900">{weeklyData.streak}</span>
                    <span className="text-gray-500">일 연속 연습 중</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {weeklyData.streak > 0
                      ? weeklyData.streak >= 7
                        ? "대단해요! 일주일 내내 연습했어요!"
                        : "내일도 이어서 연습해봐요!"
                      : "오늘부터 연속 연습을 시작해보세요!"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ========== 주간 요약 카드 ========== */}
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-4 border border-white/50 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100/70 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-xs text-gray-400">총 연습 시간</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {formatTimeDisplay(weeklyData.totalMinutes)}
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-4 border border-white/50 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-green-100/70 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <span className="text-xs text-gray-400">연습한 날</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {weeklyData.practiceDays}일 <span className="text-sm font-normal text-gray-400">/ 7일</span>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <>
            {/* ========== 월간 캘린더 (Contribution Graph) ========== */}
            <motion.div
              className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">
                  {monthlyData.year}년 {monthlyData.month}월
                </h3>
                {monthlyData.practiceDays > 0 && (
                  <span className="text-xs font-medium text-violet-600 bg-violet-100/60 px-2.5 py-1 rounded-full">
                    {monthlyData.practiceDays}일 연습
                  </span>
                )}
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
                  <div
                    key={day}
                    className={`text-center text-xs font-medium py-1 ${
                      i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array(monthlyData.startWeekday).fill(null).map((_, i) => (
                  <div key={`empty-${i}`} className="flex flex-col items-center py-1">
                    <div className="w-8 h-8 rounded-lg bg-transparent" />
                  </div>
                ))}

                {Array(monthlyData.daysInMonth).fill(null).map((_, i) => {
                  const day = i + 1;
                  const seconds = monthlyData.dailyData[day] || 0;
                  const isToday = day === new Date().getDate();
                  const hasPractice = seconds > 0;

                  const getIntensityClass = () => {
                    if (!hasPractice) return "bg-white/30";
                    const mins = formatMinutes(seconds);
                    if (mins >= 60) return "bg-violet-600 text-white";
                    if (mins >= 30) return "bg-violet-400 text-white";
                    return "bg-violet-200 text-violet-700";
                  };

                  return (
                    <div key={day} className="flex flex-col items-center py-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                          isToday
                            ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-sm shadow-violet-500/30"
                            : getIntensityClass()
                        }`}
                      >
                        {day}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-3 text-[11px] text-gray-400">
                <span>적음</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-white/30" />
                  <div className="w-4 h-4 rounded bg-violet-200" />
                  <div className="w-4 h-4 rounded bg-violet-400" />
                  <div className="w-4 h-4 rounded bg-violet-600" />
                </div>
                <span>많음</span>
              </div>
            </motion.div>

            {/* ========== 월간 총계 리포트 ========== */}
            <motion.div
              className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-500" />
                월간 리포트
              </h3>

              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="text-center p-3 bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50">
                  <div className="font-number text-sm font-bold text-gray-900">
                    {formatTimeDisplay(monthlyData.totalMinutes)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">총 연습 시간</div>
                </div>
                <div className="text-center p-3 bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50">
                  <div className="font-number text-sm font-bold text-gray-900">{monthlyData.totalSessions}</div>
                  <div className="text-[10px] text-gray-400 mt-1">연습 세션</div>
                </div>
                <div className="text-center p-3 bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50">
                  <div className="font-number text-sm font-bold text-gray-900">{monthlyData.avgDailyMinutes}분</div>
                  <div className="text-[10px] text-gray-400 mt-1">일평균</div>
                </div>
              </div>

              {/* 성장 한마디 */}
              <div className={`p-4 rounded-2xl ${
                monthlyData.growthPercent > 0
                  ? "bg-green-100/50 border border-green-200/50"
                  : monthlyData.growthPercent < 0
                  ? "bg-orange-100/50 border border-orange-200/50"
                  : "bg-white/30 border border-white/30"
              }`}>
                <div className="flex items-center gap-2">
                  {monthlyData.growthPercent > 0 ? (
                    <ArrowUp className="w-5 h-5 text-green-600" />
                  ) : monthlyData.growthPercent < 0 ? (
                    <ArrowDown className="w-5 h-5 text-orange-600" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-gray-500" />
                  )}
                  <span className={`font-medium text-sm ${
                    monthlyData.growthPercent > 0
                      ? "text-green-700"
                      : monthlyData.growthPercent < 0
                      ? "text-orange-700"
                      : "text-gray-600"
                  }`}>
                    {monthlyData.growthPercent > 0
                      ? `지난달보다 ${monthlyData.growthPercent}% 더 연습했어요!`
                      : monthlyData.growthPercent < 0
                      ? `지난달보다 ${Math.abs(monthlyData.growthPercent)}% 줄었어요`
                      : "지난달과 비슷한 수준이에요"}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
