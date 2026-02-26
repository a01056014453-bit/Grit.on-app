"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Video, ChevronRight } from "lucide-react";

/* ─── Types ─── */

interface WelcomeSlide {
  id: number;
  type: "welcome";
}

interface FeatureSlide {
  id: number;
  type: "feature";
  color: string;
  bgLight: string;
  title: string;
  desc: string;
  badge?: string;
  visual: "waveform" | "feedback" | "dashboard" | "mic";
  isLast?: boolean;
}

type Slide = WelcomeSlide | FeatureSlide;

/* ─── Slide Data ─── */

const SLIDES: Slide[] = [
  { id: 0, type: "welcome" },
  {
    id: 1,
    type: "feature",
    color: "#8B5CF6",
    bgLight: "#F3EEFF",
    title: "연주하면\n자동으로 기록돼요",
    desc: "AI가 실제 연주 소리만 감지해서 연습 시간을 정확하게 측정해요. 악보 넘기는 소리, 말소리는 제외돼요.",
    visual: "waveform",
  },
  {
    id: 2,
    type: "feature",
    color: "#EC4899",
    bgLight: "#FDF2F8",
    title: "어려운 구간,\n전문가에게 물어보세요",
    desc: "막히는 부분을 짧게 녹화해서 전송하면 48시간 내에 전문 선생님의 코멘트를 받을 수 있어요.",
    badge: "크레딧 1개 사용",
    visual: "feedback",
  },
  {
    id: 3,
    type: "feature",
    color: "#10B981",
    bgLight: "#ECFDF5",
    title: "오늘 뭘 연습할지\n미리 계획하세요",
    desc: "연습 목표를 To Do로 등록하고, 대시보드에서 주간 연습 시간과 달성률을 한눈에 확인해요.",
    visual: "dashboard",
  },
  {
    id: 4,
    type: "feature",
    color: "#8B5CF6",
    bgLight: "#F3EEFF",
    title: "마이크 접근을\n허용해주세요",
    desc: "연주 감지와 녹음에 사용돼요. 녹음된 연습은 나중에 다시 들어볼 수 있어요.",
    visual: "mic",
    isLast: true,
  },
];

const ONBOARDING_KEY = "sempre-onboarding-done";

/* ─── Slide Transition Variants ─── */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const slideTransition = {
  type: "spring" as const,
  damping: 28,
  stiffness: 280,
};

/* ─── Visual Components ─── */

function PracticeFlowVisual() {
  const bars = Array.from({ length: 20 }, (_, i) => 15 + Math.sin(i * 0.8) * 35 + Math.random() * 20);
  return (
    <div className="w-full max-w-[280px] mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-violet-100 overflow-hidden">
        {/* Timer display - like real app */}
        <div className="text-center mb-3">
          <div className="font-mono text-4xl font-semibold tracking-tight text-gray-900 pf-timer-display">
            <span>12</span>
            <span className="mx-0.5 text-violet-400 animate-pulse">:</span>
            <span>34</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1 pf-status">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-medium">녹음 중</span>
          </div>
        </div>

        {/* Waveform - matches real app: w-[6px], gradient violet */}
        <div className="flex items-end justify-center gap-[3px] h-12 mb-3 pf-waveform">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-[6px] rounded-full"
              style={{
                height: `${h}%`,
                background: "linear-gradient(to top, #7c3aed, #a78bfa)",
                animation: `wavepulse 1.2s ease-in-out ${i * 0.08}s infinite alternate`,
              }}
            />
          ))}
        </div>

        {/* Control buttons - like real app */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 pf-stop-btn">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
          </div>
        </div>

        {/* Detection info */}
        <div className="mt-3 bg-violet-50 rounded-lg p-2 text-center border border-violet-100 pf-info">
          <p className="text-[10px] text-violet-700 font-medium">피아노 감지됨 · 휴식 시간 자동 제외</p>
        </div>
      </div>
    </div>
  );
}

function FeedbackFlowVisual() {
  return (
    <div className="w-full max-w-[280px] mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100 overflow-hidden">
        {/* Header - like real app */}
        <div className="flex gap-2 mb-3">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= 2 ? "bg-violet-500" : "bg-gray-200"}`} />
          ))}
        </div>
        <p className="text-[9px] text-gray-400 mb-2">단계 2/4</p>

        {/* Song info inputs - like real feedback/new */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-[8px] text-gray-400">작곡가</p>
            <p className="text-[10px] font-semibold text-gray-800">F. Chopin</p>
          </div>
          <div className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-[8px] text-gray-400">곡 제목</p>
            <p className="text-[10px] font-semibold text-gray-800">Ballade No.1</p>
          </div>
        </div>

        {/* Measure range */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 px-2 py-1.5 rounded-lg border border-violet-300 bg-violet-50 text-center">
            <p className="text-[10px] font-bold text-violet-700">3</p>
          </div>
          <span className="text-[10px] text-gray-400">~</span>
          <div className="flex-1 px-2 py-1.5 rounded-lg border border-violet-300 bg-violet-50 text-center">
            <p className="text-[10px] font-bold text-violet-700">5</p>
          </div>
          <span className="text-[9px] text-gray-400">마디</span>
        </div>

        {/* Problem type grid - like real app */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {["테크닉", "음악성", "리듬/박자", "기타"].map((type, i) => (
            <div
              key={type}
              className={`px-2 py-1.5 rounded-lg border text-[9px] font-medium text-center ${
                i === 0
                  ? "border-violet-400 bg-violet-50 text-violet-700"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              {type}
            </div>
          ))}
        </div>

        {/* Teacher reply card */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-2.5 border border-violet-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-violet-200 flex items-center justify-center text-[10px]">👩‍🏫</div>
            <div>
              <p className="text-[9px] font-semibold text-gray-700">김지수 선생님</p>
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] text-amber-500">★</span>
                <span className="text-[8px] text-gray-400">4.9</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-0.5 text-violet-600">
              <span className="text-[9px] font-bold">3</span>
              <span className="text-[8px]">크레딧</span>
            </div>
          </div>
          <p className="text-[9px] text-gray-500 leading-relaxed">왼손 터치를 좀 더 가볍게, 손목 힘을 빼보세요</p>
        </div>
      </div>
    </div>
  );
}

function TodoFlowVisual() {
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-100 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500">오늘의 연습</p>
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center todo-add-btn">
            <span className="text-white text-sm font-bold leading-none">+</span>
          </div>
        </div>

        {/* Todo Item 1 - slides in, then gets checked */}
        <div className="todo-item-1 mb-2">
          <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3 border border-green-100">
            <div className="todo-checkbox-1 w-5 h-5 rounded-full border-2 border-green-300 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white todo-check-icon-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 todo-text-1">쇼팽 에튀드 Op.10 No.1</p>
              <p className="text-[10px] text-gray-400 mt-0.5">느린 템포 연습 · 20분</p>
            </div>
          </div>
        </div>

        {/* Todo Item 2 - slides in after item 1 */}
        <div className="todo-item-2 mb-2">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">바흐 인벤션 No.8</p>
              <p className="text-[10px] text-gray-400 mt-0.5">양손 합치기 · 15분</p>
            </div>
          </div>
        </div>

        {/* Todo Item 3 - slides in last */}
        <div className="todo-item-3">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">스케일 연습</p>
              <p className="text-[10px] text-gray-400 mt-0.5">C장조 · 10분</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-400">오늘 진행률</span>
            <span className="text-[10px] font-bold text-green-500 todo-progress-text">33%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full todo-progress-bar" />
          </div>
        </div>
      </div>

    </div>
  );
}

function MicVisual() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#8B5CF6] flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-[#8B5CF6]/25"
            style={{
              animation: `ripple 2s ease-out ${i * 0.65}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

const VISUAL_MAP: Record<FeatureSlide["visual"], React.FC> = {
  waveform: PracticeFlowVisual,
  feedback: FeedbackFlowVisual,
  dashboard: TodoFlowVisual,
  mic: MicVisual,
};

/* ─── Main Page ─── */

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [micStatus, setMicStatus] = useState<
    "idle" | "granted" | "denied"
  >("idle");
  const touchStartX = useRef(0);

  const slide = SLIDES[current];

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) goNext();
    if (diff < -50) goPrev();
  };

  const completeOnboarding = () => {
    router.push("/onboarding/profile-setup");
  };

  const handleMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus("granted");
    } catch {
      setMicStatus("denied");
    }
    setTimeout(completeOnboarding, 600);
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <div
      className="h-[100dvh] flex flex-col bg-white relative overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 건너뛰기 */}
      {slide.type === "welcome" || (slide.type === "feature" && !slide.isLast) ? (
        <button
          onClick={handleSkip}
          className="absolute top-12 right-6 text-sm text-gray-400 z-20 font-medium"
        >
          건너뛰기
        </button>
      ) : null}

      {/* Slide Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTransition}
          className="flex-1 flex flex-col"
        >
          {/* Welcome Slide */}
          {slide.type === "welcome" && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 bg-[#8B5CF6] relative overflow-hidden">
              <div className="absolute top-[-100px] right-[-100px] w-80 h-80 rounded-full bg-white/5" />
              <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 rounded-full bg-white/5" />
              <div className="relative z-10 text-center">
                <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20">
                  <span className="text-5xl font-black text-white">S</span>
                </div>
                <h1 className="text-4xl font-black text-white mb-4 leading-tight">
                  연습은
                  <br />
                  기록이다
                </h1>
                <p className="text-white/70 text-base leading-relaxed">
                  클래식 연주자를 위한
                  <br />
                  AI 연습 코치
                </p>
              </div>
            </div>
          )}

          {/* Feature Slides */}
          {slide.type === "feature" && (
            <div className="flex-1 flex flex-col justify-center">
              <div
                className="flex items-center justify-center py-10 px-8"
                style={{ backgroundColor: slide.bgLight }}
              >
                {(() => {
                  const VisualComponent = VISUAL_MAP[slide.visual];
                  return <VisualComponent />;
                })()}
              </div>
              <div className="px-8 pt-6">
                {slide.badge && (
                  <span
                    className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
                    style={{
                      backgroundColor: `${slide.color}18`,
                      color: slide.color,
                    }}
                  >
                    {slide.badge}
                  </span>
                )}
                <h2 className="text-2xl font-black text-gray-900 leading-tight mb-3 whitespace-pre-line">
                  {slide.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {slide.desc}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="px-6 pb-8 pt-2 relative z-10 shrink-0">
        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > current ? 1 : -1);
                setCurrent(i);
              }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? "24px" : "8px",
                height: "8px",
                backgroundColor:
                  i === current
                    ? slide.type === "welcome"
                      ? "white"
                      : (slide as FeatureSlide).color
                    : slide.type === "welcome"
                      ? "rgba(255,255,255,0.3)"
                      : "#E5E7EB",
              }}
            />
          ))}
        </div>

        {/* Action Button */}
        {slide.type === "feature" && slide.isLast ? (
          <div>
            <button
              onClick={handleMicPermission}
              disabled={micStatus !== "idle"}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-70"
              style={{ backgroundColor: "#8B5CF6" }}
            >
              {micStatus === "granted"
                ? "허용됐어요!"
                : micStatus === "denied"
                  ? "나중에 설정할게요"
                  : "권한 허용하기"}
            </button>
            {micStatus === "idle" && (
              <button
                onClick={completeOnboarding}
                className="w-full mt-3 text-sm text-gray-400 font-medium"
              >
                나중에 할게요
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={goNext}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor:
                slide.type === "welcome"
                  ? "white"
                  : (slide as FeatureSlide).color,
              color: slide.type === "welcome" ? "#8B5CF6" : "white",
            }}
          >
            다음 <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
