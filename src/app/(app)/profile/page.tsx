"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Camera,
  Pencil,
  Trash2,
  GraduationCap,
  Shield,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { getAllSessions, getPracticeStats } from "@/lib/db";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { TeacherVerificationStatus } from "@/types";
import BlurText from "@/components/reactbits/BlurText";
import GradientText from "@/components/reactbits/GradientText";

/* ─── Animation variants ─── */
const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const listItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

/* ─── SpotlightCard (mouse-following violet glow) ─── */
function SpotlightCard({
  children,
  className = "",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <Link
      ref={cardRef}
      href={href}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(200px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139,92,246,0.12), transparent 60%)`,
          }}
        />
      )}
      <div className="relative z-10 flex items-center gap-3 w-full">{children}</div>
    </Link>
  );
}

/* ─── Data helpers ─── */
const defaultUser = {
  nickname: "지민",
  instrument: "피아노",
  grade: "고2",
  type: "전공", // "전공" | "취미"
  dailyGoal: 60,
  plan: "free",
  profileImage: "", // base64 or URL
};

const PROFILE_STORAGE_KEY = "grit-on-profile";

function loadProfile() {
  if (typeof window === "undefined") return defaultUser;
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) return { ...defaultUser, ...JSON.parse(saved) };
  } catch {}
  return defaultUser;
}

function saveProfile(data: Partial<typeof defaultUser>) {
  try {
    const current = loadProfile();
    const updated = { ...current, ...data };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {}
  return { ...defaultUser, ...data };
}

const gradeOptions = ["중1", "중2", "중3", "고1", "고2", "고3", "대학생", "일반"];
const typeOptions = ["전공", "취미"];
const instrumentOptions = [
  { name: "피아노", emoji: "🎹" },
  { name: "바이올린", emoji: "🎻" },
  { name: "비올라", emoji: "🎻" },
  { name: "첼로", emoji: "🎻" },
  { name: "콘트라베이스", emoji: "🎻" },
  { name: "플루트", emoji: "🪈" },
  { name: "오보에", emoji: "🎵" },
  { name: "클라리넷", emoji: "🎵" },
  { name: "바순", emoji: "🎵" },
  { name: "호른", emoji: "📯" },
  { name: "트럼펫", emoji: "🎺" },
  { name: "트롬본", emoji: "🎺" },
  { name: "튜바", emoji: "🎺" },
  { name: "하프", emoji: "🎵" },
  { name: "타악기", emoji: "🥁" },
  { name: "성악", emoji: "🎤" },
  { name: "작곡", emoji: "🎼" },
  { name: "지휘", emoji: "🎼" },
];

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
  const [profile, setProfile] = useState(defaultUser);
  const [dailyGoal, setDailyGoal] = useState(defaultUser.dailyGoal);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("ko");

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);

  // 프로필 편집 상태
  const [editNickname, setEditNickname] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editType, setEditType] = useState("");
  const [editInstrument, setEditInstrument] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 데이터 상태
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 선생님 모드
  const { isTeacher, teacherMode, verificationStatus, toggleMode, reload: reloadTeacher } = useTeacherMode();

  // 초기 프로필 로드
  useEffect(() => {
    const saved = loadProfile();
    setProfile(saved);
    setDailyGoal(saved.dailyGoal);
  }, []);

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

  // 프로필 편집 모달 열기
  const openEditProfile = () => {
    setEditNickname(profile.nickname);
    setEditGrade(profile.grade);
    setEditType(profile.type);
    setEditInstrument(profile.instrument);
    setIsEditProfileOpen(true);
  };

  // 프로필 저장
  const handleSaveProfile = () => {
    if (!editNickname.trim()) return;
    const updated = saveProfile({
      nickname: editNickname.trim(),
      grade: editGrade,
      type: editType,
      instrument: editInstrument,
    });
    setProfile(updated);
    setIsEditProfileOpen(false);
  };

  // 프로필 사진 선택
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB 제한
    if (file.size > 5 * 1024 * 1024) {
      alert("사진 크기는 5MB 이하여야 합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        // 리사이즈 (200x200)
        const canvas = document.createElement("canvas");
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        // 정사각형 크롭
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        const updated = saveProfile({ profileImage: base64 });
        setProfile(updated);
        setIsPhotoMenuOpen(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = "";
  };

  // 프로필 사진 삭제
  const handleRemovePhoto = () => {
    const updated = saveProfile({ profileImage: "" });
    setProfile(updated);
    setIsPhotoMenuOpen(false);
  };

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
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />

      {/* ─── Profile Header ─── */}
      <motion.div
        className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4">
          {/* 프로필 사진 (탭하면 사진 메뉴) */}
          <button
            onClick={() => setIsPhotoMenuOpen(true)}
            className="relative w-16 h-16 rounded-full shrink-0 group"
          >
            {profile.profileImage ? (
              <Image
                src={profile.profileImage}
                alt="프로필"
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center border-2 border-white">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <BlurText
                text={profile.nickname}
                className="text-xl font-bold text-gray-900"
                animateBy="letters"
                delay={50}
                direction="top"
              />
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-white/60 text-gray-600 text-xs font-medium rounded-full">
                  {profile.grade}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  profile.type === "전공"
                    ? "bg-violet-100/60 text-violet-600"
                    : "bg-green-100/60 text-green-600"
                }`}>
                  {profile.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Music className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm text-gray-600">{profile.instrument}</span>
            </div>
          </div>

          {/* 편집 버튼 */}
          <button
            type="button"
            onClick={openEditProfile}
            className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/50 active:bg-white/60 transition-colors shrink-0 cursor-pointer"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </motion.div>

      {/* ─── Subscription Card ─── */}
      <motion.div
        className="bg-gradient-to-r from-primary to-purple-600 rounded-3xl p-4 mb-6 text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <GradientText
                colors={["#ffffff", "#e9d5ff", "#ffffff"]}
                animationSpeed={5}
                className="text-sm font-medium !mx-0"
              >
                {profile.plan === "free" ? "무료 플랜" : "Pro 플랜"}
              </GradientText>
            </div>
            <p className="text-xs text-white/80 mt-1">
              {profile.plan === "free"
                ? "Pro로 업그레이드하여 무제한 분석을 이용하세요"
                : "무제한 분석 이용 중"}
            </p>
          </div>
          {profile.plan === "free" && (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            >
              업그레이드
            </button>
          )}
        </div>
      </motion.div>

      {/* ─── Teacher Section ─── */}
      <motion.div
        className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <div className="px-4 py-3">
          <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100/60 backdrop-blur-sm px-3.5 py-1 rounded-full">
            선생님
          </span>
        </div>
        {isTeacher ? (
          <>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/30">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-500" />
                <div>
                  <span className="text-sm text-gray-700">인증 상태</span>
                  <span className="ml-2 px-2 py-0.5 bg-green-100/60 text-green-700 text-xs font-medium rounded-full">
                    인증됨
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                toggleMode();
                reloadTeacher();
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/30 transition-colors border-b border-white/30"
            >
              <div className="flex items-center gap-3">
                {teacherMode ? (
                  <ToggleRight className="w-5 h-5 text-violet-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-sm text-gray-700">선생님 모드</span>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors ${teacherMode ? "bg-violet-600" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${teacherMode ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </button>
            <Link
              href="/profile/teacher-profile"
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Pencil className="w-5 h-5 text-violet-500" />
                <span className="text-sm text-gray-700">프로필 관리</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          </>
        ) : (
          <Link
            href="/profile/teacher-register"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-white/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-violet-500" />
              <div>
                <span className="text-sm text-gray-700">선생님 등록</span>
                {verificationStatus === "pending" && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100/60 text-amber-700 text-xs font-medium rounded-full">
                    심사중
                  </span>
                )}
                {verificationStatus === "rejected" && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100/60 text-red-700 text-xs font-medium rounded-full">
                    반려됨
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        )}
      </motion.div>

      {/* ─── Settings List ─── */}
      <motion.div
        className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden mb-8"
        variants={listContainer}
        initial="hidden"
        animate="show"
      >
        <div className="px-4 py-3">
          <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100/60 backdrop-blur-sm px-3.5 py-1 rounded-full">
            설정
          </span>
        </div>
        {settingsItems.map((item, index) => (
          <motion.button
            key={index}
            variants={listItem}
            onClick={item.onClick}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/30 transition-colors border-b border-white/30 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{item.value}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* ─── My Analysis List ─── */}
      <motion.div
        className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100/60 backdrop-blur-sm px-3.5 py-1 rounded-full">
            나의 분석 리스트
          </span>
          <span className="text-xs text-gray-500">{analyses.length}곡</span>
        </div>
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-400">로딩 중...</div>
        ) : analyses.length === 0 ? (
          <div className="p-6 text-center">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">아직 분석한 곡이 없습니다</p>
            <Link href="/analysis" className="text-xs text-primary mt-1 inline-block">
              곡 분석하러 가기 →
            </Link>
          </div>
        ) : (
          <motion.div variants={listContainer} initial="hidden" animate="show">
            {analyses.slice(0, 5).map((item, idx) => (
              <motion.div key={`${item.id}-${idx}`} variants={listItem}>
                <SpotlightCard
                  href={`/songs/${item.id}`}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-white/30 transition-colors ${
                    idx !== Math.min(analyses.length, 5) - 1 ? "border-b border-white/30" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.composer}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </SpotlightCard>
              </motion.div>
            ))}
            {analyses.length > 5 && (
              <Link
                href="/analysis"
                className="block px-4 py-3 text-center text-sm text-primary hover:bg-white/30 transition-colors"
              >
                전체 보기 ({analyses.length}곡)
              </Link>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ─── Practice Insights ─── */}
      <motion.div
        className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
      >
        <div className="px-4 py-3">
          <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100/60 backdrop-blur-sm px-3.5 py-1 rounded-full">
            연습 인사이트
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 divide-x divide-white/30 border-b border-white/30">
          {[
            { icon: Clock, color: "text-blue-500", value: totalHours, label: "총 시간" },
            { icon: Flame, color: "text-orange-500", value: weekSessions, label: "이번 주" },
            { icon: Trophy, color: "text-yellow-500", value: maxStreak, label: "최대 연속" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="p-4 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.3 + i * 0.08, ease: "easeOut" }}
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
              <p className="text-lg font-bold text-gray-900">{isLoading ? "-" : stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Badges */}
        <div className="p-4">
          <p className="text-xs font-medium text-gray-500 mb-3">활동 배지</p>
          <motion.div
            className="grid grid-cols-3 gap-3"
            variants={listContainer}
            initial="hidden"
            animate="show"
          >
            {badges.map((badge) => {
              const colorClasses: Record<string, string> = {
                blue: badge.earned ? "bg-blue-100/60 text-blue-600" : "bg-white/30 text-gray-300",
                orange: badge.earned ? "bg-orange-100/60 text-orange-600" : "bg-white/30 text-gray-300",
                yellow: badge.earned ? "bg-yellow-100/60 text-yellow-600" : "bg-white/30 text-gray-300",
                purple: badge.earned ? "bg-purple-100/60 text-purple-600" : "bg-white/30 text-gray-300",
                green: badge.earned ? "bg-green-100/60 text-green-600" : "bg-white/30 text-gray-300",
                red: badge.earned ? "bg-red-100/60 text-red-600" : "bg-white/30 text-gray-300",
              };

              return (
                <motion.div
                  key={badge.id}
                  variants={listItem}
                  className={`flex flex-col items-center p-3 bg-white/30 rounded-2xl transition-all ${
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
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>

      {/* ─── Logout ─── */}
      <motion.button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 text-red-500 text-sm font-medium bg-white/30 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/50 transition-colors mb-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        <LogOut className="w-4 h-4" />
        로그아웃
      </motion.button>

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

      {/* Photo Menu Modal */}
      <Modal
        isOpen={isPhotoMenuOpen}
        onClose={() => setIsPhotoMenuOpen(false)}
        title="프로필 사진"
      >
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-5 h-5 text-violet-600" />
            <span className="text-sm font-medium text-gray-700">
              {profile.profileImage ? "사진 변경" : "사진 선택"}
            </span>
          </button>
          {profile.profileImage && (
            <button
              onClick={handleRemovePhoto}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-500">사진 삭제</span>
            </button>
          )}
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="프로필 설정"
      >
        <div className="p-4 space-y-5">
          {/* 프로필 사진 미리보기 */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setIsEditProfileOpen(false);
                setTimeout(() => setIsPhotoMenuOpen(true), 300);
              }}
              className="relative w-20 h-20 rounded-full group"
            >
              {profile.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt="프로필"
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center border-2 border-white">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">닉네임</label>
            <input
              type="text"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              maxLength={20}
              placeholder="닉네임을 입력하세요"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{editNickname.length}/20</p>
          </div>

          {/* 학년 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">학년</label>
            <div className="flex flex-wrap gap-2">
              {gradeOptions.map((g) => (
                <button
                  key={g}
                  onClick={() => setEditGrade(g)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    editGrade === g
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* 전공/취미 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">유형</label>
            <div className="flex gap-2">
              {typeOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setEditType(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    editType === t
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 악기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">악기</label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {instrumentOptions.map((inst) => (
                <button
                  key={inst.name}
                  onClick={() => setEditInstrument(inst.name)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    editInstrument === inst.name
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{inst.emoji}</span>
                  {inst.name}
                </button>
              ))}
            </div>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSaveProfile}
            disabled={!editNickname.trim()}
            className="w-full py-3.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            저장하기
          </button>
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
            <h3 className="text-xl font-bold text-gray-900">Sempre Pro</h3>
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
