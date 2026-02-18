"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Search, Users, GraduationCap, Check, Bell, BookOpen } from "lucide-react";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { StatsCard, DailyGoal } from "@/components/app";
import { mockUser, mockStats, getGreeting } from "@/data";
import { getTodayPracticeTime, getPracticeStats, seedMockSessions } from "@/lib/db";
import { syncPracticeSessions } from "@/lib/sync-practice";
import { usePracticeSessions } from "@/hooks/usePracticeSessions";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { getUnreadCount } from "@/lib/notification-store";
import { TeacherDashboard } from "@/components/teacher";

export default function HomePage() {
  const { isTeacher, teacherMode, teacherProfileId, toggleMode } = useTeacherMode();

  // 목데이터 시드 (DB 비어있을 때만)
  useEffect(() => { seedMockSessions().catch(console.error); }, []);

  // Sync practice sessions to Supabase on load + tab visibility change
  useEffect(() => {
    syncPracticeSessions().catch(console.error);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncPracticeSessions().catch(console.error);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const greeting = getGreeting();

  // 하루에 한 번 바뀌는 인사 멘트
  const dailyMessages = [
    "오늘도 훌륭한 연주를 기대해요",
    "꾸준한 연습이 실력을 만들어요",
    "오늘의 연습이 내일의 무대가 돼요",
    "한 마디씩, 천천히 완성해 봐요",
    "음악은 매일의 작은 노력에서 시작돼요",
    "오늘도 건반 위에서 빛나는 하루 되세요",
    "연습은 거짓말하지 않아요",
    "좋은 연주는 좋은 습관에서 나와요",
    "오늘 연습한 만큼 성장하고 있어요",
    "한 소절의 집중이 큰 차이를 만들어요",
    "음악과 함께하는 오늘도 특별해요",
    "느리더라도 정확하게, 그게 비결이에요",
    "어제보다 한 걸음 더 나아가 봐요",
    "당신의 음악이 세상을 따뜻하게 해요",
    "포기하지 않는 연습이 가장 아름다워요",
    "오늘의 실수는 내일의 성장이에요",
    "매일 조금씩, 그게 프로의 비밀이에요",
    "건반 위의 시간이 가장 값진 시간이에요",
    "음악은 영혼의 언어, 오늘도 대화해 봐요",
    "연습실에서 보내는 시간이 빛날 거예요",
    "완벽보다 꾸준함이 중요해요",
    "오늘 하루도 음악과 함께 행복하세요",
    "작은 진보가 모여 큰 변화가 돼요",
    "집중의 10분이 흘려보내는 1시간보다 나아요",
    "당신만의 소리를 찾아가는 여정을 응원해요",
    "쉬는 것도 연습의 일부예요, 무리하지 마세요",
    "오늘 연습이 미래의 자신에게 보내는 선물이에요",
    "한 음 한 음에 마음을 담아 보세요",
    "끊임없이 도전하는 당신이 멋져요",
    "음악이 있어 오늘도 풍요로운 하루예요",
    "연습의 즐거움을 느끼는 하루 되세요",
  ];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyMessage = dailyMessages[dayOfYear % dailyMessages.length];

  // 프로필 닉네임 (localStorage에서 읽기)
  const [userName, setUserName] = useState(() => {
    if (typeof window === "undefined") return mockUser.name;
    try {
      const saved = localStorage.getItem("grit-on-profile");
      if (saved) {
        const profile = JSON.parse(saved);
        if (profile.nickname) return profile.nickname;
      }
    } catch {}
    return mockUser.name;
  });

  // 공유 훅으로 세션 데이터 로드 (연습 페이지와 동일 데이터 소스)
  const { sessions: allSessions, isLoading: sessionsLoading } = usePracticeSessions();

  const [todayMinutes, setTodayMinutes] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(60);
  const [totalHours, setTotalHours] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    setNotifCount(getUnreadCount());
  }, []);

  // 세션 데이터에서 통계 계산
  useEffect(() => {
    if (sessionsLoading) return;

    async function loadStats() {
      try {
        const todayData = await getTodayPracticeTime();
        setTodayMinutes(Math.round(todayData.practiceTime / 60));

        const stats = await getPracticeStats();
        setTotalHours(Math.round(stats.totalPracticeTime / 3600));

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        setWeekSessions(allSessions.filter(s => new Date(s.startTime) >= weekStart).length);
        setStreakDays(calculateStreak(allSessions));

        const savedGoal = localStorage.getItem('grit-on-daily-goal');
        if (savedGoal) setDailyGoal(parseInt(savedGoal, 10));
      } catch (error) {
        console.error('Failed to load practice data:', error);
        setTodayMinutes(mockStats.todayMinutes);
        setTotalHours(mockStats.totalHours);
        setWeekSessions(mockStats.weekSessions);
        setStreakDays(mockStats.streakDays);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [allSessions, sessionsLoading]);

  // 연속 일수 계산 함수
  function calculateStreak(sessions: { startTime: Date }[]): number {
    if (sessions.length === 0) return 0;
    const dateSet = new Set<string>();
    sessions.forEach(s => {
      const date = new Date(s.startTime);
      date.setHours(0, 0, 0, 0);
      dateSet.add(date.toISOString());
    });
    if (dateSet.size === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let checkDate = new Date(today);

    if (!dateSet.has(checkDate.toISOString())) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (!dateSet.has(checkDate.toISOString())) return 0;
    }
    while (dateSet.has(checkDate.toISOString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }

  // 선생님 모드일 때 대시보드 렌더링
  if (isTeacher && teacherMode) {
    return <TeacherDashboard teacherProfileId={teacherProfileId || "t8"} onToggleMode={toggleMode} />;
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div>
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
              {greeting} <span className="bg-gradient-to-r from-violet-700 to-violet-400 bg-clip-text text-transparent">{userName}</span>님 {(() => {
                const h = new Date().getHours();
                if (h < 7) return "🌙";
                if (h < 12) return "☀️";
                if (h < 18) return "🌤️";
                return "🌙";
              })()}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {dailyMessage}
            </p>
          </div>
        </div>
        <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-sm border border-white/40">
          <Bell className="w-5 h-5 text-gray-700" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </Link>
      </div>

      {/* Daily Goal - Hero Section */}
      <div className="mb-6">
        <DailyGoal
          completed={isLoading ? 0 : todayMinutes}
          target={dailyGoal}
          onTargetChange={setDailyGoal}
        />
      </div>

      {/* Stats Grid */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl mb-6 divide-x divide-white/30 grid grid-cols-3 shadow-sm border border-white/50">
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

      {/* Start Practice Button */}
      <Link
        href="/practice"
        className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-violet-500 to-violet-900 text-white rounded-2xl py-4 text-lg font-semibold shadow-lg shadow-violet-500/25 transition-transform active:scale-[0.98] mb-4"
      >
        <Play className="w-6 h-6 fill-white" />
        <span>연습 시작하기</span>
      </Link>

      {/* Feature Bento Grid */}
      <BentoGrid className="mb-8">
        <BentoCard
          Icon={Search}
          name="음악용어 검색"
          description="악보 기호와 용어 뜻 알아보기"
          href="/music-terms"
          cta="검색하기"
          className="col-span-2 min-h-[110px]"
          background={
            <div className="absolute top-3 right-2 opacity-30 select-none pointer-events-none">
              <div className="bg-violet-200 rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-bold text-gray-900">Dolce</span>
                <span className="text-[10px] text-violet-700 ml-1 font-semibold">돌체</span>
              </div>
            </div>
          }
        />
        <BentoCard
          Icon={Users}
          name="원포인트 레슨"
          description="전문가의 시선으로 막힌 구간의 해법을 제시합니다"
          href="/teachers"
          cta="선생님 찾기"
          className="col-span-3 min-h-[110px]"
          background={
            <div className="absolute inset-0 select-none">
              {/* 악보 오선지 배경 */}
              <div className="absolute top-4 left-3 right-3 flex flex-col gap-[6px] opacity-[0.06] pointer-events-none">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="flex flex-col gap-[2px]">
                    {[0, 1, 2, 3, 4].map((line) => (
                      <div key={line} className="h-[1px] bg-gray-900 w-full" />
                    ))}
                  </div>
                ))}
              </div>
              {/* 선생님 이모지 아바타 */}
              <div className="absolute top-3 right-3 flex -space-x-1.5 opacity-30 group-hover:opacity-40 transition-opacity pointer-events-none">
                {["👩‍🏫", "👨‍🎓", "🧑‍🎤", "👩‍🎨"].map((emoji, i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-white/80 border-2 border-white/60 flex items-center justify-center text-base shadow-sm">
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          }
        />
        <BentoCard
          Icon={BookOpen}
          name="연습 기록"
          description="나의 연습 기록을 한눈에"
          href="/practice#practice-records"
          cta="기록 보기"
          className="col-span-3 min-h-[110px]"
          background={
            <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-30 transition-opacity select-none pointer-events-none">
              <div className="bg-white/60 rounded-lg p-2 shadow-sm border border-white/40">
                <div className="text-[8px] font-bold text-gray-700 text-center mb-1">2월 2026</div>
                <div className="grid grid-cols-7 gap-x-[5px] gap-y-[3px] text-[7px] text-gray-400 text-center mb-0.5">
                  {["일","월","화","수","목","금","토"].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-x-[5px] gap-y-[2px] text-[7px] text-center">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const day = i + 1;
                    const practiced = [2, 3, 5, 7, 9, 10, 11, 12, 14, 15, 16].includes(day);
                    return (
                      <div key={i} className="relative flex items-center justify-center w-4 h-4">
                        <span className={practiced ? "text-violet-700 font-bold" : "text-gray-400"}>{day}</span>
                        {practiced && (
                          <Check className="absolute -top-0.5 -right-0.5 w-2 h-2 text-violet-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          }
        />
        <BentoCard
          Icon={GraduationCap}
          name="입시룸"
          description="다른 학생들의 연습을 참고하세요"
          href="/rooms"
          cta="입장하기"
          className="col-span-2 min-h-[110px]"
          background={
            <div className="absolute top-3 right-3 opacity-15 group-hover:opacity-25 transition-opacity select-none pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-violet-200 flex items-center justify-center">
                <Play className="w-6 h-6 text-violet-600 fill-violet-600 ml-0.5" />
              </div>
            </div>
          }
        />
      </BentoGrid>



    </div>
  );
}
