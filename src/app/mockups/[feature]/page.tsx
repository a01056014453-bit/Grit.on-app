"use client";

import { use } from "react";
import {
  Home, Play, Pause, User, Zap, Trophy, ArrowLeft, Bell,
  Search, Users, GraduationCap, Check, BookOpen,
  Flame, Calendar, Clock, Target, TrendingUp,
  BarChart3, ArrowUp, Award, Minus, Plus, Volume2,
  ChevronRight, ChevronDown, Sparkles, Music2,
  Folder, FolderOpen, Lock, Eye, Shield, FileText,
  Video, Crown, Medal, Gauge, Hand, Mic, PenTool,
  Star, Pencil, LogOut, Activity, Lightbulb, Music,
} from "lucide-react";

/* ───────────────────────────────────────────────
   실사용 앱 화면 목업 – App Store 스크린샷용
   실제 앱 UI를 하드코딩 데이터로 재현
   ─────────────────────────────────────────────── */

// ─── 하단 네비게이션 바 (공통) ─────────────────
function MockBottomNav({ active }: { active: string }) {
  const items = [
    { id: "home", icon: Home, label: "홈" },
    { id: "practice", icon: Play, label: "연습" },
    { id: "ai-analysis", icon: Zap, label: "AI분석" },
    { id: "ranking", icon: Trophy, label: "랭킹" },
    { id: "profile", icon: User, label: "프로필" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {items.map((item) => {
            const isActive = item.id === active;
            return (
              <div
                key={item.id}
                className={`flex flex-col items-center justify-center w-16 h-full ${
                  isActive ? "text-black" : "text-gray-400"
                }`}
              >
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ─── 공통 헤더 ──────────────────────────────────
function MockHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </div>
      <div className="flex-1">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  각 기능별 목업 렌더러
// ═══════════════════════════════════════════════

function HomeMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet pb-24">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
            안녕하세요 <span className="bg-gradient-to-r from-violet-700 to-violet-400 bg-clip-text text-transparent">지수</span>님 ☀️
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">오늘도 훌륭한 연주를 기대해요</p>
        </div>
        <div className="relative w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-sm border border-white/40">
          <Bell className="w-5 h-5 text-gray-700" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">3</span>
        </div>
      </div>

      {/* Daily Goal */}
      <div className="mb-6">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">오늘의 목표</p>
              <p className="text-xs text-gray-500">목표 2시간</p>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-violet-700 to-violet-400 bg-clip-text text-transparent">76%</span>
          </div>
          <div className="h-3 bg-white/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-400 to-purple-600 rounded-full" style={{ width: "76%" }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">1시간 31분 / 2시간</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl mb-6 divide-x divide-gray-200/50 grid grid-cols-3 shadow-sm border border-white/50">
        {[
          { value: "128", unit: "시간", label: "총 연습" },
          { value: "5", unit: "세션", label: "이번 주" },
          { value: "32", unit: "일", label: "연속" },
        ].map((s) => (
          <div key={s.label} className="py-4 text-center">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-xl font-extrabold text-gray-900">{s.value}</span>
              <span className="text-xs text-gray-400">{s.unit}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Start Practice Button */}
      <div className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-violet-500 to-violet-900 text-white rounded-2xl py-4 text-lg font-semibold shadow-lg shadow-violet-500/25 mb-4">
        <Play className="w-6 h-6 fill-white" />
        <span>연습 시작하기</span>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        <div className="col-span-2 bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm min-h-[110px]">
          <Search className="w-5 h-5 text-violet-500 mb-2" />
          <p className="text-[13px] font-bold text-gray-900">음악용어 검색</p>
          <p className="text-[10px] text-gray-500 mt-0.5">악보 기호와 용어</p>
        </div>
        <div className="col-span-3 bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm min-h-[110px]">
          <Users className="w-5 h-5 text-violet-500 mb-2" />
          <p className="text-[13px] font-bold text-gray-900">원포인트 레슨</p>
          <p className="text-[10px] text-gray-500 mt-0.5">전문가의 시선으로 막힌 구간의 해법을 제시합니다</p>
        </div>
        <div className="col-span-3 bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm min-h-[110px]">
          <BookOpen className="w-5 h-5 text-violet-500 mb-2" />
          <p className="text-[13px] font-bold text-gray-900">연습 기록</p>
          <p className="text-[10px] text-gray-500 mt-0.5">나의 연습 기록을 한눈에</p>
        </div>
        <div className="col-span-2 bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm min-h-[110px]">
          <GraduationCap className="w-5 h-5 text-violet-500 mb-2" />
          <p className="text-[13px] font-bold text-gray-900">입시룸</p>
          <p className="text-[10px] text-gray-500 mt-0.5">다른 학생들의 연습</p>
        </div>
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

function PracticeMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet pb-24">
      <div className="bg-blob-extra" />
      <MockHeader title="연습" subtitle="쇼팽 발라드 1번 Op.23" />

      {/* Timer Circle */}
      <div className="flex justify-center mb-6">
        <div className="relative w-56 h-56">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#grad)" strokeWidth="5" strokeDasharray="264" strokeDashoffset="66" strokeLinecap="round" />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-black text-gray-900 font-mono">32:15</p>
            <p className="text-xs text-gray-500 mt-1">순 연습시간</p>
          </div>
        </div>
      </div>

      {/* Waveform */}
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-600">녹음 중</span>
          <span className="text-xs text-gray-400 ml-auto">전체 45:22</span>
        </div>
        <div className="flex items-end justify-center gap-[2px] h-12">
          {[35, 65, 45, 80, 60, 90, 40, 75, 55, 85, 30, 70, 50, 95, 45, 80, 60, 38, 72, 88, 42, 68, 55, 78, 35, 62, 48, 85, 70, 55, 40, 75, 60, 82, 45, 68, 52, 78, 90, 35].map((h, i) => (
            <div key={i} className="w-1 bg-violet-400 rounded-full" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="w-14 h-14 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
          <Mic className="w-6 h-6 text-gray-600" />
        </div>
        <div className="w-18 h-18 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 p-5">
          <div className="w-5 h-5 bg-white rounded-sm" />
        </div>
        <div className="w-14 h-14 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
          <Music2 className="w-6 h-6 text-gray-600" />
        </div>
      </div>

      {/* Today Drills */}
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm">
        <p className="text-sm font-bold text-gray-900 mb-3">오늘의 연습 목록</p>
        {[
          { title: "하농 39번", measure: "전체", done: true, time: "15분" },
          { title: "쇼팽 발라드 1번", measure: "마디 32-48", done: false, active: true, time: "25분" },
          { title: "베토벤 소나타 14번", measure: "1악장", done: false, time: "20분" },
        ].map((d) => (
          <div key={d.title} className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${d.active ? "bg-violet-50 border border-violet-200" : d.done ? "bg-green-50/50" : "bg-white/30"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${d.done ? "bg-green-500 text-white" : d.active ? "bg-violet-500 text-white" : "bg-gray-200 text-gray-500"}`}>
              {d.done ? <Check className="w-3.5 h-3.5" /> : "♪"}
            </div>
            <div className="flex-1">
              <p className={`text-xs font-medium ${d.done ? "text-gray-400 line-through" : "text-gray-800"}`}>{d.title}</p>
              <p className="text-[10px] text-gray-400">{d.measure} · {d.time}</p>
            </div>
            {d.active && <span className="text-[10px] text-violet-600 font-semibold">진행중</span>}
          </div>
        ))}
      </div>
      <MockBottomNav active="practice" />
    </div>
  );
}

function StatsMockup() {
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const minutes = [45, 72, 30, 85, 60, 105, 20];
  const maxMin = 105;

  return (
    <div className="min-h-screen bg-blob-violet px-4 py-6 max-w-lg mx-auto pb-24">
      <div className="bg-blob-extra" />
      <MockHeader title="연습 통계" subtitle="나의 연습 기록을 확인하세요" />

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm shadow-violet-500/20">
          주간 통계
        </button>
        <button className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-white/40 backdrop-blur-sm text-gray-500 border border-white/30">
          월간 통계
        </button>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm mb-4">
        <h3 className="font-bold text-gray-900 mb-1">이번 주 연습량</h3>
        <p className="text-xs text-gray-500 mb-4">일별 연습 시간을 확인해보세요</p>
        <div className="flex items-end justify-between gap-2 h-32 mb-3">
          {days.map((day, i) => {
            const height = (minutes[i] / maxMin) * 100;
            const isBest = minutes[i] === maxMin;
            const isToday = i === 5;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                {minutes[i] > 0 && <span className="text-[10px] text-gray-500 font-medium">{minutes[i]}분</span>}
                <div className="w-full flex flex-col items-center justify-end h-20">
                  <div
                    className={`w-full max-w-7 rounded-t-lg ${isBest ? "bg-gradient-to-t from-violet-600 to-purple-400" : "bg-violet-300/80"}`}
                    style={{ height: `${Math.max(height, 8)}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${isToday ? "text-violet-600" : "text-gray-400"}`}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best Day Insight */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-violet-500/20 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">이번 주는 토요일에 가장 오래 연습했어요!</p>
            <p className="text-sm text-white/80 mt-0.5">105분 연습</p>
          </div>
        </div>
      </div>

      {/* Weekly Goal */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-500" />
            주간 목표 달성
          </h3>
          <span className="text-2xl font-bold text-violet-600">60%</span>
        </div>
        <div className="h-3 bg-white/50 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-violet-400 to-purple-600 rounded-full" style={{ width: "60%" }} />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">6시간 57분</span>
          <span className="text-gray-400">목표: 7시간</span>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100/80 rounded-xl">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">32</span>
              <span className="text-gray-500">일 연속 연습 중</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">대단해요! 한 달 넘게 이어오고 있어요!</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-4 border border-white/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100/70 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span className="text-xs text-gray-400">총 연습 시간</span>
          </div>
          <div className="text-xl font-bold text-gray-900">6시간 57분</div>
        </div>
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-4 border border-white/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-green-100/70 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-green-500" />
            </div>
            <span className="text-xs text-gray-400">연습한 날</span>
          </div>
          <div className="text-xl font-bold text-gray-900">6일 <span className="text-sm font-normal text-gray-400">/ 7일</span></div>
        </div>
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

function AIAnalysisMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-black">내 분석 보관함</h1>
          <p className="text-xs text-gray-500">AI 분석 완료된 곡 5개</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
          <Folder className="w-5 h-5 text-violet-600" />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <div className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-400">
          곡 이름, 작곡가로 검색
        </div>
      </div>

      {/* New Analysis */}
      <div className="w-full py-4 mb-6 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-500">
        <Plus className="w-5 h-5 inline mr-2" />
        새로운 곡 분석 요청
      </div>

      {/* AI Analyzed */}
      <h2 className="text-sm font-semibold text-black flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-500" />
        AI 분석한 곡
      </h2>
      <div className="space-y-2 mb-6">
        {[
          { composer: "쇼팽", title: "발라드 1번 Op.23", date: "2026. 3. 9." },
          { composer: "베토벤", title: "소나타 14번 '월광' 1악장", date: "2026. 3. 7." },
          { composer: "카푸스틴", title: "8개의 연주회용 연습곡 Op.40 No.1", date: "2026. 3. 5." },
        ].map((a) => (
          <div key={a.title} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">{a.composer} - {a.title}</p>
              <p className="text-xs text-gray-400">{a.date} 분석</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          </div>
        ))}
      </div>

      {/* Section Analysis */}
      <h2 className="text-sm font-semibold text-black flex items-center gap-2 mb-3">
        <Music2 className="w-4 h-4 text-gray-500" />
        마디별 분석 곡
      </h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-black truncate">쇼팽 - 발라드 1번</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">Op.23</span>
              <span className="text-xs text-gray-400">• G단조</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">어려움</span>
            </div>
          </div>
          <div className="text-right shrink-0 mr-2">
            <p className="text-xs font-semibold text-violet-600">72%</p>
            <p className="text-xs text-gray-400">완성도</p>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        </div>
        {/* Expanded */}
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-black">264</p>
              <p className="text-xs text-gray-500">마디</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-black">9분</p>
              <p className="text-xs text-gray-500">연주시간</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-black">8</p>
              <p className="text-xs text-gray-500">섹션</p>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-black">마디별 분석</span>
            </div>
            {[
              { range: "1-8", name: "서주 (Largo)", diff: "보통", diffColor: "bg-yellow-100 text-yellow-700", mastery: "bg-green-500" },
              { range: "9-36", name: "제1주제 (Moderato)", diff: "어려움", diffColor: "bg-orange-100 text-orange-700", mastery: "bg-blue-400" },
              { range: "37-67", name: "경과부", diff: "매우 어려움", diffColor: "bg-red-100 text-red-700", mastery: "bg-yellow-400" },
            ].map((s) => (
              <div key={s.range} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 mb-2">
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-xs font-bold text-gray-600">{s.range}</span>
                  <span className="text-[10px] text-gray-400">마디</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{s.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.diffColor}`}>{s.diff}</span>
                </div>
                <div className={`w-3 h-3 rounded-full shrink-0 ${s.mastery}`} />
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <MockBottomNav active="ai-analysis" />
    </div>
  );
}

function RankingMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm border border-white/50 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1 text-left">
          <h1 className="text-lg font-bold text-gray-900">오늘의 랭킹</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Flame className="w-3 h-3 text-orange-500" />
            5명 실시간 연습 중
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 mb-6">
        {/* 2nd */}
        <div className="pt-6">
          <div className="flex flex-col items-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-3 w-[110px] shadow-[0_0_16px_rgba(156,163,175,0.3)]">
            <div className="rounded-full bg-gradient-to-br from-gray-300 to-gray-400 w-8 h-8 flex items-center justify-center mb-2">
              <Medal className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl mb-1">🎻</span>
            <span className="text-xs font-semibold text-gray-800 truncate max-w-[80px]">유진</span>
            <span className="font-mono text-xs font-bold text-gray-600">02:45:30</span>
          </div>
        </div>
        {/* 1st */}
        <div className="pb-4">
          <div className="flex flex-col items-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-3 w-[130px] pb-4 shadow-[0_0_24px_rgba(251,191,36,0.35)]">
            <div className="rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 w-10 h-10 flex items-center justify-center mb-2">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <span className="text-3xl mb-1">🎹</span>
            <div className="flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-sm font-bold text-amber-700">서현</span>
            </div>
            <span className="font-mono text-sm font-bold text-violet-600">03:22:15</span>
          </div>
        </div>
        {/* 3rd */}
        <div className="pt-6">
          <div className="flex flex-col items-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-3 w-[110px] shadow-[0_0_16px_rgba(217,119,6,0.25)]">
            <div className="rounded-full bg-gradient-to-br from-amber-500 to-amber-700 w-8 h-8 flex items-center justify-center mb-2">
              <Award className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl mb-1">🎸</span>
            <span className="text-xs font-semibold text-gray-800 truncate max-w-[80px]">민호</span>
            <span className="font-mono text-xs font-bold text-gray-600">02:10:45</span>
          </div>
        </div>
      </div>

      {/* My Ranking */}
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-3.5 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25">
            <span className="text-sm font-extrabold text-white">5</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm text-gray-900 truncate">지수</p>
              <span className="text-[9px] px-1.5 py-px rounded-full bg-violet-100 text-violet-600 font-semibold">나</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm">🎹</span>
              <span className="text-[11px] text-gray-400">피아노</span>
            </div>
          </div>
          <span className="font-mono text-base font-bold bg-gradient-to-r from-violet-700 to-violet-400 bg-clip-text text-transparent">01:31:22</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-violet-100/80 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-violet-400 rounded-full" style={{ width: "50%" }} />
          </div>
          <span className="text-[11px] font-semibold text-violet-500 shrink-0">상위 50%</span>
        </div>
      </div>

      {/* Rank List */}
      <p className="text-sm font-semibold text-gray-700 mb-3">전체 순위</p>
      <div className="flex flex-col gap-2">
        {[
          { rank: 4, name: "하은", instrument: "🎹", time: "01:52:18", practicing: true, song: "리스트 라 캄파넬라" },
          { rank: 5, name: "지수", instrument: "🎹", time: "01:31:22", practicing: true, song: "쇼팽 발라드 1번" },
          { rank: 6, name: "예준", instrument: "🎻", time: "01:15:40", practicing: false },
          { rank: 7, name: "소율", instrument: "🎹", time: "00:58:33", practicing: false },
        ].map((u) => (
          <div key={u.rank} className="bg-white/50 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-sm p-4 flex items-center gap-3">
            <span className="w-6 text-sm font-bold text-gray-400 text-center">{u.rank}</span>
            <span className="text-lg">{u.instrument}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 text-sm truncate">{u.name}</span>
                {u.practicing && <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0" />}
              </div>
              {u.practicing && u.song && <p className="text-xs text-gray-500 truncate mt-0.5">{u.song}</p>}
            </div>
            <span className={`font-mono text-sm font-semibold ${u.practicing ? "text-violet-600" : "text-gray-600"}`}>{u.time}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold shadow-lg shadow-violet-500/20">
          <Play className="w-5 h-5 fill-white" />
          연습 시작하고 순위 올리기
        </div>
      </div>
      <MockBottomNav active="ranking" />
    </div>
  );
}

function MetronomeMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">메트로놈</h1>
          <p className="text-xs text-muted-foreground">정확한 템포로 연습하기</p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600">
          <Volume2 className="w-5 h-5" />
        </div>
      </div>

      {/* Main Display */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
        {/* Beat Indicators */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-5 h-5 rounded-full bg-green-500 scale-125" />
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <div className="w-3 h-3 rounded-full bg-gray-200" />
        </div>

        {/* BPM Display */}
        <div className="text-center mb-6">
          <div className="text-sm text-muted-foreground mb-1">♩ =</div>
          <div className="text-6xl font-bold text-foreground mb-1">120</div>
          <div className="text-sm text-muted-foreground italic">Allegro</div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <Minus className="w-6 h-6" />
          </div>
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg">
            <Play className="w-8 h-8 ml-1" />
          </div>
          <div className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <Plus className="w-6 h-6" />
          </div>
        </div>

        {/* Slider */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full" style={{ width: "36%" }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>20</span>
          <span>300</span>
        </div>
      </div>

      {/* Subdivision */}
      <div className="mb-6 bg-[#1a1a1a] rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white/80 mb-3">리듬 세분화</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { symbol: "♩", label: "4분음표", active: true },
            { symbol: "♪♪", label: "8분음표", active: false },
            { symbol: "♬♬", label: "16분음표", active: false },
            { symbol: "♩.♪", label: "붓점", active: false },
            { symbol: "♪♩.", label: "역붓점", active: false },
            { symbol: "³♪", label: "셋잇단", active: false },
          ].map((p) => (
            <div
              key={p.label}
              className={`py-3 px-2 rounded-xl text-center ${
                p.active ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30" : "bg-white/10 text-white/70"
              }`}
            >
              <div className="text-lg font-bold leading-tight">{p.symbol}</div>
              <div className="text-[10px] mt-1 opacity-70">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Signature */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">박자</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <span className="text-[10px] text-muted-foreground self-center w-8 shrink-0">단순</span>
            {["2/4", "3/4", "4/4"].map((sig) => (
              <div key={sig} className={`flex-1 py-3 rounded-xl text-sm font-medium text-center ${sig === "4/4" ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"}`}>
                {sig}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] text-muted-foreground self-center w-8 shrink-0">복합</span>
            {["6/8", "9/8", "12/8"].map((sig) => (
              <div key={sig} className={`flex-1 py-3 rounded-xl text-sm font-medium text-center bg-secondary text-muted-foreground`}>
                {sig}
              </div>
            ))}
          </div>
        </div>
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

function MusicTermsMockup() {
  const categories = [
    { label: "전체", icon: BookOpen, active: true },
    { label: "빠르기", icon: Gauge },
    { label: "셈여림", icon: Volume2 },
    { label: "주법", icon: Hand },
    { label: "표현", icon: Mic },
  ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="음악 용어 사전" subtitle="500+ 음악 용어를 검색하세요" />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <div className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 text-sm text-gray-400">
          용어 검색...
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categories.map((c) => (
          <div key={c.label} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap ${c.active ? "bg-violet-600 text-white" : "bg-white/40 backdrop-blur-sm text-gray-600 border border-white/50"}`}>
            <c.icon className="w-3.5 h-3.5" />
            {c.label}
          </div>
        ))}
      </div>

      {/* Language Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { label: "전체", active: true },
          { label: "🇮🇹 이태리어", active: false },
          { label: "🇩🇪 독일어", active: false },
          { label: "🇫🇷 프랑스어", active: false },
        ].map((l) => (
          <div key={l.label} className={`text-[10px] px-2.5 py-1.5 rounded-full ${l.active ? "bg-violet-100 text-violet-700 font-semibold" : "bg-white/30 text-gray-500"}`}>
            {l.label}
          </div>
        ))}
      </div>

      {/* Terms List */}
      <div className="space-y-2">
        {[
          { term: "Allegro", korean: "알레그로", meaning: "빠르게 (120-168 BPM)", category: "빠르기", lang: "🇮🇹" },
          { term: "Pianissimo (pp)", korean: "피아니시모", meaning: "매우 여리게", category: "셈여림", lang: "🇮🇹" },
          { term: "Legato", korean: "레가토", meaning: "이어서, 매끄럽게", category: "주법", lang: "🇮🇹" },
          { term: "Crescendo", korean: "크레센도", meaning: "점점 세게", category: "셈여림", lang: "🇮🇹" },
          { term: "Rubato", korean: "루바토", meaning: "자유로운 템포", category: "빠르기", lang: "🇮🇹" },
          { term: "Staccato", korean: "스타카토", meaning: "끊어서, 짧게", category: "주법", lang: "🇮🇹" },
          { term: "Schnell", korean: "슈넬", meaning: "빠르게", category: "빠르기", lang: "🇩🇪" },
          { term: "Espressivo", korean: "에스프레시보", meaning: "표정이 풍부하게", category: "표현", lang: "🇮🇹" },
          { term: "Dolce", korean: "돌체", meaning: "달콤하게, 부드럽게", category: "표현", lang: "🇮🇹" },
        ].map((t) => (
          <div key={t.term} className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/50">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-800">{t.term}</p>
                  <span className="text-[10px] text-gray-400">{t.lang}</span>
                </div>
                <p className="text-xs text-violet-600 mt-0.5">{t.korean}</p>
              </div>
              <span className="text-[9px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{t.category}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{t.meaning}</p>
          </div>
        ))}
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

function FeedbackMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="레슨 피드백" subtitle="선생님의 피드백을 확인하세요" />

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm">진행 중 2</button>
        <button className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-white/40 text-gray-500 border border-white/30">완료됨 5</button>
      </div>

      <div className="space-y-3">
        {[
          { teacher: "김서연 선생님", piece: "쇼팽 발라드 1번", date: "3월 8일", status: "피드백 도착", statusColor: "bg-green-100 text-green-700", items: 3, remaining: "23시간" },
          { teacher: "박준혁 선생님", piece: "베토벤 소나타 14번", date: "3월 5일", status: "진행 중", statusColor: "bg-blue-100 text-blue-700", items: 2, remaining: "5일" },
        ].map((f) => (
          <div key={f.piece} className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-bold text-gray-900">{f.teacher}</p>
                <p className="text-xs text-gray-500">{f.piece} · {f.date}</p>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${f.statusColor}`}>{f.status}</span>
            </div>
            <div className="space-y-2">
              {[
                { measure: "마디 32-40", issue: "리듬 안정화 필요", priority: "높음", color: "text-red-600 bg-red-50" },
                { measure: "마디 52-58", issue: "왼손 독립성 강화", priority: "중간", color: "text-orange-600 bg-orange-50" },
              ].slice(0, f.items - 1).map((item) => (
                <div key={item.measure} className="flex items-center gap-3 p-2.5 bg-white/60 rounded-xl">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-800">{item.measure}</p>
                    <p className="text-[10px] text-gray-500">{item.issue}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${item.color}`}>{item.priority}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/50">
              <span className="text-[10px] text-gray-400">피드백 항목 {f.items}개</span>
              <span className="text-[10px] text-violet-600 font-semibold">남은 시간 {f.remaining}</span>
            </div>
          </div>
        ))}
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

function HelpMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="도움 요청" subtitle="전문가에게 막힌 구간을 질문하세요" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "활동 전문가", value: "24명" },
          { label: "해결 완료", value: "156건" },
          { label: "평균 응답", value: "4.2시간" },
        ].map((s) => (
          <div key={s.label} className="bg-white/40 backdrop-blur-xl rounded-2xl p-3 text-center border border-white/50">
            <p className="text-sm font-bold text-violet-600">{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {["전체", "양손 합", "템포", "페달", "테크닉", "보이싱", "리듬"].map((f, i) => (
          <div key={f} className={`text-xs px-3 py-2 rounded-full whitespace-nowrap ${i === 0 ? "bg-violet-600 text-white" : "bg-white/40 text-gray-600 border border-white/50"}`}>{f}</div>
        ))}
      </div>

      {/* Requests */}
      <div className="space-y-3">
        {[
          { piece: "쇼팽 발라드 1번", measure: "마디 32-40", type: "운지법", answers: 2, deadline: "12시간 남음", status: "답변 도착" },
          { piece: "리스트 라 캄파넬라", measure: "마디 15-20", type: "테크닉", answers: 0, deadline: "2일 남음", status: "모집 중" },
          { piece: "베토벤 소나타 14번", measure: "마디 60-68", type: "페달링", answers: 3, deadline: "완료", status: "해결됨" },
        ].map((r) => (
          <div key={r.piece + r.measure} className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-bold text-gray-900">{r.piece}</p>
                <p className="text-xs text-gray-500">{r.measure} · {r.type}</p>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                r.status === "답변 도착" ? "bg-green-100 text-green-700" :
                r.status === "모집 중" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-600"
              }`}>{r.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">답변 {r.answers}개</span>
              <span className="text-[10px] text-violet-600 font-medium">{r.deadline}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6">
        <div className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold shadow-lg shadow-violet-500/20">
          <Plus className="w-5 h-5" />
          새 도움 요청하기
        </div>
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

function RoomsMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="입시 연습실" subtitle="다른 학생들의 연습을 참고하세요" />

      {/* Categories */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {["전체", "서울대", "한예종", "연세대", "이화여대"].map((c, i) => (
          <div key={c} className={`text-xs px-4 py-2 rounded-full whitespace-nowrap font-medium ${i === 0 ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white" : "bg-white/40 text-gray-600 border border-white/50"}`}>{c}</div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <div className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/50 text-sm text-gray-400">
          연습실 검색...
        </div>
      </div>

      {/* Rooms */}
      <div className="space-y-3">
        {[
          { name: "서울대 피아노 전공", school: "서울대학교", type: "verified", members: 28, videos: 156, schoolColor: "bg-blue-100 text-blue-700" },
          { name: "한예종 피아노과", school: "한국예술종합학교", type: "verified", members: 22, videos: 98, schoolColor: "bg-purple-100 text-purple-700" },
          { name: "연세대 음악학과", school: "연세대학교", type: "public", members: 35, videos: 210, schoolColor: "bg-green-100 text-green-700" },
          { name: "이화여대 건반", school: "이화여자대학교", type: "public", members: 18, videos: 72, schoolColor: "bg-pink-100 text-pink-700" },
        ].map((r) => (
          <div key={r.name} className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 truncate">{r.name}</p>
                  {r.type === "verified" && <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.schoolColor}`}>{r.school}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/50">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />
                <span>{r.members}명</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Video className="w-3.5 h-3.5" />
                <span>영상 {r.videos}개</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

function TeachersMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="선생님 찾기" subtitle="전문 선생님의 레슨을 받아보세요" />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <div className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/40 border border-white/50 text-sm text-gray-400">
          선생님 이름, 전문 분야 검색
        </div>
      </div>

      {/* Specialties */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {["전체", "쇼팽", "베토벤", "바흐", "테크닉", "입시", "리듬"].map((s, i) => (
          <div key={s} className={`text-xs px-3 py-2 rounded-full whitespace-nowrap ${i === 0 ? "bg-violet-600 text-white" : "bg-white/40 text-gray-600 border border-white/50"}`}>{s}</div>
        ))}
      </div>

      {/* Teachers */}
      <div className="space-y-3">
        {[
          { name: "김서연", school: "서울대 피아노 전공", tags: ["쇼팽", "드뷔시", "입시"], rating: 4.9, reviews: 127, response: "2시간", emoji: "👩‍🏫" },
          { name: "박준혁", school: "한예종 피아노과", tags: ["바흐", "베토벤", "테크닉"], rating: 4.8, reviews: 98, response: "4시간", emoji: "👨‍🏫" },
          { name: "이하늘", school: "줄리아드 피아노 석사", tags: ["리스트", "라흐마니노프"], rating: 4.7, reviews: 64, response: "6시간", emoji: "👩‍🎓" },
          { name: "최민수", school: "모스크바 음악원", tags: ["테크닉", "스크리아빈"], rating: 4.9, reviews: 85, response: "3시간", emoji: "👨‍🎓" },
        ].map((t) => (
          <div key={t.name} className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center text-2xl">{t.emoji}</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{t.name} 선생님</p>
                <p className="text-[11px] text-gray-500">{t.school}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-amber-500 flex items-center gap-0.5"><Star className="w-3.5 h-3.5 fill-amber-400" />{t.rating}</p>
                <p className="text-[10px] text-gray-400">리뷰 {t.reviews}</p>
              </div>
            </div>
            <div className="flex gap-1 mb-3 flex-wrap">
              {t.tags.map((tag) => (
                <span key={tag} className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>무료 피드백</span>
              <span>평균 응답 {t.response}</span>
            </div>
          </div>
        ))}
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

function RecordingsMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="연습 녹음" subtitle="총 32개 녹음 · 5시간 42분" />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 mb-2">오늘</p>
        {[
          { piece: "쇼팽 발라드 1번 Op.23", time: "14:30", duration: "4:32" },
          { piece: "베토벤 소나타 14번 1악장", time: "13:15", duration: "6:18" },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 p-4">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Play className="w-4 h-4 text-violet-600 fill-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{r.piece}</p>
              <p className="text-xs text-gray-400">{r.time} · {r.duration}</p>
            </div>
          </div>
        ))}

        <p className="text-xs font-semibold text-gray-500 mb-2 mt-4">어제</p>
        {[
          { piece: "쇼팽 발라드 1번 Op.23", time: "16:40", duration: "4:15" },
          { piece: "드뷔시 달빛", time: "14:20", duration: "5:02" },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 p-4">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Play className="w-4 h-4 text-violet-600 fill-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{r.piece}</p>
              <p className="text-xs text-gray-400">{r.time} · {r.duration}</p>
            </div>
          </div>
        ))}

        <p className="text-xs font-semibold text-gray-500 mb-2 mt-4">3월 7일</p>
        {[
          { piece: "쇼팽 발라드 1번 Op.23", time: "17:10", duration: "3:58" },
          { piece: "하농 39번", time: "15:30", duration: "8:22" },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 p-4">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Play className="w-4 h-4 text-violet-600 fill-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{r.piece}</p>
              <p className="text-xs text-gray-400">{r.time} · {r.duration}</p>
            </div>
          </div>
        ))}
      </div>
      <MockBottomNav active="practice" />
    </div>
  );
}

function RecordsMockup() {
  const practicedDays = [1, 2, 3, 5, 6, 7, 8, 9, 10];
  const daysInMonth = 31;
  const startWeekday = 0; // 3월 2026년 = 일요일

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="연습 기록" subtitle="캘린더에서 나의 히스토리 확인" />

      {/* Calendar */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">2026년 3월</h3>
          <span className="text-xs font-medium text-violet-600 bg-violet-100/60 px-2.5 py-1 rounded-full">
            {practicedDays.length}일 연습
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
            <div key={day} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"}`}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array(startWeekday).fill(null).map((_, i) => (
            <div key={`e-${i}`} className="flex flex-col items-center py-1"><div className="w-8 h-8" /></div>
          ))}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const hasPractice = practicedDays.includes(day);
            const isToday = day === 10;
            return (
              <div key={day} className="flex flex-col items-center py-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                  isToday
                    ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-sm shadow-violet-500/30"
                    : hasPractice && day >= 8
                    ? "bg-violet-600 text-white"
                    : hasPractice
                    ? "bg-violet-400 text-white"
                    : "bg-white/30"
                }`}>
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
      </div>

      {/* Today Detail */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm">
        <p className="font-bold text-gray-900 mb-3">3월 10일 (오늘)</p>
        <div className="space-y-3">
          {[
            { time: "14:30-15:12", piece: "쇼팽 발라드 1번", duration: "42분", type: "자유 연습" },
            { time: "13:00-13:28", piece: "베토벤 소나타 14번", duration: "28분", type: "스케줄" },
            { time: "12:15-12:30", piece: "하농 39번", duration: "15분", type: "스케줄" },
          ].map((s) => (
            <div key={s.time} className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
              <div className="w-1.5 h-10 rounded-full bg-violet-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{s.piece}</p>
                <p className="text-[10px] text-gray-400">{s.time} · {s.duration}</p>
              </div>
              <span className="text-[10px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{s.type}</span>
            </div>
          ))}
        </div>
      </div>
      <MockBottomNav active="practice" />
    </div>
  );
}

function GoalsMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="나의 목표" subtitle="목표를 세우고 달성하세요" />

      {/* Today's Goal */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl p-5 mb-4 text-white shadow-lg shadow-violet-500/20">
        <p className="text-xs opacity-80 mb-1">오늘 목표</p>
        <div className="flex items-end gap-2 mb-3">
          <p className="text-4xl font-black">1:31</p>
          <p className="text-sm opacity-80 mb-1">/ 2:00</p>
        </div>
        <div className="h-3 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: "76%" }} />
        </div>
        <p className="text-xs opacity-80 mt-2 text-right">76% 달성</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { value: "128시간", label: "총 연습" },
          { value: "5세션", label: "이번 주" },
          { value: "32일", label: "연속" },
        ].map((s) => (
          <div key={s.label} className="bg-white/40 backdrop-blur-xl rounded-2xl p-3 text-center border border-white/50">
            <p className="text-sm font-bold text-gray-900">{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Practice Calendar Mini */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm mb-4">
        <p className="font-bold text-gray-900 mb-3">3월 연습 현황</p>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium ${
              i === 9 ? "bg-violet-600 text-white" : "bg-violet-200 text-violet-700"
            }`}>
              {i + 1}
            </div>
          ))}
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={`f-${i}`} className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium bg-white/30 text-gray-400">
              {i + 11}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm">
        <p className="font-bold text-gray-900 mb-3">오늘의 연습</p>
        <div className="space-y-2">
          {[
            { piece: "쇼팽 발라드 1번", time: "42분", hasAudio: true },
            { piece: "베토벤 소나타 14번", time: "28분", hasAudio: true },
            { piece: "하농 39번", time: "15분", hasAudio: false },
          ].map((s) => (
            <div key={s.piece} className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{s.piece}</p>
                <p className="text-xs text-gray-400">{s.time}</p>
              </div>
              {s.hasAudio && (
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-violet-600 fill-violet-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

function RoutinesMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="연습 루틴" subtitle="체계적인 연습 순서를 만들어보세요" />

      {/* Today's Routine */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-gray-900">오늘의 루틴</p>
            <p className="text-xs text-gray-400">예상 소요시간 1시간 30분</p>
          </div>
          <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full">3/5 완료</span>
        </div>

        <div className="space-y-2">
          {[
            { order: 1, title: "음계 & 하농 39번", time: "15분", mode: "시간", done: true },
            { order: 2, title: "쇼팽 발라드 1번 - 마디 32-48", time: "25분", mode: "시간", done: true },
            { order: 3, title: "쇼팽 발라드 1번 - 전체 통주", time: "3회", mode: "반복", done: true },
            { order: 4, title: "베토벤 소나타 14번 1악장", time: "20분", mode: "시간", done: false, active: true },
            { order: 5, title: "초견 연습", time: "15분", mode: "시간", done: false },
          ].map((r) => (
            <div key={r.order} className={`flex items-center gap-3 p-3 rounded-xl border ${
              r.active ? "border-violet-300 bg-violet-50/50" : r.done ? "border-green-200/50 bg-green-50/30" : "border-white/50 bg-white/30"
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                r.done ? "bg-green-500 text-white" : r.active ? "bg-violet-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {r.done ? <Check className="w-3.5 h-3.5" /> : r.order}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${r.done ? "text-gray-400 line-through" : "text-gray-800"}`}>{r.title}</p>
                <p className="text-[10px] text-gray-400">{r.time} · {r.mode}</p>
              </div>
              {r.active && <span className="text-[10px] text-violet-600 font-semibold">진행중</span>}
            </div>
          ))}
        </div>
      </div>

      {/* My Routines */}
      <p className="text-sm font-bold text-gray-900 mb-3">내 루틴 목록</p>
      <div className="space-y-2">
        {[
          { name: "평일 기본 루틴", drills: 5, days: "월~금", totalTime: "1시간 30분" },
          { name: "주말 집중 루틴", drills: 7, days: "토, 일", totalTime: "2시간 30분" },
          { name: "콩쿨 준비 루틴", drills: 8, days: "매일", totalTime: "3시간" },
        ].map((r) => (
          <div key={r.name} className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{r.name}</p>
              <p className="text-[10px] text-gray-400">{r.drills}개 항목 · {r.days} · {r.totalTime}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        ))}
      </div>
      <MockBottomNav active="practice" />
    </div>
  );
}

function ProfileMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />

      {/* Profile Header */}
      <div className="text-center mb-6 pt-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-4xl mx-auto mb-3 shadow-lg shadow-violet-500/20">
          🎵
        </div>
        <h1 className="text-xl font-black text-gray-900">지수님</h1>
        <p className="text-sm text-gray-500">피아노 · 음대 입시</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold">열정적인 연습생</span>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl grid grid-cols-3 divide-x divide-gray-200/50 mb-6 border border-white/50 shadow-sm">
        {[
          { value: "128", unit: "시간", label: "총 연습" },
          { value: "32", unit: "일", label: "연속" },
          { value: "47", unit: "회", label: "분석" },
        ].map((s) => (
          <div key={s.label} className="py-4 text-center">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-xl font-extrabold text-gray-900">{s.value}</span>
              <span className="text-xs text-gray-400">{s.unit}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm mb-4">
        <p className="text-sm font-bold text-gray-900 mb-3">획득한 뱃지</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { icon: "🔥", label: "30일 연속" },
            { icon: "🎯", label: "100시간 달성" },
            { icon: "⭐", label: "첫 AI 분석" },
            { icon: "🏆", label: "주간 랭킹 1위" },
            { icon: "📚", label: "10곡 등록" },
          ].map((b) => (
            <span key={b.label} className="text-[10px] bg-violet-50 text-violet-700 px-2.5 py-1.5 rounded-full font-medium flex items-center gap-1">
              <span>{b.icon}</span> {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Practicing Songs */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm mb-4">
        <p className="text-sm font-bold text-gray-900 mb-3">연습 중인 곡</p>
        <div className="space-y-2">
          {[
            "쇼팽 발라드 1번 Op.23",
            "베토벤 소나타 14번 '월광'",
            "드뷔시 달빛",
            "카푸스틴 연습곡 Op.40 No.1",
          ].map((p) => (
            <div key={p} className="bg-white/50 rounded-xl px-3 py-2.5 text-sm text-gray-700 flex items-center gap-2">
              <Music2 className="w-4 h-4 text-violet-500 shrink-0" />
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden">
        {[
          { icon: Pencil, label: "프로필 편집" },
          { icon: Bell, label: "알림 설정" },
          { icon: Shield, label: "개인정보 보호" },
          { icon: LogOut, label: "로그아웃", red: true },
        ].map((item) => (
          <div key={item.label} className={`flex items-center gap-3 px-5 py-3.5 border-b border-white/30 last:border-b-0 ${item.red ? "" : ""}`}>
            <item.icon className={`w-5 h-5 ${item.red ? "text-red-500" : "text-gray-500"}`} />
            <span className={`text-sm font-medium flex-1 ${item.red ? "text-red-500" : "text-gray-700"}`}>{item.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        ))}
      </div>
      <MockBottomNav active="profile" />
    </div>
  );
}

function SongsMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="내 연습곡" subtitle="곡별 진도와 분석 현황" />

      <div className="space-y-3">
        {[
          { composer: "쇼팽", piece: "발라드 1번 Op.23", key: "G단조", progress: 72, sessions: 24, lastDate: "오늘", diff: "어려움", diffColor: "bg-orange-100 text-orange-700" },
          { composer: "베토벤", piece: "소나타 14번 '월광' 1악장", key: "C#단조", progress: 88, sessions: 18, lastDate: "어제", diff: "보통", diffColor: "bg-yellow-100 text-yellow-700" },
          { composer: "드뷔시", piece: "달빛 (Suite bergamasque)", key: "Db장조", progress: 45, sessions: 10, lastDate: "3일 전", diff: "보통", diffColor: "bg-yellow-100 text-yellow-700" },
          { composer: "카푸스틴", piece: "8개의 연주회용 연습곡 Op.40 No.1", key: "C장조", progress: 20, sessions: 5, lastDate: "1주 전", diff: "매우 어려움", diffColor: "bg-red-100 text-red-700" },
        ].map((s) => (
          <div key={s.piece} className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[11px] text-violet-500 font-medium">{s.composer}</p>
                <p className="text-sm font-bold text-gray-900">{s.piece}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400">{s.key}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.diffColor}`}>{s.diff}</span>
                </div>
              </div>
              <p className="text-lg font-black text-violet-600">{s.progress}%</p>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-violet-400 to-purple-600 rounded-full" style={{ width: `${s.progress}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{s.sessions}회 연습</span>
              <span>최근 {s.lastDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Song */}
      <div className="mt-4">
        <div className="w-full py-4 border-2 border-dashed border-gray-300/50 rounded-xl text-center text-gray-500 text-sm">
          <Plus className="w-5 h-5 inline mr-2" />
          새 곡 추가하기
        </div>
      </div>
      <MockBottomNav active="practice" />
    </div>
  );
}

function NotificationsMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">알림</h1>
        </div>
        <span className="text-xs text-violet-600 font-semibold">모두 읽음</span>
      </div>

      <p className="text-xs font-semibold text-gray-500 mb-3">오늘</p>
      <div className="space-y-2 mb-5">
        {[
          { icon: "🎯", title: "오늘 목표까지 30분 남았어요!", time: "10분 전", unread: true },
          { icon: "🏆", title: "주간 랭킹 5위를 달성했어요!", time: "1시간 전", unread: true },
          { icon: "🧠", title: "AI 분석 결과가 도착했어요", time: "2시간 전", unread: true },
        ].map((n, i) => (
          <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-violet-50/50 border border-violet-100/50">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">{n.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{n.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
            </div>
            <div className="w-2 h-2 bg-violet-500 rounded-full mt-1.5" />
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold text-gray-500 mb-3">어제</p>
      <div className="space-y-2 mb-5">
        {[
          { icon: "💬", title: "김서연 선생님이 피드백을 남겼어요", time: "어제 15:30" },
          { icon: "🔥", title: "32일 연속 연습 중! 대단해요!", time: "어제 21:00" },
        ].map((n, i) => (
          <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/30 border border-white/50">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">{n.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{n.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold text-gray-500 mb-3">이번 주</p>
      <div className="space-y-2">
        {[
          { icon: "✅", title: "도움 요청에 답변이 도착했어요", time: "3월 7일" },
          { icon: "📊", title: "주간 리포트가 준비되었어요", time: "3월 6일" },
          { icon: "🎵", title: "새 곡 '카푸스틴 Op.40'이 등록되었어요", time: "3월 5일" },
        ].map((n, i) => (
          <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/30 border border-white/50">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">{n.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{n.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

// ─── 순연습 측정 메인 화면 ───────────────────────
function PracticeMainMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet pb-24">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">연습 중</h1>
            <p className="text-xs text-gray-500">쇼팽 발라드 1번 Op.23</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-red-600">REC</span>
        </div>
      </div>

      {/* Timer Circle - Hero */}
      <div className="flex justify-center mb-5">
        <div className="relative w-52 h-52">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#gradMain)" strokeWidth="5" strokeDasharray="264" strokeDashoffset="66" strokeLinecap="round" />
            <defs>
              <linearGradient id="gradMain" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] text-gray-400 mb-1">순 연습시간</p>
            <p className="text-4xl font-black text-gray-900 font-mono">32:15</p>
            <p className="text-[10px] text-gray-400 mt-1">전체 45:22</p>
          </div>
        </div>
      </div>

      {/* Live Detection Badge */}
      <div className="flex justify-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] font-medium text-green-700">피아노 감지 중</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 rounded-full">
          <span className="text-[11px] font-medium text-violet-700">연주 비율 71%</span>
        </div>
      </div>

      {/* Waveform */}
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm mb-4">
        <div className="flex items-end justify-center gap-[2px] h-14">
          {[35, 65, 45, 80, 60, 90, 40, 75, 55, 85, 30, 70, 50, 95, 45, 80, 60, 38, 72, 88, 42, 68, 55, 78, 35, 62, 48, 85, 70, 55, 40, 75, 60, 82, 45, 68, 52, 78, 90, 35, 62, 75, 48, 82, 55].map((h, i) => (
            <div key={i} className={`w-[3px] rounded-full ${i > 38 ? "bg-violet-500" : "bg-violet-300"}`} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-gray-400">실시간 오디오 파형</span>
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400">-24dB</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mb-5">
        <div className="w-14 h-14 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
          <Mic className="w-6 h-6 text-gray-600" />
        </div>
        <div className="w-[72px] h-[72px] bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
          <div className="w-6 h-6 bg-white rounded-sm" />
        </div>
        <div className="w-14 h-14 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
          <Music2 className="w-6 h-6 text-gray-600" />
        </div>
      </div>

      {/* Current Drill */}
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-900">현재 연습</span>
          <span className="text-[10px] text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full font-medium">마디 32-48</span>
        </div>
        <p className="text-sm text-gray-700">왼손 독립성 연습 · 시간 모드 25분</p>
        <div className="h-1.5 bg-white/50 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-gradient-to-r from-violet-400 to-purple-600 rounded-full" style={{ width: "65%" }} />
        </div>
      </div>
      <MockBottomNav active="practice" />
    </div>
  );
}

// ─── AI 피드백 리포트 화면 ──────────────────────
function AIReportMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">곡 분석</h1>
          <p className="text-xs text-muted-foreground">AI 음악학 분석</p>
        </div>
      </div>

      {/* Song Header */}
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
            <Music className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">쇼팽 (Frédéric Chopin)</p>
            <p className="text-xs text-gray-500">발라드 1번 Op.23 · G단조</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">낭만주의</span>
          <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">어려움</span>
          <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-1 rounded-lg">약 9분</span>
        </div>
      </div>

      {/* Structure Analysis */}
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-bold text-gray-900">구조 분석</span>
        </div>
        <div className="space-y-2">
          {[
            { range: "1-8", name: "서주 (Largo)", key: "G단조", tempo: "Largo", mood: "장중한", diff: "보통" },
            { range: "9-36", name: "제1주제 (Moderato)", key: "G단조", tempo: "Moderato", mood: "서정적", diff: "어려움" },
            { range: "37-67", name: "경과부", key: "Eb장조", tempo: "Agitato", mood: "격렬한", diff: "매우 어려움" },
            { range: "68-93", name: "제2주제", key: "Eb장조", tempo: "Meno mosso", mood: "달콤한", diff: "어려움" },
            { range: "94-125", name: "발전부", key: "변화", tempo: "Presto", mood: "극적인", diff: "매우 어려움" },
          ].map((s) => (
            <div key={s.range} className="bg-white/60 rounded-xl p-3 border border-white/50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-violet-600">m.{s.range}</span>
                  <span className="text-xs font-medium text-gray-900">{s.name}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  s.diff === "매우 어려움" ? "bg-red-100 text-red-700" :
                  s.diff === "어려움" ? "bg-orange-100 text-orange-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>{s.diff}</span>
              </div>
              <div className="flex gap-2 text-[10px] text-gray-500">
                <span>{s.key}</span>
                <span>·</span>
                <span className="italic">{s.tempo}</span>
                <span>·</span>
                <span>{s.mood}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Practice Method */}
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-bold text-gray-900">연습 가이드</span>
        </div>
        <div className="space-y-3">
          <div className="bg-violet-50 rounded-xl p-3 border-l-4 border-violet-500">
            <p className="text-xs font-bold text-violet-700 mb-1">1주차: 서주 & 제1주제</p>
            <p className="text-[11px] text-violet-600">마디 1-36 · 느린 템포로 멜로디 라인 파악</p>
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-gray-600">• Day 1-2: 양손 분리 연습 (♩=60)</p>
              <p className="text-[10px] text-gray-600">• Day 3-4: 양손 합치기 (♩=72)</p>
              <p className="text-[10px] text-gray-600">• Day 5-7: 음악적 표현 추가</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 border-l-4 border-blue-500">
            <p className="text-xs font-bold text-blue-700 mb-1">2주차: 경과부</p>
            <p className="text-[11px] text-blue-600">마디 37-67 · 옥타브와 도약 테크닉 집중</p>
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-gray-600">• Day 1-3: 양손 분리, 느린 템포 (♩=50)</p>
              <p className="text-[10px] text-gray-600">• Day 4-7: 점진적 템포 상승</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-[10px] text-amber-700">⚠️ AI가 생성한 분석입니다. 참고 자료로 활용하시고, 선생님의 지도와 함께 사용하세요.</p>
      </div>
      <MockBottomNav active="ai-analysis" />
    </div>
  );
}

// ─── 원포인트 레슨 화면 ─────────────────────────
function LessonMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">해결 요청</h1>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold">답변 2개</span>
      </div>

      {/* Request Card */}
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-bold text-gray-900">쇼팽 발라드 1번 Op.23</span>
        </div>
        <p className="text-xs text-gray-600 mb-3">마디 32-40 구간에서 왼손 옥타브 도약이 정확하게 안 됩니다. 운지법과 손목 사용법을 알고 싶습니다.</p>
        <div className="flex gap-2 mb-3">
          <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-1 rounded-lg">마디 32-40</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">운지법</span>
        </div>
        {/* Video Placeholder */}
        <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center relative">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
          </div>
          <span className="absolute bottom-2 right-2 text-[10px] text-white bg-black/60 px-2 py-0.5 rounded">0:45</span>
        </div>
      </div>

      {/* Status */}
      <div className="bg-violet-50 rounded-xl p-3 mb-4 flex items-center gap-3">
        <Clock className="w-4 h-4 text-violet-500" />
        <div className="flex-1">
          <p className="text-xs font-medium text-violet-700">12시간 남음</p>
          <p className="text-[10px] text-violet-500">제안 2개 도착</p>
        </div>
      </div>

      {/* Expert Proposals */}
      <p className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-violet-500" />
        전문가 제안 2
      </p>
      <div className="space-y-3">
        {[
          {
            name: "김서연 선생님",
            badge: "전문가",
            score: 4.9,
            completed: 42,
            accepted: true,
            comment: "왼손 옥타브는 손목 회전을 이용하면 훨씬 편해집니다. 영상으로 설명했으니 확인해보세요.",
            videoTime: "3:24",
          },
          {
            name: "박준혁 선생님",
            badge: "전문가",
            score: 4.8,
            completed: 35,
            accepted: false,
            comment: "1-5 운지 대신 1-4 운지로 바꾸면 도약이 줄어들어 안정감이 생깁니다.",
            videoTime: "2:15",
          },
        ].map((p) => (
          <div key={p.name} className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 p-4 shadow-sm">
            {p.accepted && (
              <div className="flex items-center gap-1 mb-2">
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-[10px] font-bold text-green-600">채택됨</span>
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{p.name}</span>
                  <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">{p.badge}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{p.score}</span>
                  <span>·</span>
                  <span>해결 {p.completed}건</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-700 mb-3">{p.comment}</p>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-2">
                <Video className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[10px] text-gray-600">데모 영상 {p.videoTime}</span>
              </div>
            </div>
            {!p.accepted && (
              <button className="w-full mt-3 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" />
                이 제안 채택하기
              </button>
            )}
          </div>
        ))}
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

// ─── 입시룸 상세 화면 ───────────────────────────
function RoomDetailMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">서울대 피아노 전공</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">지정곡</span>
            <Shield className="w-3 h-3 text-blue-500" />
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
          <Shield className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-3 text-center border border-white/50">
          <Users className="w-4 h-4 text-violet-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">28</p>
          <p className="text-[10px] text-gray-500">참여자</p>
        </div>
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-3 text-center border border-white/50">
          <Video className="w-4 h-4 text-violet-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">156</p>
          <p className="text-[10px] text-gray-500">영상</p>
        </div>
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-3 text-center border border-white/50">
          <Calendar className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-600">D-12</p>
          <p className="text-[10px] text-gray-500">마감</p>
        </div>
      </div>

      {/* Upload CTA */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 mb-5 flex items-center gap-3 shadow-lg shadow-violet-500/20">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-white">
          <p className="text-sm font-bold">새 영상 업로드</p>
          <p className="text-[10px] opacity-80">영상을 올려 다른 연습생의 영상을 확인하세요</p>
        </div>
      </div>

      {/* Videos by Piece */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
          연습 영상
          <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">156</span>
        </p>
        <div className="flex gap-1">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-violet-600 text-white">최신순</span>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/40 text-gray-500">도움순</span>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { piece: "쇼팽 발라드 1번 Op.23", uploaders: 12, videos: 45, open: true },
          { piece: "베토벤 소나타 32번 Op.111", uploaders: 8, videos: 28, open: false },
          { piece: "리스트 소나타 B단조", uploaders: 6, videos: 18, open: false },
        ].map((g) => (
          <div key={g.piece} className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${g.open ? "bg-green-100" : "bg-gray-100"}`}>
                {g.open ? <Eye className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{g.piece}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{g.uploaders}명</span>
                  <span className="flex items-center gap-1"><Video className="w-3 h-3" />{g.videos}개</span>
                </div>
              </div>
              {g.open ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full">업로드 시 열람</span>
              )}
            </div>
            {/* Expanded Videos */}
            {g.open && (
              <div className="border-t border-white/50 p-3 space-y-2">
                {[
                  { user: "지수", duration: "4:32", section: "마디 32-48", helpful: 8, blur: false },
                  { user: "서현", duration: "9:15", section: "전곡", helpful: 15, blur: true },
                  { user: "유진", duration: "3:20", section: "마디 1-36", helpful: 5, blur: false },
                ].map((v) => (
                  <div key={v.user} className="flex items-center gap-3 p-2 bg-white/40 rounded-xl">
                    <div className="w-16 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center relative shrink-0">
                      <Play className="w-4 h-4 text-white" fill="currentColor" />
                      <span className="absolute bottom-0.5 right-1 text-[8px] text-white">{v.duration}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-900">{v.user}</span>
                        {v.blur && <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">블러</span>}
                      </div>
                      <p className="text-[10px] text-gray-400">{v.section}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span>👍</span>
                      <span>{v.helpful}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <MockBottomNav active="home" />
    </div>
  );
}

// ─── 연습 플랜 화면 ─────────────────────────────
function PracticePlanMockup() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      <MockHeader title="연습 플랜" subtitle="오늘의 연습 계획을 확인하세요" />

      {/* Calendar Strip */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { day: "월", date: 9, active: false, practiced: true },
          { day: "화", date: 10, active: true, practiced: true },
          { day: "수", date: 11, active: false, practiced: false },
          { day: "목", date: 12, active: false, practiced: false },
          { day: "금", date: 13, active: false, practiced: false },
          { day: "토", date: 14, active: false, practiced: false },
          { day: "일", date: 15, active: false, practiced: false },
        ].map((d) => (
          <div key={d.date} className={`flex flex-col items-center py-2 px-3 rounded-xl min-w-[48px] ${
            d.active ? "bg-gradient-to-b from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20" :
            d.practiced ? "bg-violet-100 text-violet-700" : "bg-white/40 text-gray-500"
          }`}>
            <span className="text-[10px] font-medium">{d.day}</span>
            <span className="text-lg font-bold">{d.date}</span>
            {d.practiced && !d.active && <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-0.5" />}
          </div>
        ))}
      </div>

      {/* Today Progress */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 mb-5 text-white shadow-lg shadow-violet-500/20">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">오늘의 진행률</p>
          <p className="text-2xl font-black">60%</p>
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: "60%" }} />
        </div>
        <p className="text-xs opacity-80 mt-2">3/5 항목 완료 · 남은시간 약 40분</p>
      </div>

      {/* Drill Schedule */}
      <p className="text-sm font-bold text-gray-900 mb-3">오늘의 스케줄</p>
      <div className="space-y-2 mb-6">
        {[
          { time: "12:00", title: "하농 39번", detail: "전체 · 시간 모드 15분", done: true },
          { time: "12:15", title: "쇼팽 발라드 1번", detail: "마디 32-48 · 시간 모드 25분", done: true },
          { time: "12:45", title: "쇼팽 발라드 1번", detail: "전체 통주 · 반복 모드 3회", done: true },
          { time: "13:15", title: "베토벤 소나타 14번", detail: "1악장 · 시간 모드 20분", done: false, active: true },
          { time: "13:40", title: "초견 연습", detail: "자유 선곡 · 시간 모드 15분", done: false },
        ].map((d) => (
          <div key={d.time + d.title} className={`flex items-center gap-3 p-3 rounded-xl border ${
            d.active ? "border-violet-300 bg-violet-50/50" : d.done ? "border-green-200/50 bg-green-50/30" : "border-white/50 bg-white/30"
          }`}>
            <span className="text-[10px] font-mono text-gray-400 w-10 shrink-0">{d.time}</span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              d.done ? "bg-green-500 text-white" : d.active ? "bg-violet-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {d.done ? <Check className="w-3.5 h-3.5" /> : "♪"}
            </div>
            <div className="flex-1">
              <p className={`text-xs font-semibold ${d.done ? "text-gray-400 line-through" : "text-gray-800"}`}>{d.title}</p>
              <p className="text-[10px] text-gray-400">{d.detail}</p>
            </div>
            {d.active && <span className="text-[10px] text-violet-600 font-semibold">진행중</span>}
          </div>
        ))}
      </div>

      {/* Start Practice Button */}
      <div className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-violet-500 to-violet-900 text-white rounded-2xl py-4 text-base font-semibold shadow-lg shadow-violet-500/25">
        <Play className="w-5 h-5 fill-white" />
        <span>다음 항목 연습 시작</span>
      </div>
      <MockBottomNav active="practice" />
    </div>
  );
}

function PracticeCompleteMockup() {
  // 실제 분석 결과와 동일한 데이터 구조
  const totalDuration = 2722; // 45분 22초
  const netPracticeTime = 1935; // 32분 15초
  const restTime = totalDuration - netPracticeTime; // 13분 7초
  const instrumentPercent = 71;

  const formatTimeDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    if (hrs > 0) return `${hrs}시간 ${mins}분`;
    return `${mins}분 ${secs}초`;
  };

  // 타임라인 세그먼트 (연주/휴식 패턴)
  const segments = [
    { type: "instrument", start: 0, end: 18 },
    { type: "rest", start: 18, end: 22 },
    { type: "instrument", start: 22, end: 45 },
    { type: "rest", start: 45, end: 48 },
    { type: "instrument", start: 48, end: 62 },
    { type: "rest", start: 62, end: 66 },
    { type: "instrument", start: 66, end: 78 },
    { type: "rest", start: 78, end: 82 },
    { type: "instrument", start: 82, end: 100 },
  ];

  return (
    <div className="min-h-screen bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="px-5 py-5 text-center bg-gradient-to-br from-violet-500 to-purple-600 rounded-t-2xl">
            <p className="text-white/90 font-semibold text-sm mb-0.5">쇼팽 발라드 1번 Op.23</p>
            <p className="text-violet-200 text-[11px] mb-1">마디 32-48 · 왼손 독립성 연습</p>
            <p className="text-violet-100 text-xs">
              총 {formatTimeDisplay(totalDuration)} 중
            </p>
            <p className="text-white text-xl font-bold">
              실제 연주 시간은 {formatTimeDisplay(netPracticeTime)}
            </p>
            <p className="text-violet-200 text-[11px] mt-1">
              나머지 {formatTimeDisplay(restTime)}은 휴식 및 준비 시간입니다
            </p>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* 목표 달성률 */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs font-medium text-gray-700">Grit Gauge 반영</span>
                </div>
                <span className="text-xs font-bold text-violet-600">+32분</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                  style={{ width: "76%" }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5 text-center">
                오늘의 목표 76% 달성 (91/120분)
              </p>
            </div>

            {/* AI 분석 + 타임라인 */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs font-medium text-gray-700">AI 분석 결과</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{instrumentPercent}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                  style={{ width: `${instrumentPercent}%` }}
                />
              </div>

              {/* 타임라인 바 */}
              <div className="relative h-6 bg-gray-200 rounded-md overflow-hidden mb-1.5">
                {segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className={`absolute top-0 h-full ${seg.type === "instrument" ? "bg-violet-500" : "bg-gray-300"}`}
                    style={{
                      left: `${seg.start}%`,
                      width: `${seg.end - seg.start}%`,
                    }}
                  />
                ))}
                {/* 재생 위치 표시 */}
                <div className="absolute top-0 w-0.5 h-full bg-black z-10" style={{ left: "65%" }} />
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <span className="text-gray-600">연주 {instrumentPercent}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-gray-600">휴식 {100 - instrumentPercent}%</span>
                </div>
              </div>
            </div>

            {/* 다시 듣기 */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                </div>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full" style={{ width: "65%" }} />
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">29:30/45:22</span>
              </div>
            </div>

            {/* AI 코칭 */}
            <div className="bg-violet-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-medium text-violet-700">AI 코칭</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-violet-800 leading-relaxed">
                  • 적절한 휴식을 취하며 연습하셨네요. 집중력 유지에 좋은 패턴입니다.
                </p>
                <p className="text-xs text-violet-800 leading-relaxed">
                  • 30분 이상 집중 연습, 좋은 시작입니다!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 bg-white border-t border-gray-100 p-4 flex gap-3 rounded-b-2xl">
          <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">
            저장 안함
          </button>
          <button className="flex-1 py-3 bg-black text-white rounded-xl font-medium">
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  라우터
// ═══════════════════════════════════════════════

const mockupMap: Record<string, () => React.ReactNode> = {
  home: HomeMockup,
  practice: PracticeMockup,
  "ai-analysis": AIAnalysisMockup,
  stats: StatsMockup,
  feedback: FeedbackMockup,
  help: HelpMockup,
  ranking: RankingMockup,
  metronome: MetronomeMockup,
  "music-terms": MusicTermsMockup,
  rooms: RoomsMockup,
  teachers: TeachersMockup,
  recordings: RecordingsMockup,
  records: RecordsMockup,
  goals: GoalsMockup,
  routines: RoutinesMockup,
  profile: ProfileMockup,
  songs: SongsMockup,
  notifications: NotificationsMockup,
  "practice-complete": PracticeCompleteMockup,
  "practice-main": PracticeMainMockup,
  "ai-report": AIReportMockup,
  "lesson": LessonMockup,
  "room-detail": RoomDetailMockup,
  "practice-plan": PracticePlanMockup,
};

export default function MockupPage({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = use(params);
  const Renderer = mockupMap[feature];

  if (!Renderer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">존재하지 않는 목업입니다: {feature}</p>
      </div>
    );
  }

  return <>{Renderer()}</>;
}
