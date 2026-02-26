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
  const bars = [3, 6, 9, 14, 10, 7, 12, 16, 11, 8, 13, 9, 6, 10, 7];
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-violet-100 overflow-hidden">
        {/* Step 1: 연습 시작 버튼 → 누르는 애니메이션 */}
        <div className="pf-start-btn mb-3">
          <div className="flex items-center justify-center gap-2 bg-violet-500 rounded-xl py-2.5 text-white">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <span className="text-xs font-bold">연습 시작</span>
          </div>
        </div>

        {/* Step 2: 감지 상태 */}
        <div className="pf-detecting">
          <div className="flex items-center gap-2 mb-2">
            <div className="pf-detect-dot w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-semibold text-green-600">피아노 감지됨</span>
            <span className="ml-auto text-[10px] font-mono text-gray-400 pf-timer">00:00</span>
          </div>

          {/* Waveform */}
          <div className="flex items-end justify-center gap-[3px] h-10 pf-waveform">
            {bars.map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-violet-400"
                style={{
                  height: `${h * 2.2}px`,
                  animation: `wavepulse 1.2s ease-in-out ${i * 0.08}s infinite alternate`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Step 3: 완료 */}
        <div className="pf-complete mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-700">연습 저장됨</p>
              <p className="text-[10px] text-gray-400">피아노 · 45분 32초</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wavepulse { from { transform: scaleY(0.5); opacity: 0.4; } to { transform: scaleY(1); opacity: 1; } }

        .pf-start-btn {
          animation: pfStartBtn 7s ease-in-out infinite;
        }
        @keyframes pfStartBtn {
          0%, 5% { opacity: 1; transform: scale(1); }
          8% { transform: scale(0.95); }
          11% { opacity: 1; transform: scale(1); }
          18% { opacity: 0; height: 0; margin: 0; overflow: hidden; }
          95% { opacity: 0; height: 0; margin: 0; overflow: hidden; }
          100% { opacity: 1; height: auto; margin-bottom: 12px; }
        }

        .pf-detecting {
          animation: pfDetecting 7s ease-in-out infinite;
        }
        @keyframes pfDetecting {
          0%, 15% { opacity: 0; transform: translateY(8px); }
          22% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; }
          78% { opacity: 0; }
          100% { opacity: 0; }
        }

        .pf-detect-dot {
          animation: pfDot 7s ease-in-out infinite;
        }
        @keyframes pfDot {
          0%, 22% { opacity: 0; }
          25%, 35% { opacity: 1; }
          36%, 39% { opacity: 0.3; }
          40%, 50% { opacity: 1; }
          51%, 54% { opacity: 0.3; }
          55%, 70% { opacity: 1; }
          78% { opacity: 0; }
          100% { opacity: 0; }
        }

        .pf-timer {
          animation: pfTimer 7s step-end infinite;
        }
        @keyframes pfTimer {
          0%, 22% { }
          25% { }
          30% { }
          100% { }
        }

        .pf-waveform {
          animation: pfWaveform 7s ease-in-out infinite;
        }
        @keyframes pfWaveform {
          0%, 22% { opacity: 0; }
          28% { opacity: 1; }
          70% { opacity: 1; }
          78% { opacity: 0; }
          100% { opacity: 0; }
        }

        .pf-complete {
          animation: pfComplete 7s ease-in-out infinite;
        }
        @keyframes pfComplete {
          0%, 72% { opacity: 0; transform: translateY(8px); }
          80% { opacity: 1; transform: translateY(0); }
          95% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function FeedbackFlowVisual() {
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100 overflow-hidden">
        {/* Step 1: 구간 선택 */}
        <div className="fb-step-1 mb-3">
          <p className="text-[10px] text-gray-400 mb-2">문제 구간 선택</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((m) => (
              <div
                key={m}
                className={`flex-1 h-7 rounded flex items-center justify-center text-[9px] font-medium transition-all ${
                  m >= 3 && m <= 5
                    ? "bg-pink-500 text-white fb-measure-selected"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {m}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-pink-500 font-medium mt-1.5 text-center">3 - 5 마디</p>
        </div>

        {/* Step 2: 영상 녹화 */}
        <div className="fb-step-2 mb-3">
          <div className="bg-gray-900 rounded-xl h-20 flex items-center justify-center relative overflow-hidden">
            <div className="fb-rec-dot absolute top-2 left-2 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[9px] text-red-400 font-mono">REC</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="absolute bottom-2 right-2 text-[9px] text-white/60 font-mono fb-rec-timer">0:12</span>
          </div>
        </div>

        {/* Step 3: 전송 → 피드백 도착 */}
        <div className="fb-step-3 space-y-2">
          <div className="flex items-center gap-2 fb-sending">
            <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
              <svg className="w-3 h-3 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-pink-600">선생님에게 전송됨</span>
          </div>

          <div className="fb-reply bg-pink-50 rounded-xl p-3 border border-pink-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-[10px]">👩‍🏫</div>
              <span className="text-[10px] font-semibold text-gray-700">김지수 선생님</span>
              <span className="text-[9px] text-gray-400 ml-auto">방금</span>
            </div>
            <p className="text-[10px] text-gray-600 leading-relaxed">3마디 왼손 터치를 좀 더 가볍게 해보세요. 손목 힘을 빼고 손가락 끝으로 건반을 눌러보세요.</p>
          </div>
        </div>
      </div>

      <style>{`
        .fb-step-1 {
          animation: fbStep1 8s ease-in-out infinite;
        }
        .fb-measure-selected {
          animation: fbMeasure 8s ease-in-out infinite;
        }
        @keyframes fbStep1 {
          0%, 3% { opacity: 0; transform: translateY(8px); }
          8% { opacity: 1; transform: translateY(0); }
          30% { opacity: 1; }
          35% { opacity: 0.3; transform: scale(0.97); }
          40%, 95% { opacity: 0.3; transform: scale(0.97); }
          100% { opacity: 0; }
        }
        @keyframes fbMeasure {
          0%, 5% { background: #f3f4f6; color: #9ca3af; }
          10%, 100% { background: #EC4899; color: white; }
        }

        .fb-step-2 {
          animation: fbStep2 8s ease-in-out infinite;
        }
        @keyframes fbStep2 {
          0%, 28% { opacity: 0; height: 0; margin: 0; overflow: hidden; }
          35% { opacity: 1; height: auto; margin-bottom: 12px; }
          55% { opacity: 1; }
          60% { opacity: 0; height: 0; margin: 0; overflow: hidden; }
          100% { opacity: 0; height: 0; margin: 0; overflow: hidden; }
        }

        .fb-rec-dot {
          animation: fbRecDot 8s ease-in-out infinite;
        }
        @keyframes fbRecDot {
          0%, 35% { opacity: 0; }
          38%, 42% { opacity: 1; }
          43%, 46% { opacity: 0.3; }
          47%, 55% { opacity: 1; }
          60% { opacity: 0; }
          100% { opacity: 0; }
        }

        .fb-step-3 {
          animation: fbStep3 8s ease-in-out infinite;
        }
        @keyframes fbStep3 {
          0%, 58% { opacity: 0; transform: translateY(8px); }
          65% { opacity: 1; transform: translateY(0); }
          95% { opacity: 1; }
          100% { opacity: 0; }
        }

        .fb-sending {
          animation: fbSending 8s ease-in-out infinite;
        }
        @keyframes fbSending {
          0%, 58% { opacity: 0; }
          63% { opacity: 1; }
          100% { opacity: 1; }
        }

        .fb-reply {
          animation: fbReply 8s ease-in-out infinite;
        }
        @keyframes fbReply {
          0%, 68% { opacity: 0; transform: translateY(10px); }
          75% { opacity: 1; transform: translateY(0); }
          95% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
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

      <style>{`
        /* + 버튼 펄스 */
        .todo-add-btn {
          animation: addPulse 6s ease-in-out infinite;
        }
        @keyframes addPulse {
          0%, 8% { transform: scale(1); }
          4% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        /* 아이템 1: 슬라이드 인 */
        .todo-item-1 {
          animation: slideIn 6s ease-out infinite;
        }
        @keyframes slideIn {
          0%, 5% { opacity: 0; transform: translateY(-10px); }
          12% { opacity: 1; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* 아이템 2: 딜레이 슬라이드 인 */
        .todo-item-2 {
          animation: slideIn2 6s ease-out infinite;
        }
        @keyframes slideIn2 {
          0%, 18% { opacity: 0; transform: translateY(-10px); }
          25% { opacity: 1; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* 아이템 3: 더 딜레이 */
        .todo-item-3 {
          animation: slideIn3 6s ease-out infinite;
        }
        @keyframes slideIn3 {
          0%, 30% { opacity: 0; transform: translateY(-10px); }
          37% { opacity: 1; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* 체크박스: 아이템1 완료 */
        .todo-checkbox-1 {
          animation: checkBox 6s ease-in-out infinite;
        }
        @keyframes checkBox {
          0%, 55% { background: transparent; border-color: #86EFAC; }
          60%, 95% { background: #10B981; border-color: #10B981; }
          100% { background: transparent; border-color: #86EFAC; }
        }

        .todo-check-icon-1 {
          animation: checkIcon 6s ease-in-out infinite;
        }
        @keyframes checkIcon {
          0%, 55% { opacity: 0; transform: scale(0); }
          62% { opacity: 1; transform: scale(1.2); }
          65%, 95% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0); }
        }

        /* 텍스트 취소선 */
        .todo-text-1 {
          animation: strikeThrough 6s ease-in-out infinite;
        }
        @keyframes strikeThrough {
          0%, 55% { text-decoration: none; color: #1f2937; }
          60%, 95% { text-decoration: line-through; color: #9ca3af; }
          100% { text-decoration: none; color: #1f2937; }
        }

        /* 프로그레스 바 */
        .todo-progress-bar {
          animation: progressGrow 6s ease-in-out infinite;
        }
        @keyframes progressGrow {
          0%, 37% { width: 0%; }
          45%, 55% { width: 0%; }
          65%, 95% { width: 33%; }
          100% { width: 0%; }
        }

        .todo-progress-text {
          animation: progressText 6s ease-in-out infinite;
        }
        @keyframes progressText {
          0%, 55% { opacity: 0.4; }
          65%, 95% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
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
