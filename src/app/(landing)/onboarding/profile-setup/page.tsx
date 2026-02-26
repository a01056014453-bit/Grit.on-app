"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ChevronRight, Check } from "lucide-react";

/* ─── Constants ─── */

const PROFILE_KEY = "sempre-user-profile";
const ONBOARDING_KEY = "sempre-onboarding-done";

const MUSIC_ADJECTIVES = [
  "빠른", "서정적", "열정", "우아한", "신비한", "밝은", "깊은",
  "감성", "섬세한", "당당한", "자유로운", "따뜻한", "영롱한", "경쾌한",
  "고요한", "화려한", "강렬한", "부드러운", "낭만", "청아한",
];

const INSTRUMENT_NAMES = [
  "피아노", "바이올린", "첼로", "비올라", "플루트", "클라리넷", "트럼펫",
];

const AGE_GROUPS = ["중학생", "고등학생", "대학생", "성인"];

const INSTRUMENT_OPTIONS = [
  { name: "피아노", emoji: "🎹" },
  { name: "바이올린", emoji: "🎻" },
  { name: "첼로", emoji: "🎻" },
  { name: "비올라", emoji: "🎻" },
  { name: "플루트", emoji: "🪈" },
  { name: "클라리넷", emoji: "🎵" },
  { name: "기타", emoji: "🎸" },
];

const EMOJI_OPTIONS = [
  "👤", "🎹", "🎻", "🎺", "🎷", "🎵", "🎼", "👩‍🎤", "👨‍🎤", "🧑‍🎓",
];

/* ─── Types ─── */

interface UserProfile {
  nickname: string;
  ageGroup: string;
  instruments: string[];
  profileEmoji: string;
  createdAt: string;
}

/* ─── Helpers ─── */

function generateNickname(): string {
  const adj = MUSIC_ADJECTIVES[Math.floor(Math.random() * MUSIC_ADJECTIVES.length)];
  const inst = INSTRUMENT_NAMES[Math.floor(Math.random() * INSTRUMENT_NAMES.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${inst}${num}`;
}

/* ─── Step Animation ─── */

const stepVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

const stepTransition = {
  type: "spring" as const,
  damping: 28,
  stiffness: 280,
};

/* ─── Main Page ─── */

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Form state
  const [nickname, setNickname] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [profileEmoji, setProfileEmoji] = useState("👤");

  const handleGenerateNickname = () => {
    setNickname(generateNickname());
  };

  const toggleInstrument = (name: string) => {
    setInstruments((prev) =>
      prev.includes(name)
        ? prev.filter((i) => i !== name)
        : [...prev, name]
    );
  };

  const [showCelebration, setShowCelebration] = useState(false);

  const handleComplete = () => {
    const finalNickname = nickname.trim() || generateNickname();
    const profile: UserProfile = {
      nickname: finalNickname,
      ageGroup,
      instruments,
      profileEmoji,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowCelebration(true);
    setTimeout(() => router.push("/"), 2500);
  };

  const totalSteps = 4;
  const canProceed = (() => {
    switch (step) {
      case 0: return nickname.trim().length >= 2;
      case 1: return ageGroup !== "";
      case 2: return instruments.length > 0;
      case 3: return true;
      default: return false;
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-14 pb-4">
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-200">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: i <= step ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">{step + 1} / {totalSteps}</p>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={stepTransition}
            className="h-full"
          >
            {/* Step 0: Nickname */}
            {step === 0 && (
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">
                  별명을 정해주세요
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                  다른 연주자들에게 보여지는 이름이에요
                </p>

                <div className="relative mb-4">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.slice(0, 12))}
                    placeholder="별명 입력 (2~12자)"
                    maxLength={12}
                    className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 bg-white text-lg font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-violet-400 transition-colors"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-300">
                    {nickname.length}/12
                  </span>
                </div>

                <button
                  onClick={handleGenerateNickname}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200 text-violet-600 text-sm font-medium active:scale-[0.98] transition-all w-full justify-center"
                >
                  <RefreshCw className="w-4 h-4" />
                  자동 생성
                </button>

                {nickname && (
                  <div className="mt-6 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400 mb-1">미리보기</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{profileEmoji}</span>
                      <span className="text-lg font-bold text-gray-900">{nickname}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Age Group */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">
                  나이대를 선택해주세요
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                  같은 또래 연주자들과 비교할 수 있어요
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {AGE_GROUPS.map((group) => (
                    <button
                      key={group}
                      onClick={() => setAgeGroup(group)}
                      className={`py-4 rounded-2xl border-2 text-base font-semibold transition-all active:scale-[0.97] ${
                        ageGroup === group
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Instruments */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">
                  연주하는 악기를 선택해주세요
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                  여러 개 선택할 수 있어요
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {INSTRUMENT_OPTIONS.map((inst) => {
                    const selected = instruments.includes(inst.name);
                    return (
                      <button
                        key={inst.name}
                        onClick={() => toggleInstrument(inst.name)}
                        className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                          selected
                            ? "border-violet-500 bg-violet-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <span className="text-2xl">{inst.emoji}</span>
                        <span className={`text-sm font-semibold ${selected ? "text-violet-700" : "text-gray-600"}`}>
                          {inst.name}
                        </span>
                        {selected && (
                          <Check className="w-5 h-5 text-violet-500 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Profile Emoji */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">
                  프로필 이모지를 선택해주세요
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                  나를 표현하는 이모지를 골라보세요
                </p>

                <div className="grid grid-cols-5 gap-3 mb-8">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setProfileEmoji(emoji)}
                      className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-3xl transition-all active:scale-[0.95] ${
                        profileEmoji === emoji
                          ? "border-violet-500 bg-violet-50 shadow-md shadow-violet-200"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Preview card */}
                <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-400 mb-3">프로필 미리보기</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-violet-50 border-2 border-violet-200 flex items-center justify-center text-3xl">
                      {profileEmoji}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{nickname || "사용자"}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {ageGroup && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            {ageGroup}
                          </span>
                        )}
                        {instruments.map((inst) => (
                          <span
                            key={inst}
                            className="px-2 py-0.5 bg-violet-100 text-violet-600 text-xs rounded-full"
                          >
                            {inst}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-12 pt-4">
        <button
          onClick={() => {
            if (step < totalSteps - 1) {
              setStep((s) => s + 1);
            } else {
              handleComplete();
            }
          }}
          disabled={!canProceed}
          className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#8B5CF6" }}
        >
          {step === totalSteps - 1 ? (
            "시작하기"
          ) : (
            <>
              다음 <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
          >
            {/* Confetti particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="confetti-particle absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-5%`,
                    width: `${6 + Math.random() * 8}px`,
                    height: `${6 + Math.random() * 8}px`,
                    backgroundColor: ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444"][i % 6],
                    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    animationDelay: `${Math.random() * 1}s`,
                    animationDuration: `${1.5 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.2 }}
              className="text-7xl mb-6"
            >
              🎉
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-black text-gray-900 mb-2"
            >
              환영합니다!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-gray-500 text-center leading-relaxed"
            >
              모든 준비가 완료됐어요<br />
              이제 연습을 시작해볼까요?
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 flex items-center gap-2 text-sm text-violet-500"
            >
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span>대시보드로 이동 중...</span>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
