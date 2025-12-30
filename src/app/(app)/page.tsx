import Link from "next/link";
import { Clock, Calendar, TrendingUp, Play } from "lucide-react";
import { StatsCard, QuoteCard, DailyGoal } from "@/components/app";

// Dummy data
const mockStats = {
  totalHours: 0,
  weekSessions: 0,
  streakDays: 0,
  todayMinutes: 0,
  dailyGoal: 60,
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "좋은 오후에요";
  return "좋은 저녁이에요";
}

export default function HomePage() {
  const greeting = getGreeting();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 leading-tight">
            {greeting},<br />
            <span className="text-primary">연습생</span>님
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            오늘도 훌륭한 연주를 기대해요
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-soft flex items-center justify-center overflow-hidden">
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
        className="group relative flex items-center justify-center gap-3 w-full bg-gradient-to-r from-primary to-violet-600 text-white rounded-2xl py-4 text-lg font-bold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/50 mb-8 overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-2xl" />
        <Play className="w-6 h-6 fill-white" />
        <span className="relative">연습 시작하기</span>
      </Link>

      {/* Today's Focus Section - Heatmap Style */}
      <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm mb-24">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              오늘의 집중 구간
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              AI가 분석한 취약 소절
            </p>
          </div>
          <button className="text-xs font-medium text-primary hover:text-primary/80">
            전체 분석 &rarr;
          </button>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-8 gap-1.5 mb-4">
            {[...Array(32)].map((_, i) => {
               // Simulate some data
               const isHigh = [2, 5, 18, 29].includes(i);
               const isMid = [6, 11, 15, 22].includes(i);
               const isLow = [8, 9, 25].includes(i);
               
               let bgClass = "bg-slate-50";
               if (isHigh) bgClass = "bg-orange-500";
               else if (isMid) bgClass = "bg-amber-400";
               else if (isLow) bgClass = "bg-blue-400";
               
               return (
                <div
                  key={i}
                  className={`aspect-square rounded-md ${bgClass} transition-all hover:scale-110 hover:shadow-sm`}
                  title={`소절 ${i + 1}`}
                />
               );
            })}
          </div>
          
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>집중 연습</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span>리듬 불안</span>
            </div>
             <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>템포 흔들림</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
