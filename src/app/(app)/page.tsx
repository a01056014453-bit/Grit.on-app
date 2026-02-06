import Link from "next/link";
import { Clock, Calendar, TrendingUp, Play, Zap, Music2, Circle, Sparkles, ChevronRight, BookOpen, Timer } from "lucide-react";
import { StatsCard, QuoteCard, DailyGoal } from "@/components/app";
import { mockDrillCards, mockUser, mockStats, hasAIAnalysis, getGreeting, getTotalPlanMinutes, groupDrillsBySong, mockSongs } from "@/data";

const totalPlanMinutes = getTotalPlanMinutes(mockDrillCards);
const groupedDrills = groupDrillsBySong(mockDrillCards);

export default function HomePage() {
  const greeting = getGreeting();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground leading-tight">
            {greeting},<br />
            <span className="text-primary">{mockUser.name}</span>님
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            오늘도 훌륭한 연주를 기대해요
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-secondary border-2 border-background shadow-soft flex items-center justify-center overflow-hidden">
            <span className="text-lg">🎹</span>
        </div>
      </div>

      {/* Daily Goal - Hero Section */}
      <div className="mb-6">
        <DailyGoal
          completed={mockStats.todayMinutes}
          target={mockStats.dailyGoal}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatsCard
          icon={Clock}
          value={mockStats.totalHours}
          unit="시간"
          label="총 연습"
        />
        <StatsCard
          icon={Calendar}
          value={mockStats.weekSessions}
          unit="세션"
          label="이번 주"
        />
        <StatsCard
          icon={TrendingUp}
          value={mockStats.streakDays}
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
        className="group relative flex items-center justify-center gap-3 w-full bg-gradient-to-r from-primary to-violet-600 text-primary-foreground rounded-2xl py-4 text-lg font-bold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/50 mb-4 overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-2xl" />
        <Play className="w-6 h-6 fill-white" />
        <span className="relative">연습 시작하기</span>
      </Link>

      {/* Feature Cards */}
      <div className="space-y-3 mb-8">
        {/* AI Song Analysis Card */}
        <Link
          href="/analysis"
          className="flex items-center gap-4 w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">AI 곡 분석하기</p>
            <p className="text-xs text-muted-foreground">작품 정보와 연주 가이드 확인하기</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>

        {/* Music Terms Search Card */}
        <Link
          href="/music-terms"
          className="flex items-center gap-4 w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">음악용어 검색</p>
            <p className="text-xs text-muted-foreground">악보 기호와 용어 뜻 알아보기</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>

        {/* Metronome Card */}
        <Link
          href="/metronome"
          className="flex items-center gap-4 w-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">메트로놈</p>
            <p className="text-xs text-muted-foreground">정확한 템포로 연습하기</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Today's Practice Plan - Grouped by Song */}
      {hasAIAnalysis && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">오늘의 연습 플랜</h3>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {totalPlanMinutes}분
              </span>
            </div>
            <Link href="/plans" className="text-xs font-medium text-primary hover:text-primary/80">
              전체 보기 &rarr;
            </Link>
          </div>

          {/* 곡별 체크리스트 */}
          <div className="space-y-3">
            {groupedDrills.map((group) => (
              <div
                key={group.song}
                className="rounded-xl bg-card border border-border overflow-hidden"
              >
                {/* 곡 헤더 - 탭하면 곡 정보 페이지로 */}
                <Link
                  href={`/songs/${mockSongs.find((s) => s.title === group.song)?.id || "1"}`}
                  className="flex items-center gap-3 px-4 py-3 bg-secondary/50 border-b border-border hover:bg-secondary/70 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Music2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{group.song}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.drills.length}개 항목 · {group.totalDuration}분
                    </p>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </Link>

                {/* 드릴 체크리스트 */}
                <div className="divide-y divide-border">
                  {group.drills.map((drill) => (
                    <Link
                      key={drill.id}
                      href={`/practice?type=partial&measures=${drill.measures}&tempo=${drill.tempo}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors active:bg-secondary/50"
                    >
                      {/* 체크 아이콘 */}
                      <Circle className="w-5 h-5 text-muted-foreground/50 shrink-0" />

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{drill.title}</p>
                          <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded shrink-0">
                            {drill.recurrence}회
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{drill.measures}</p>
                      </div>

                      {/* 템포 & 시간 */}
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-foreground">♩={drill.tempo}</p>
                        <p className="text-[10px] text-muted-foreground">{drill.duration}분</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 시간 캡 안내 */}
          <p className="text-xs text-muted-foreground text-center mt-3">
            과부하 방지를 위해 {totalPlanMinutes}분 이내로 구성됨
          </p>
        </div>
      )}

    </div>
  );
}