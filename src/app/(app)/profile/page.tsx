"use client";

import {
  User,
  Music,
  Target,
  Bell,
  Globe,
  LogOut,
  ChevronRight,
  Crown,
  BarChart2,
  CheckCircle2,
  CalendarDays,
  Timer,
} from "lucide-react";

const mockUser = {
  name: "김지민",
  email: "jimin.kim@gmail.com",
  instrument: "피아노",
  level: "중급",
  dailyGoal: 60,
  plan: "free",
  joinDate: "2024.03.15",
  totalPracticeHours: 127.5,
  totalAnalysis: 47,
  streakDays: 23,
  longestStreak: 31,
  averageScore: 82,
};

const settingsItems = [
  {
    icon: Target,
    label: "일일 목표",
    value: `${mockUser.dailyGoal}분`,
  },
  {
    icon: Bell,
    label: "알림 설정",
    value: "켜짐",
  },
  {
    icon: Globe,
    label: "언어",
    value: "한국어",
  },
];

export default function ProfilePage() {
  const handleLogout = () => {
    localStorage.removeItem("grit-on-logged-in");
    window.location.href = "/";
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">
              {mockUser.name}
            </h2>
            <p className="text-sm text-gray-500">{mockUser.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <Music className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary">
                {mockUser.instrument}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-4 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">
                {mockUser.plan === "free" ? "무료 플랜" : "Pro 플랜"}
              </span>
            </div>
            <p className="text-xs text-white/80 mt-1">
              {mockUser.plan === "free"
                ? "Pro로 업그레이드하여 무제한 분석을 이용하세요"
                : "무제한 분석 이용 중"}
            </p>
          </div>
          {mockUser.plan === "free" && (
            <button className="bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              업그레이드
            </button>
          )}
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <h3 className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100 bg-gray-50/50">
          설정
        </h3>
        {settingsItems.map((item, index) => (
          <button
            key={index}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{item.value}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          나의 연습 통계
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-24">
            <Timer className="w-5 h-5 text-blue-500 mb-2" />
            <div>
              <div className="text-xl font-bold text-gray-900">{mockUser.totalPracticeHours}<span className="text-xs font-normal text-gray-500 ml-1">시간</span></div>
              <div className="text-xs text-gray-500">총 연습 시간</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-24">
            <CheckCircle2 className="w-5 h-5 text-green-500 mb-2" />
            <div>
              <div className="text-xl font-bold text-gray-900">{mockUser.totalAnalysis}<span className="text-xs font-normal text-gray-500 ml-1">개</span></div>
              <div className="text-xs text-gray-500">분석 완료</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-24">
            <BarChart2 className="w-5 h-5 text-orange-500 mb-2" />
            <div>
              <div className="text-xl font-bold text-gray-900">{mockUser.streakDays}<span className="text-xs font-normal text-gray-500 ml-1">일</span></div>
              <div className="text-xs text-gray-500">연속 연습</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-24">
            <CalendarDays className="w-5 h-5 text-purple-500 mb-2" />
            <div>
              <div className="text-sm font-bold text-gray-900 mt-1">{mockUser.joinDate}</div>
              <div className="text-xs text-gray-500 mt-1">가입일</div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors mb-20"
      >
        <LogOut className="w-4 h-4" />
        로그아웃
      </button>
    </div>
  );
}
