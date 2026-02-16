"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Play, ChevronRight, ChevronLeft, Search, Users, GraduationCap, Music, Clock, Calendar, Mic, Check } from "lucide-react";
import { StatsCard, DailyGoal } from "@/components/app";
import { TodayDrillList } from "@/components/practice";
import { mockUser, mockStats, getGreeting, mockDrillCards } from "@/data";
import { getTodayPracticeTime, getPracticeStats, clearAllSessions, type PracticeSession } from "@/lib/db";
import { syncPracticeSessions } from "@/lib/sync-practice";
import { usePracticeSessions } from "@/hooks/usePracticeSessions";
import { formatTime } from "@/lib/format";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { TeacherDashboard } from "@/components/teacher";

export default function HomePage() {
  const { isTeacher, teacherMode, teacherProfileId, toggleMode } = useTeacherMode();

  // TODO: 목데이터 클리어 (1회 실행 후 제거)
  useEffect(() => { clearAllSessions(); }, []);

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
  const { sessions: allSessions, sessionsByDate, isLoading: sessionsLoading, reload: reloadSessions } = usePracticeSessions();

  const [todayMinutes, setTodayMinutes] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(60);
  const [totalHours, setTotalHours] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

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

  const selectedDateSessions = useMemo(() => {
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return (sessionsByDate[key] || []).sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [selectedDate, sessionsByDate]);

  const practiceDaysInMonth = useMemo(() => {
    const days = new Set<number>();
    allSessions.forEach(s => {
      const d = new Date(s.startTime);
      if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
        days.add(d.getDate());
      }
    });
    return days.size;
  }, [allSessions, calendarMonth, calendarYear]);

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const today = new Date();

  const navigateMonth = (direction: number) => {
    let newMonth = calendarMonth + direction;
    let newYear = calendarYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
  };

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const calIsSelectedToday = selectedDate.getFullYear() === today.getFullYear() && selectedDate.getMonth() === today.getMonth() && selectedDate.getDate() === today.getDate();
  const totalDrillCount = mockDrillCards.length;

  // 선생님 모드일 때 대시보드 렌더링
  if (isTeacher && teacherMode) {
    return <TeacherDashboard teacherProfileId={teacherProfileId || "t8"} onToggleMode={toggleMode} />;
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-sm ring-2 ring-white/50">
            <span className="text-lg">🎹</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {greeting} <span className="bg-gradient-to-r from-violet-700 to-violet-400 bg-clip-text text-transparent">{userName}</span>님 {(() => {
                const h = new Date().getHours();
                if (h < 7) return "🌙";
                if (h < 12) return "☀️";
                if (h < 18) return "🌤️";
                return "🌙";
              })()}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {dailyMessage}
            </p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-sm border border-white/40">
          <span className="text-base">🔔</span>
        </button>
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

      {/* Feature Cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link
          href="/music-terms"
          className="flex flex-col items-center bg-white/60 backdrop-blur-lg rounded-2xl p-3 pt-4 hover:bg-white/80 transition-all shadow-sm border border-white/70"
        >
          <div className="w-11 h-11 rounded-full bg-violet-100/70 flex items-center justify-center mb-2 shrink-0">
            <Search className="w-5 h-5 text-violet-600" />
          </div>
          <p className="font-semibold text-gray-900 text-xs text-center">음악용어 검색</p>
          <p className="text-[10px] text-gray-500 text-center mt-0.5 leading-tight line-clamp-2">악보 기호와 용어 뜻 알아보기</p>
        </Link>

        <Link
          href="/teachers"
          className="flex flex-col items-center bg-white/60 backdrop-blur-lg rounded-2xl p-3 pt-4 hover:bg-white/80 transition-all shadow-sm border border-white/70"
        >
          <div className="w-11 h-11 rounded-full bg-violet-100/70 flex items-center justify-center mb-2 shrink-0">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <p className="font-semibold text-gray-900 text-xs text-center">원포인트 레슨</p>
          <p className="text-[10px] text-gray-500 text-center mt-0.5 leading-tight line-clamp-2">최고 전문가의 시선으로 막힌 구간의 해법을 제시합니다</p>
        </Link>

        <Link
          href="/rooms"
          className="flex flex-col items-center bg-white/60 backdrop-blur-lg rounded-2xl p-3 pt-4 hover:bg-white/80 transition-all shadow-sm border border-white/70"
        >
          <div className="w-11 h-11 rounded-full bg-violet-100/70 flex items-center justify-center mb-2 shrink-0">
            <GraduationCap className="w-5 h-5 text-violet-600" />
          </div>
          <p className="font-semibold text-gray-900 text-xs text-center">입시룸</p>
          <p className="text-[10px] text-gray-500 text-center mt-0.5 leading-tight line-clamp-2">영상을 올리고 다른 학생들의 연습을 참고하세요</p>
        </Link>
      </div>

      {/* Practice Records - Calendar + List */}
      <div className="mb-8">
        <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100 px-3.5 py-1 rounded-full mb-3">연습 기록</span>

        {/* Calendar */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 p-4 shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">
                {calendarYear}년 {calendarMonth + 1}월
              </span>
              {practiceDaysInMonth > 0 && (
                <span className="flex items-center gap-1 text-sm text-violet-600 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  {practiceDaysInMonth}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((day, i) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-1 ${
                  i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDayOfMonth).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center py-0.5">
                <div className="w-8 h-8" />
                <span className="text-[10px] h-4" />
              </div>
            ))}

            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const key = `${calendarYear}-${calendarMonth}-${day}`;
              const count = sessionsByDate[key]?.length || 0;
              const isToday = day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
              const isSelected = day === selectedDate.getDate() && calendarMonth === selectedDate.getMonth() && calendarYear === selectedDate.getFullYear();
              const dayOfWeek = (firstDayOfMonth + i) % 7;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(new Date(calendarYear, calendarMonth, day))}
                  className="flex flex-col items-center py-0.5"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                      isToday
                        ? "bg-violet-700 text-white"
                        : count > 0
                        ? "bg-violet-200 text-violet-700"
                        : "bg-violet-100"
                    } ${isSelected && !isToday ? "ring-2 ring-violet-400" : ""}`}
                  >
                    {count > 0 ? count : ""}
                  </div>
                  <span className={`text-[10px] mt-0.5 ${
                    dayOfWeek === 0 ? "text-red-400" : dayOfWeek === 6 ? "text-blue-400" : "text-gray-500"
                  }`}>
                    {day}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 선택된 날짜 상세 - 캘린더 안에 포함 */}
          <div className="mt-8 pt-5 border-t border-white/40">
            <h4 className="text-base font-bold text-gray-900">{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 {weekdayNames[selectedDate.getDay()]}</h4>
            {calIsSelectedToday ? (
              <p className="text-sm text-gray-500 mt-0.5">{totalDrillCount}개 연습 · {selectedDateSessions.length}개 녹음</p>
            ) : selectedDateSessions.length > 0 ? (
              <p className="text-sm text-gray-500 mt-0.5">{selectedDateSessions.length}개 녹음</p>
            ) : (
              <p className="text-sm text-gray-400 mt-0.5">연습 기록이 없습니다</p>
            )}

            {/* 드릴 완료 기록 */}
            <div className="mt-3">
              <TodayDrillList showPlayButton={false} date={selectedDate} completedOnly onSessionSaved={reloadSessions} />
            </div>

            {/* 연습 세션 */}
            {selectedDateSessions.length > 0 && (
              <p className="text-xs text-gray-500 font-medium mt-3 mb-2">연습 세션</p>
            )}
            {selectedDateSessions.length === 0 && !calIsSelectedToday ? (
              <div className="text-center py-6 bg-white/30 backdrop-blur-sm rounded-2xl mt-3 border border-white/40">
                <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Mic className="w-5 h-5 text-violet-300" />
                </div>
                <p className="text-sm text-gray-500">이 날은 연습 기록이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {selectedDateSessions.map((session) => {
                  const d = new Date(session.startTime);
                  const h = d.getHours();
                  const ampm = h < 12 ? "오전" : "오후";
                  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                  const timeStr = `${ampm} ${h12.toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                  return (
                    <Link key={session.id} href={`/recordings/${session.id}`} className="flex items-center gap-3 bg-white/30 backdrop-blur-sm rounded-2xl p-3 hover:bg-white/50 transition-all active:scale-[0.99] border border-white/40">
                      <div className="w-9 h-9 bg-violet-100/60 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{session.pieceName}</h4>
                        {session.todoNote && <p className="text-xs text-gray-500 truncate mt-0.5">{session.todoNote}</p>}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" />{formatTime(session.practiceTime)}</span>
                          {session.audioBlob && <span className="text-xs text-green-600 font-medium">녹음</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0"><Calendar className="w-3 h-3" />{timeStr}</div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
