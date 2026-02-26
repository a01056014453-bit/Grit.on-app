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

const ONBOARDING_KEY = "grit-on-onboarding-complete";

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

function WaveformVisual() {
  const bars = [3, 6, 9, 14, 10, 7, 12, 16, 11, 8, 13, 9, 6, 10, 7];
  return (
    <div className="flex items-end justify-center gap-1 h-20">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-2.5 rounded-full bg-[#8B5CF6]"
          style={{
            height: `${h * 4}px`,
            animation: `wavepulse 1.2s ease-in-out ${i * 0.08}s infinite alternate`,
          }}
        />
      ))}
      <style>{`@keyframes wavepulse { from { transform: scaleY(0.5); opacity: 0.4; } to { transform: scaleY(1); opacity: 1; } }`}</style>
    </div>
  );
}

function FeedbackVisual() {
  return (
    <div className="w-full max-w-xs mx-auto space-y-2">
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-pink-100 flex gap-3 items-start">
        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-sm flex-shrink-0">
          👩‍🏫
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">김지수 선생님</p>
          <p className="text-xs text-gray-500 mt-0.5">
            3마디 왼손 터치를 좀 더 가볍게 해보세요
          </p>
        </div>
      </div>
      <div className="bg-pink-500 rounded-2xl p-3 ml-8 flex gap-2 items-center">
        <Video className="w-4 h-4 text-white flex-shrink-0" />
        <p className="text-xs text-white font-medium">쇼팽 연습 3마디.mp4</p>
        <span className="ml-auto text-xs text-pink-200">0:12</span>
      </div>
    </div>
  );
}

function DashboardVisual() {
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const heights = [60, 85, 40, 95, 70, 30, 55];
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
        <p className="text-xs font-semibold text-gray-500 mb-3">
          이번 주 연습 시간
        </p>
        <div className="flex items-end justify-between gap-1 h-14 mb-2">
          {heights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-md"
              style={{
                height: `${h}%`,
                background: h > 80 ? "#10B981" : "#D1FAE5",
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mb-3">
          {days.map((d) => (
            <p
              key={d}
              className="text-[10px] text-gray-400 flex-1 text-center"
            >
              {d}
            </p>
          ))}
        </div>
        <div className="pt-3 border-t border-gray-100 flex justify-between">
          <div>
            <p className="text-xs text-gray-400">총 연습</p>
            <p className="text-sm font-bold text-gray-800">12h 30m</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">달성률</p>
            <p className="text-sm font-bold text-green-500">87%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">연속</p>
            <p className="text-sm font-bold text-gray-800">5일</p>
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
      <style>{`@keyframes ripple { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.5); opacity: 0; } }`}</style>
    </div>
  );
}

const VISUAL_MAP: Record<FeatureSlide["visual"], React.FC> = {
  waveform: WaveformVisual,
  feedback: FeedbackVisual,
  dashboard: DashboardVisual,
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
    localStorage.setItem(ONBOARDING_KEY, "true");
    router.push("/");
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
      className="min-h-screen flex flex-col bg-white relative overflow-hidden select-none"
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
            <div className="flex-1 flex flex-col">
              <div
                className="flex items-center justify-center pt-20 pb-12 px-8"
                style={{ backgroundColor: slide.bgLight }}
              >
                {(() => {
                  const VisualComponent = VISUAL_MAP[slide.visual];
                  return <VisualComponent />;
                })()}
              </div>
              <div className="flex-1 px-8 pt-8">
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
      <div className="px-8 pb-12 pt-4 relative z-10">
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
