"use client";

import { useState } from "react";
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
  Check,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";

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

const goalOptions = [15, 30, 45, 60, 90, 120];
const languageOptions = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

export default function ProfilePage() {
  const [dailyGoal, setDailyGoal] = useState(mockUser.dailyGoal);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("ko");

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleLogout = () => {
    if (confirm("정말 로그아웃 하시겠습니까?")) {
      localStorage.removeItem("grit-on-logged-in");
      window.location.href = "/";
    }
  };

  const settingsItems = [
    {
      icon: Target,
      label: "일일 목표",
      value: `${dailyGoal}분`,
      onClick: () => setIsGoalModalOpen(true),
    },
    {
      icon: Bell,
      label: "알림 설정",
      value: notifications ? "켜짐" : "꺼짐",
      onClick: () => setIsNotificationModalOpen(true),
    },
    {
      icon: Globe,
      label: "언어",
      value: languageOptions.find((l) => l.code === language)?.label || "한국어",
      onClick: () => setIsLanguageModalOpen(true),
    },
  ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{mockUser.name}</h2>
            <p className="text-sm text-gray-500">{mockUser.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Music className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">{mockUser.instrument}</span>
              </div>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-500">{mockUser.level}</span>
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
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            >
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
            onClick={item.onClick}
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
        <h3 className="text-sm font-semibold text-gray-900 mb-4">나의 연습 통계</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-24">
            <Timer className="w-5 h-5 text-blue-500 mb-2" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                {mockUser.totalPracticeHours}
                <span className="text-xs font-normal text-gray-500 ml-1">시간</span>
              </div>
              <div className="text-xs text-gray-500">총 연습 시간</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-24">
            <CheckCircle2 className="w-5 h-5 text-green-500 mb-2" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                {mockUser.totalAnalysis}
                <span className="text-xs font-normal text-gray-500 ml-1">개</span>
              </div>
              <div className="text-xs text-gray-500">분석 완료</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-24">
            <BarChart2 className="w-5 h-5 text-orange-500 mb-2" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                {mockUser.streakDays}
                <span className="text-xs font-normal text-gray-500 ml-1">일</span>
              </div>
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

      {/* Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="일일 목표 설정"
      >
        <div className="p-4 space-y-2">
          {goalOptions.map((goal) => (
            <button
              key={goal}
              onClick={() => {
                setDailyGoal(goal);
                setIsGoalModalOpen(false);
              }}
              className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between ${
                dailyGoal === goal
                  ? "border-primary bg-primary/5"
                  : "border-gray-100 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Target
                  className={`w-5 h-5 ${dailyGoal === goal ? "text-primary" : "text-gray-400"}`}
                />
                <span className={`font-medium ${dailyGoal === goal ? "text-primary" : "text-gray-700"}`}>
                  {goal}분
                </span>
              </div>
              {dailyGoal === goal && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* Notification Modal */}
      <Modal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        title="알림 설정"
      >
        <div className="p-4 space-y-4">
          <button
            onClick={() => {
              setNotifications(true);
              setIsNotificationModalOpen(false);
            }}
            className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between ${
              notifications
                ? "border-primary bg-primary/5"
                : "border-gray-100 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className={`w-5 h-5 ${notifications ? "text-primary" : "text-gray-400"}`} />
              <div>
                <span className={`font-medium ${notifications ? "text-primary" : "text-gray-700"}`}>
                  알림 켜기
                </span>
                <p className="text-xs text-gray-500 mt-0.5">연습 리마인더와 분석 결과를 받아요</p>
              </div>
            </div>
            {notifications && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>

          <button
            onClick={() => {
              setNotifications(false);
              setIsNotificationModalOpen(false);
            }}
            className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between ${
              !notifications
                ? "border-primary bg-primary/5"
                : "border-gray-100 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className={`w-5 h-5 ${!notifications ? "text-primary" : "text-gray-400"}`} />
              <div>
                <span className={`font-medium ${!notifications ? "text-primary" : "text-gray-700"}`}>
                  알림 끄기
                </span>
                <p className="text-xs text-gray-500 mt-0.5">알림을 받지 않아요</p>
              </div>
            </div>
            {!notifications && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        </div>
      </Modal>

      {/* Language Modal */}
      <Modal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        title="언어 설정"
      >
        <div className="p-4 space-y-2">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsLanguageModalOpen(false);
              }}
              className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between ${
                language === lang.code
                  ? "border-primary bg-primary/5"
                  : "border-gray-100 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe
                  className={`w-5 h-5 ${language === lang.code ? "text-primary" : "text-gray-400"}`}
                />
                <span
                  className={`font-medium ${language === lang.code ? "text-primary" : "text-gray-700"}`}
                >
                  {lang.label}
                </span>
              </div>
              {language === lang.code && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* Upgrade Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Pro 플랜"
      >
        <div className="p-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">GRIT.ON Pro</h3>
            <p className="text-gray-500 mt-1">무제한 AI 분석으로 실력을 높이세요</p>
          </div>

          <div className="space-y-3 mb-6">
            {[
              "무제한 AI 연습 분석",
              "상세 진도 리포트",
              "맞춤형 연습 계획",
              "클라우드 녹음 저장",
              "광고 제거",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-gray-900">₩9,900</span>
              <span className="text-gray-500">/월</span>
            </div>
            <p className="text-xs text-gray-500 text-center mt-1">언제든지 취소 가능</p>
          </div>

          <button
            onClick={() => {
              alert("결제 기능은 추후 구현 예정입니다.");
              setIsUpgradeModalOpen(false);
            }}
            className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            Pro 시작하기
          </button>
        </div>
      </Modal>
    </div>
  );
}
