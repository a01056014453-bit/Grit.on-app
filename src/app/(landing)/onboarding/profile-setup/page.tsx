"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ChevronRight, Check, Loader2, FileText, Shield } from "lucide-react";
import { isNicknameAvailable } from "@/lib/queries/profiles";
import { getUserId } from "@/lib/user-id";

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

// 한글 악기명 → DB enum 매핑
const INSTRUMENT_TO_ENUM: Record<string, string> = {
  "피아노": "piano",
  "바이올린": "violin",
  "첼로": "cello",
  "비올라": "violin",
  "플루트": "flute",
  "클라리넷": "clarinet",
  "기타": "guitar",
};

/* ─── Types ─── */

interface UserProfile {
  nickname: string;
  ageGroup: string;
  instruments: string[];
  profileEmoji: string;
  createdAt: string;
}

type NicknameStatus = "idle" | "checking" | "available" | "taken";

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

  // 약관 동의 state
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // Form state
  const [nickname, setNickname] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [profileEmoji, setProfileEmoji] = useState("👤");

  // Nickname duplicate check
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkNickname = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNicknameStatus("idle");
      return;
    }
    setNicknameStatus("checking");
    const available = await isNicknameAvailable(trimmed, getUserId());
    // 값이 변경되었을 수 있으므로 최신 상태와 비교
    setNicknameStatus(available ? "available" : "taken");
  }, []);

  const handleNicknameChange = (value: string) => {
    const sliced = value.slice(0, 12);
    setNickname(sliced);
    setNicknameStatus("idle");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (sliced.trim().length >= 2) {
      debounceRef.current = setTimeout(() => checkNickname(sliced), 500);
    }
  };

  const handleGenerateNickname = async () => {
    // 최대 5번 시도하여 사용 가능한 닉네임 찾기
    setNicknameStatus("checking");
    for (let i = 0; i < 5; i++) {
      const generated = generateNickname();
      const available = await isNicknameAvailable(generated, getUserId());
      if (available) {
        setNickname(generated);
        setNicknameStatus("available");
        return;
      }
    }
    // 5번 모두 중복이면 그냥 마지막 생성된 것 사용 (거의 불가능)
    const fallback = generateNickname();
    setNickname(fallback);
    setNicknameStatus("available");
  };

  const toggleInstrument = (name: string) => {
    setInstruments((prev) =>
      prev.includes(name)
        ? prev.filter((i) => i !== name)
        : [...prev, name]
    );
  };

  const [showCelebration, setShowCelebration] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const finalNickname = nickname.trim() || generateNickname();

    // localStorage 저장 (오프라인 대비)
    const profile: UserProfile = {
      nickname: finalNickname,
      ageGroup,
      instruments,
      profileEmoji,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(ONBOARDING_KEY, "true");

    // 서버 API로 프로필 저장 (service_role로 RLS 우회)
    const primaryInstrument = instruments[0]
      ? (INSTRUMENT_TO_ENUM[instruments[0]] ?? "piano")
      : "piano";

    const authProvider = localStorage.getItem("sempre-auth") || undefined;

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: finalNickname,
          name: finalNickname,
          instrument: primaryInstrument,
          level: ageGroup,
          auth_provider: authProvider,
          agreed_terms: true,
          agreed_privacy: true,
          agreed_marketing: agreeMarketing,
          agreed_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("[profile-setup] 프로필 저장 실패:", data.error);
      }
    } catch (err) {
      console.error("[profile-setup] 프로필 저장 오류:", err);
    }

    setShowCelebration(true);

    // 이미 로그인된 상태면 홈으로, 아니면 로그인 페이지로
    const authStatus = localStorage.getItem("sempre-auth");
    if (authStatus) {
      setTimeout(() => router.push("/"), 2500);
    } else {
      setTimeout(() => router.push("/onboarding/login"), 2500);
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const allRequiredAgreed = agreeTerms && agreePrivacy && agreeAge;

  const handleAgreeAll = () => {
    const allChecked = agreeTerms && agreePrivacy && agreeAge && agreeMarketing;
    setAgreeTerms(!allChecked);
    setAgreePrivacy(!allChecked);
    setAgreeAge(!allChecked);
    setAgreeMarketing(!allChecked);
  };

  const totalSteps = 5;
  const nicknameValid = nickname.trim().length >= 2;
  const canProceed = (() => {
    switch (step) {
      case 0: return allRequiredAgreed;
      case 1: return nicknameValid && nicknameStatus !== "taken" && nicknameStatus !== "checking";
      case 2: return ageGroup !== "";
      case 3: return instruments.length > 0;
      case 4: return true;
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
      <div className="px-6">
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
            {/* Step 0: 약관 동의 */}
            {step === 0 && (
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">
                  서비스 이용 동의
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                  Sempre를 시작하기 전에 동의가 필요해요
                </p>

                {/* 전체 동의 */}
                <button
                  onClick={handleAgreeAll}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 mb-4 transition-all ${
                    agreeTerms && agreePrivacy && agreeAge && agreeMarketing
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    agreeTerms && agreePrivacy && agreeAge && agreeMarketing
                      ? "border-violet-500 bg-violet-500"
                      : "border-gray-300"
                  }`}>
                    {agreeTerms && agreePrivacy && agreeAge && agreeMarketing && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-base font-bold text-gray-900">전체 동의</span>
                </button>

                <div className="space-y-1 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* 이용약관 */}
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <button
                      onClick={() => setAgreeTerms(!agreeTerms)}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        agreeTerms ? "border-violet-500 bg-violet-500" : "border-gray-300"
                      }`}>
                        {agreeTerms && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">
                        <span className="text-violet-600 font-medium">[필수]</span> 서비스 이용약관
                      </span>
                    </button>
                    <Link href="/terms" className="text-xs text-gray-400 underline">보기</Link>
                  </div>

                  <div className="h-px bg-gray-100 mx-4" />

                  {/* 개인정보 처리방침 */}
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <button
                      onClick={() => setAgreePrivacy(!agreePrivacy)}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        agreePrivacy ? "border-violet-500 bg-violet-500" : "border-gray-300"
                      }`}>
                        {agreePrivacy && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">
                        <span className="text-violet-600 font-medium">[필수]</span> 개인정보 처리방침
                      </span>
                    </button>
                    <Link href="/privacy" className="text-xs text-gray-400 underline">보기</Link>
                  </div>

                  <div className="h-px bg-gray-100 mx-4" />

                  {/* 만 14세 이상 */}
                  <div className="flex items-center px-4 py-3.5">
                    <button
                      onClick={() => setAgreeAge(!agreeAge)}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        agreeAge ? "border-violet-500 bg-violet-500" : "border-gray-300"
                      }`}>
                        {agreeAge && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">
                        <span className="text-violet-600 font-medium">[필수]</span> 만 14세 이상입니다
                      </span>
                    </button>
                  </div>

                  <div className="h-px bg-gray-100 mx-4" />

                  {/* 마케팅 수신 동의 */}
                  <div className="flex items-center px-4 py-3.5">
                    <button
                      onClick={() => setAgreeMarketing(!agreeMarketing)}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        agreeMarketing ? "border-violet-500 bg-violet-500" : "border-gray-300"
                      }`}>
                        {agreeMarketing && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">
                        <span className="text-gray-400">[선택]</span> 마케팅 정보 수신 동의
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Nickname */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">
                  별명을 정해주세요
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                  다른 연주자들에게 보여지는 이름이에요
                </p>

                <div className="relative mb-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => handleNicknameChange(e.target.value)}
                    placeholder="별명 입력 (2~12자)"
                    maxLength={12}
                    className={`w-full px-4 py-4 rounded-2xl border-2 bg-white text-lg font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none transition-colors ${
                      nicknameStatus === "taken"
                        ? "border-red-400 focus:border-red-400"
                        : nicknameStatus === "available"
                        ? "border-green-400 focus:border-green-400"
                        : "border-gray-200 focus:border-violet-400"
                    }`}
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-300">
                    {nickname.length}/12
                  </span>
                </div>

                {/* Nickname status message */}
                <div className="h-5 mb-3">
                  {nicknameStatus === "checking" && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      확인 중...
                    </p>
                  )}
                  {nicknameStatus === "available" && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      사용 가능한 별명이에요
                    </p>
                  )}
                  {nicknameStatus === "taken" && (
                    <p className="text-xs text-red-500">
                      이미 사용 중인 별명이에요. 다른 별명을 입력해주세요.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleGenerateNickname}
                  disabled={nicknameStatus === "checking"}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200 text-violet-600 text-sm font-medium active:scale-[0.98] transition-all w-full justify-center disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  자동 생성
                </button>

                {nickname && nicknameStatus !== "taken" && (
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

            {/* Step 2: Age Group */}
            {step === 2 && (
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

            {/* Step 3: Instruments */}
            {step === 3 && (
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

            {/* Step 4: Profile Emoji */}
            {step === 4 && (
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
      <div className="px-6 pb-8 pt-6">
        <button
          onClick={() => {
            if (step < totalSteps - 1) {
              setStep((s) => s + 1);
            } else {
              handleComplete();
            }
          }}
          disabled={!canProceed || isSaving}
          className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#8B5CF6" }}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              저장 중...
            </>
          ) : step === totalSteps - 1 ? (
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
