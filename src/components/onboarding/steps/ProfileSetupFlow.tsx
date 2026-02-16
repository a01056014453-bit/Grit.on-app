"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

const BlurText = dynamic(() => import("@/components/reactbits/BlurText"), {
  ssr: false,
});

export interface OnboardingProfile {
  nickname: string;
  birthday: { year: number; month: number; day: number };
  instrument: string;
  type: string;
}

interface ProfileSetupFlowProps {
  onComplete: (profile: OnboardingProfile) => void;
}

const slideVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

const slideTransition = {
  type: "spring" as const,
  damping: 25,
  stiffness: 250,
};

function calculateGradeFromBirthday(birthday: {
  year: number;
  month: number;
  day: number;
}): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Korean school year starts in March
  const schoolYear =
    currentMonth >= 3 ? currentYear : currentYear - 1;
  const age = schoolYear - birthday.year;

  if (age <= 13) return "중1";
  if (age === 14) return "중2";
  if (age === 15) return "중3";
  if (age === 16) return "고1";
  if (age === 17) return "고2";
  if (age === 18) return "고3";
  if (age <= 22) return "대학생";
  return "일반";
}

/* ─── NicknameStep ─── */
function NicknameStep({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const isValid = value.trim().length >= 2;

  const handleNext = () => {
    if (!isValid) return;
    setChecking(true);
    // Mock duplicate check
    setTimeout(() => {
      setChecking(false);
      onNext();
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <BlurText
          text="당신을 뭐라고 불러드릴까요?"
          className="text-xl font-bold text-white justify-center"
          animateBy="words"
          delay={80}
          direction="top"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              if (e.target.value.length <= 8) onChange(e.target.value);
            }}
            placeholder="닉네임을 입력하세요"
            maxLength={8}
            className="w-full bg-transparent text-white text-center text-2xl font-bold placeholder:text-white/30 focus:outline-none"
            autoFocus
          />
          <p className="text-center text-violet-300/50 text-xs mt-3">
            {value.length}/8자
          </p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isValid ? 1 : 0.4, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={handleNext}
        disabled={!isValid || checking}
        className="mt-8 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-2xl px-8 py-3 flex items-center gap-2 transition-all active:scale-[0.97]"
      >
        {checking ? "확인 중..." : "다음"}
        {!checking && <ChevronRight className="w-4 h-4" />}
      </motion.button>
    </div>
  );
}

/* ─── BirthdayStep ─── */
function BirthdayStep({
  value,
  onChange,
  onNext,
}: {
  value: { year: number; month: number; day: number };
  onChange: (v: { year: number; month: number; day: number }) => void;
  onNext: () => void;
}) {
  const years = useMemo(
    () => Array.from({ length: 2018 - 1980 + 1 }, (_, i) => 1980 + i),
    []
  );
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i + 1),
    []
  );
  const days = useMemo(() => {
    if (!value.year || !value.month)
      return Array.from({ length: 31 }, (_, i) => i + 1);
    const daysInMonth = new Date(value.year, value.month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [value.year, value.month]);

  const isValid = value.year > 0 && value.month > 0 && value.day > 0;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-3"
      >
        <BlurText
          text="언제 태어나셨나요?"
          className="text-xl font-bold text-white justify-center"
          animateBy="words"
          delay={80}
          direction="top"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-violet-300/60 text-sm mb-10 text-center"
      >
        같은 또래 연주자들과 실력을 비교할 수 있어요
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="w-full max-w-sm flex gap-3"
      >
        {/* Year */}
        <select
          value={value.year || ""}
          onChange={(e) =>
            onChange({ ...value, year: Number(e.target.value) })
          }
          className="flex-1 bg-white/5 border border-white/20 rounded-xl text-white px-3 py-3.5 text-sm appearance-none text-center focus:outline-none focus:border-violet-400/50"
        >
          <option value="" disabled className="bg-gray-900">
            년도
          </option>
          {years.map((y) => (
            <option key={y} value={y} className="bg-gray-900">
              {y}년
            </option>
          ))}
        </select>

        {/* Month */}
        <select
          value={value.month || ""}
          onChange={(e) =>
            onChange({ ...value, month: Number(e.target.value) })
          }
          className="flex-1 bg-white/5 border border-white/20 rounded-xl text-white px-3 py-3.5 text-sm appearance-none text-center focus:outline-none focus:border-violet-400/50"
        >
          <option value="" disabled className="bg-gray-900">
            월
          </option>
          {months.map((m) => (
            <option key={m} value={m} className="bg-gray-900">
              {m}월
            </option>
          ))}
        </select>

        {/* Day */}
        <select
          value={value.day || ""}
          onChange={(e) =>
            onChange({ ...value, day: Number(e.target.value) })
          }
          className="flex-1 bg-white/5 border border-white/20 rounded-xl text-white px-3 py-3.5 text-sm appearance-none text-center focus:outline-none focus:border-violet-400/50"
        >
          <option value="" disabled className="bg-gray-900">
            일
          </option>
          {days.map((d) => (
            <option key={d} value={d} className="bg-gray-900">
              {d}일
            </option>
          ))}
        </select>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isValid ? 1 : 0.4, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        disabled={!isValid}
        className="mt-8 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-2xl px-8 py-3 flex items-center gap-2 transition-all active:scale-[0.97]"
      >
        다음
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

/* ─── InstrumentStep ─── */
const instruments = [
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

const typeOptions = ["전공", "입시", "취미"];

function InstrumentStep({
  instrument,
  type,
  onInstrumentChange,
  onTypeChange,
  onComplete,
}: {
  instrument: string;
  type: string;
  onInstrumentChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onComplete: () => void;
}) {
  const isValid = instrument && type;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <BlurText
          text="어떤 악기를 연주하세요?"
          className="text-xl font-bold text-white justify-center"
          animateBy="words"
          delay={80}
          direction="top"
        />
      </motion.div>

      {/* Instrument Scroll */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="w-full flex gap-2.5 overflow-x-auto pb-3 px-2 mb-8 scrollbar-hide"
      >
        {instruments.map((inst) => (
          <button
            key={inst.name}
            onClick={() => onInstrumentChange(inst.name)}
            className={`flex items-center gap-2 px-4 py-3 rounded-full border transition-all active:scale-[0.97] whitespace-nowrap shrink-0 ${
              instrument === inst.name
                ? "border-violet-400 bg-violet-600/20"
                : "bg-white/10 border-white/15 hover:bg-white/15"
            }`}
          >
            <span className="text-lg">{inst.emoji}</span>
            <span
              className={`text-sm font-medium ${
                instrument === inst.name ? "text-white" : "text-white/80"
              }`}
            >
              {inst.name}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex gap-3 mb-8"
      >
        {typeOptions.map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.97] ${
              type === t
                ? "bg-violet-600 text-white"
                : "bg-white/10 text-violet-300/70 hover:bg-white/15"
            }`}
          >
            {t}
          </button>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isValid ? 1 : 0.4, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onComplete}
        disabled={!isValid}
        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-2xl px-8 py-3 flex items-center gap-2 transition-all active:scale-[0.97]"
      >
        시작하기
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

/* ─── ProfileSetupFlow Orchestrator ─── */
export function ProfileSetupFlow({ onComplete }: ProfileSetupFlowProps) {
  const [subStep, setSubStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState({ year: 0, month: 0, day: 0 });
  const [instrument, setInstrument] = useState("");
  const [type, setType] = useState("");

  const handleComplete = () => {
    const grade = calculateGradeFromBirthday(birthday);
    const profileToSave = {
      nickname,
      instrument,
      grade,
      type,
      dailyGoal: 60,
      plan: "free",
      profileImage: "",
      birthday,
    };
    localStorage.setItem("grit-on-profile", JSON.stringify(profileToSave));

    onComplete({
      nickname,
      birthday,
      instrument,
      type,
    });
  };

  const renderSubStep = () => {
    switch (subStep) {
      case 0:
        return (
          <NicknameStep
            value={nickname}
            onChange={setNickname}
            onNext={() => setSubStep(1)}
          />
        );
      case 1:
        return (
          <BirthdayStep
            value={birthday}
            onChange={setBirthday}
            onNext={() => setSubStep(2)}
          />
        );
      case 2:
        return (
          <InstrumentStep
            instrument={instrument}
            type={type}
            onInstrumentChange={setInstrument}
            onTypeChange={setType}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={subStep}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={slideTransition}
        className="flex-1 flex flex-col"
      >
        {renderSubStep()}
      </motion.div>
    </AnimatePresence>
  );
}
