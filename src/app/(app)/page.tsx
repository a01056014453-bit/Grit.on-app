"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, ChevronRight, BookOpen, Users, GraduationCap } from "lucide-react";
import { StatsCard, QuoteCard, DailyGoal, LiveRankingWidget } from "@/components/app";
import { mockUser, mockStats, getGreeting } from "@/data";
import { getTodayPracticeTime, getPracticeStats, getAllSessions } from "@/lib/db";

export default function HomePage() {
  const greeting = getGreeting();

  // 실제 연습 데이터 상태
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(60);
  const [totalHours, setTotalHours] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPracticeData() {
      try {
        // 오늘의 연습 시간 가져오기
        const todayData = await getTodayPracticeTime();
        const todayPracticeMinutes = Math.round(todayData.practiceTime / 60);
        setTodayMinutes(todayPracticeMinutes);

        // 총 연습 시간 가져오기
        const stats = await getPracticeStats();
        setTotalHours(Math.round(stats.totalPracticeTime / 3600));

        // 이번 주 세션 수 계산
        const allSessions = await getAllSessions();
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const thisWeekSessions = allSessions.filter(s => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= weekStart;
        });
        setWeekSessions(thisWeekSessions.length);

        // 연속 일수 계산
        const streak = calculateStreak(allSessions);
        setStreakDays(streak);

        // localStorage에서 일일 목표 가져오기
        const savedGoal = localStorage.getItem('grit-on-daily-goal');
        if (savedGoal) {
          setDailyGoal(parseInt(savedGoal, 10));
        }
      } catch (error) {
        console.error('Failed to load practice data:', error);
        // 에러 시 mock 데이터 사용
        setTodayMinutes(mockStats.todayMinutes);
        setTotalHours(mockStats.totalHours);
        setWeekSessions(mockStats.weekSessions);
        setStreakDays(mockStats.streakDays);
      } finally {
        setIsLoading(false);
      }
    }

    loadPracticeData();
  }, []);

  // 연속 일수 계산 함수
  function calculateStreak(sessions: { startTime: Date }[]): number {
    if (sessions.length === 0) return 0;

    // 날짜별로 세션 그룹화
    const dateSet = new Set<string>();
    sessions.forEach(s => {
      const date = new Date(s.startTime);
      date.setHours(0, 0, 0, 0);
      dateSet.add(date.toISOString());
    });

    const dates = Array.from(dateSet).sort().reverse();
    if (dates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // 오늘 또는 어제부터 시작
    let streak = 0;
    let checkDate = new Date(today);

    // 오늘 연습했는지 확인
    if (!dateSet.has(todayStr)) {
      // 어제 연습했는지 확인
      checkDate.setDate(checkDate.getDate() - 1);
      if (!dateSet.has(checkDate.toISOString())) {
        return 0;
      }
    }

    // 연속 일수 계산
    while (dateSet.has(checkDate.toISOString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-black leading-tight">
            {greeting},<br />
            {mockUser.name}님
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            오늘도 훌륭한 연주를 기대해요
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
          <span className="text-lg">🎹</span>
        </div>
      </div>

      {/* Daily Goal - Hero Section */}
      <div className="mb-6">
        <DailyGoal
          completed={isLoading ? 0 : todayMinutes}
          target={dailyGoal}
          onTargetChange={setDailyGoal}
        />
      </div>

      {/* Live Ranking Widget */}
      <div className="mb-6">
        <LiveRankingWidget />
      </div>

      {/* Stats Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6 divide-x divide-gray-100 grid grid-cols-3">
        <StatsCard
          value={isLoading ? 0 : totalHours}
          unit="시간"
          label="총 연습"
        />
        <StatsCard
          value={isLoading ? 0 : weekSessions}
          unit="세션"
          label="이번 주"
        />
        <StatsCard
          value={isLoading ? 0 : streakDays}
          unit="일"
          label="연속"
        />
      </div>

      {/* Quote Card */}
      <div className="mb-6">
        <QuoteCard />
      </div>

      {/* Start Practice Button */}
      <Link
        href="/practice"
        className="flex items-center justify-center gap-3 w-full bg-black text-white rounded-2xl py-4 text-lg font-semibold transition-transform active:scale-[0.98] mb-4"
      >
        <Play className="w-6 h-6 fill-white" />
        <span>연습 시작하기</span>
      </Link>

      {/* Feature Cards */}
      <div className="space-y-3 mb-8">
        {/* Music Terms Search Card */}
        <Link
          href="/music-terms"
          className="flex items-center gap-4 w-full bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-gray-700" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-black text-sm">음악용어 검색</p>
            <p className="text-xs text-gray-500">악보 기호와 용어 뜻 알아보기</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        {/* Teachers Card */}
        <Link
          href="/teachers"
          className="flex items-center gap-4 w-full bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-gray-700" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-black text-sm">원포인트 레슨</p>
            <p className="text-xs text-gray-500">최고 전문가의 시선으로 막힌 구간의 해법을 제시합니다</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        {/* Exam Room Card */}
        <Link
          href="/rooms"
          className="flex items-center gap-4 w-full bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-gray-700" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-black text-sm">입시룸</p>
            <p className="text-xs text-gray-500">영상을 올리고 다른 학생들의 연습을 참고하세요</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

    </div>
  );
}
