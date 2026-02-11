"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Music,
  Target,
  Bell,
  Globe,
  LogOut,
  ChevronRight,
  Crown,
  Check,
  Sparkles,
  Clock,
  Flame,
  Trophy,
  Star,
  Zap,
  Award,
  BookOpen,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { getAllSessions, getPracticeStats } from "@/lib/db";

const mockUser = {
  nickname: "피아노하는민지",
  instrument: "피아노",
  grade: "고2",
  type: "전공", // "전공" | "취미"
  dailyGoal: 60,
  plan: "free",
};

interface AnalysisItem {
  id: string;
  composer: string;
  title: string;
  difficulty: string;
  updatedAt: string;
}

interface Badge {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  earned: boolean;
  color: string;
}

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

  // 데이터 상태
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        // 분석 목록 가져오기
        const analysesRes = await fetch("/api/analyses");
        const analysesData = await analysesRes.json();
        if (analysesData.success) {
          setAnalyses(analysesData.data);
        }

        // 연습 통계 가져오기
        const stats = await getPracticeStats();
        setTotalHours(Math.round(stats.totalPracticeTime / 3600 * 10) / 10);

        // 세션 데이터로 추가 통계 계산
        const allSessions = await getAllSessions();

        // 이번 주 세션 수
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const thisWeekSessions = allSessions.filter(s => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= weekStart;
        });
        setWeekSessions(thisWeekSessions.length);

        // 연속 연습 계산 (현재 & 최대)
        const { current, max } = calculateStreaks(allSessions);
        setCurrentStreak(current);
        setMaxStreak(max);

        // 배지 계산
        const earnedBadges = calculateBadges(allSessions, stats, analysesData.data?.length || 0);
        setBadges(earnedBadges);
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // 연속 일수 계산 함수
  function calculateStreaks(sessions: { startTime: Date }[]): { current: number; max: number } {
    if (sessions.length === 0) return { current: 0, max: 0 };

    const dateSet = new Set<string>();
    sessions.forEach(s => {
      const date = new Date(s.startTime);
      date.setHours(0, 0, 0, 0);
      dateSet.add(date.toISOString());
    });

    const dates = Array.from(dateSet).map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
    if (dates.length === 0) return { current: 0, max: 0 };

    // 현재 연속 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let current = 0;
    let checkDate = new Date(today);

    if (!dateSet.has(today.toISOString())) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (!dateSet.has(checkDate.toISOString())) {
        current = 0;
      }
    }

    if (current === 0 && dateSet.has(checkDate.toISOString())) {
      while (dateSet.has(checkDate.toISOString())) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // 최대 연속 계산
    let max = 0;
    let tempStreak = 1;
    const sortedDates = Array.from(dateSet).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());

    for (let i = 1; i < sortedDates.length; i++) {
      const diff = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        max = Math.max(max, tempStreak);
        tempStreak = 1;
      }
    }
    max = Math.max(max, tempStreak);

    return { current, max };
  }

  // 배지 계산 함수
  function calculateBadges(
    sessions: { startTime: Date; practiceTime: number }[],
    stats: { totalPracticeTime: number },
    analysisCount: number
  ): Badge[] {
    const totalHours = stats.totalPracticeTime / 3600;
    const { max } = calculateStreaks(sessions);

    // 3시간 이상 연습한 세션이 있는지
    const hasLongSession = sessions.some(s => s.practiceTime >= 3 * 60 * 60);

    return [
      {
        id: "first-analysis",
        icon: BookOpen,
        label: "첫 분석",
        description: "첫 번째 곡 분석 완료",
        earned: analysisCount >= 1,
        color: "blue",
      },
      {
        id: "week-streak",
        icon: Flame,
        label: "7일 연속",
        description: "7일 연속 연습 달성",
        earned: max >= 7,
        color: "orange",
      },
      {
        id: "focus-3h",
        icon: Zap,
        label: "3시간 집중",
        description: "한 세션에서 3시간 연습",
        earned: hasLongSession,
        color: "yellow",
      },
      {
        id: "10-analyses",
        icon: Star,
        label: "분석 마스터",
        description: "10개 곡 분석 완료",
        earned: analysisCount >= 10,
        color: "purple",
      },
      {
        id: "100-hours",
        icon: Trophy,
        label: "100시간",
        description: "누적 100시간 연습",
        earned: totalHours >= 100,
        color: "green",
      },
      {
        id: "30-streak",
        icon: Award,
        label: "30일 연속",
        description: "30일 연속 연습 달성",
        earned: max >= 30,
        color: "red",
      },
    ];
  }

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
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{mockUser.nickname}</h2>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  {mockUser.grade}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  mockUser.type === "전공"
                    ? "bg-violet-100 text-violet-600"
                    : "bg-green-100 text-green-600"
                }`}>
                  {mockUser.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Music className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm text-gray-600">{mockUser.instrument}</span>
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

      {/* My Analysis List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">나의 분석 리스트</h3>
          <span className="text-xs text-gray-500">{analyses.length}곡</span>
        </div>
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-400">로딩 중...</div>
        ) : analyses.length === 0 ? (
          <div className="p-6 text-center">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">아직 분석한 곡이 없습니다</p>
            <Link href="/songs" className="text-xs text-primary mt-1 inline-block">
              곡 분석하러 가기 →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {analyses.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={`/songs/${item.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.composer}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </Link>
            ))}
            {analyses.length > 5 && (
              <Link
                href="/songs"
                className="block px-4 py-3 text-center text-sm text-primary hover:bg-gray-50 transition-colors"
              >
                전체 보기 ({analyses.length}곡)
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Practice Insights */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <h3 className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100 bg-gray-50/50">
          연습 인사이트
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <div className="p-4 text-center">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{isLoading ? "-" : totalHours}</p>
            <p className="text-xs text-gray-500">총 시간</p>
          </div>
          <div className="p-4 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{isLoading ? "-" : weekSessions}</p>
            <p className="text-xs text-gray-500">이번 주</p>
          </div>
          <div className="p-4 text-center">
            <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{isLoading ? "-" : maxStreak}</p>
            <p className="text-xs text-gray-500">최대 연속</p>
          </div>
        </div>

        {/* Badges */}
        <div className="p-4">
          <p className="text-xs font-medium text-gray-500 mb-3">활동 배지</p>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => {
              const colorClasses: Record<string, string> = {
                blue: badge.earned ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-300",
                orange: badge.earned ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-300",
                yellow: badge.earned ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-300",
                purple: badge.earned ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-300",
                green: badge.earned ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-300",
                red: badge.earned ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-300",
              };

              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                    badge.earned ? "opacity-100" : "opacity-50"
                  }`}
                  title={badge.description}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 ${colorClasses[badge.color]}`}>
                    <badge.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-medium text-center ${badge.earned ? "text-gray-700" : "text-gray-400"}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
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
