"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Play, ChevronRight, ChevronLeft, Search, Users, GraduationCap, Music, Clock, Calendar, Mic, Check } from "lucide-react";
import { StatsCard, DailyGoal } from "@/components/app";
import { mockUser, mockStats, getGreeting } from "@/data";
import { getTodayPracticeTime, getPracticeStats, getAllSessions, PracticeSession } from "@/lib/db";
import { formatTime } from "@/lib/format";

export default function HomePage() {
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

  // 실제 연습 데이터 상태
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(60);
  const [totalHours, setTotalHours] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);
  const [allSessionsState, setAllSessionsState] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

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

        // 전체 세션 저장 (달력용)
        setAllSessionsState(allSessions);

        // 최근 연습 기록 (최신 5개)
        const sorted = [...allSessions].sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        setRecentSessions(sorted.slice(0, 5));

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

  // Calendar data computations
  const sessionsByDate = useMemo(() => {
    const map: Record<string, PracticeSession[]> = {};
    allSessionsState.forEach(s => {
      const d = new Date(s.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [allSessionsState]);

  const selectedDateSessions = useMemo(() => {
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return (sessionsByDate[key] || []).sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [selectedDate, sessionsByDate]);

  const practiceDaysInMonth = useMemo(() => {
    const days = new Set<number>();
    allSessionsState.forEach(s => {
      const d = new Date(s.startTime);
      if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
        days.add(d.getDate());
      }
    });
    return days.size;
  }, [allSessionsState, calendarMonth, calendarYear]);

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
            {dailyMessage}
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
          className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-2xl p-3 pt-4 hover:bg-gray-100 transition-colors"
        >
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center mb-2 shrink-0">
            <Search className="w-5 h-5 text-violet-600" />
          </div>
          <p className="font-semibold text-black text-xs text-center">음악용어 검색</p>
          <p className="text-[10px] text-gray-400 text-center mt-0.5 leading-tight line-clamp-2">악보 기호와 용어 뜻 알아보기</p>
        </Link>

        <Link
          href="/teachers"
          className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-2xl p-3 pt-4 hover:bg-gray-100 transition-colors"
        >
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center mb-2 shrink-0">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <p className="font-semibold text-black text-xs text-center">원포인트 레슨</p>
          <p className="text-[10px] text-gray-400 text-center mt-0.5 leading-tight line-clamp-2">최고 전문가의 시선으로 막힌 구간의 해법을 제시합니다</p>
        </Link>

        <Link
          href="/rooms"
          className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-2xl p-3 pt-4 hover:bg-gray-100 transition-colors"
        >
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center mb-2 shrink-0">
            <GraduationCap className="w-5 h-5 text-violet-600" />
          </div>
          <p className="font-semibold text-black text-xs text-center">입시룸</p>
          <p className="text-[10px] text-gray-400 text-center mt-0.5 leading-tight line-clamp-2">영상을 올리고 다른 학생들의 연습을 참고하세요</p>
        </Link>
      </div>

      {/* Practice Records - Calendar + List */}
      <div className="mb-8">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900">연습 기록</h2>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">
                {calendarYear}년 {calendarMonth + 1}월
              </span>
              {practiceDaysInMonth > 0 && (
                <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
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
                        ? "bg-black text-white"
                        : count > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-50"
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
        </div>

        {/* Selected Date Header */}
        <div className="mb-3 border-t border-gray-100 pt-4">
          <h3 className="text-base font-bold text-gray-900">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 {weekdayNames[selectedDate.getDay()]}
          </h3>
          {selectedDateSessions.length > 0 ? (
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedDateSessions.length}개 세션
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-0.5">연습 기록이 없습니다</p>
          )}
        </div>

        {/* Selected Date Sessions */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : selectedDateSessions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mic className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1">이 날은 연습 기록이 없습니다</p>
            <p className="text-xs text-gray-400">연습을 시작하면 여기에 표시됩니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateSessions.map((session) => {
              const d = new Date(session.startTime);
              const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

              return (
                <Link
                  key={session.id}
                  href={`/recordings/${session.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-gray-100 hover:border-violet-200 transition-all active:scale-[0.99]"
                >
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {session.pieceName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatTime(session.practiceTime)}
                      </span>
                      {session.audioBlob && (
                        <span className="text-xs text-green-600 font-medium">
                          녹음
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                    <Calendar className="w-3 h-3" />
                    {timeStr}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
