"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, animate } from "framer-motion";
import { Target, Check, BarChart3 } from "lucide-react";
import { ProgressRing } from "./progress-ring";

interface DailyGoalProps {
  completed: number;
  target: number;
  onTargetChange?: (newTarget: number) => void;
}

const GOAL_OPTIONS = [60, 90, 120, 180, 240, 300, 360, 420];

const quotes = [
  { text: "음악가에게 휴식은 없다. 쉬는 날도 연습하는 날이다.", author: "Pablo Casals" },
  { text: "연습은 거짓말을 하지 않는다.", author: "Vladimir Horowitz" },
  { text: "음악은 영혼의 언어이다.", author: "Kahlil Gibran" },
  { text: "천천히, 그러나 확실하게. 그것이 연습의 비밀이다.", author: "Franz Liszt" },
  { text: "매일 조금씩, 그것이 위대함으로 가는 길이다.", author: "Robert Schumann" },
  { text: "느리게 연습하면, 빠르게 배운다.", author: "Yo-Yo Ma" },
  { text: "단순함은 궁극의 정교함이다.", author: "F. Chopin" },
];

export function DailyGoal({ completed, target, onTargetChange }: DailyGoalProps) {
  const progress = Math.min((completed / target) * 100, 100);
  const remaining = Math.max(target - completed, 0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayCompleted, setDisplayCompleted] = useState(0);

  // Animated count-up for percentage and completed minutes
  useEffect(() => {
    const ctrl1 = animate(0, progress, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayProgress(Math.round(v)),
    });
    const ctrl2 = animate(0, completed, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayCompleted(Math.round(v)),
    });
    return () => { ctrl1.stop(); ctrl2.stop(); };
  }, [progress, completed]);

  // 1시간마다 명언이 바뀌도록 계산
  const now = new Date();
  const hoursSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60));
  const quote = quotes[hoursSinceEpoch % quotes.length];

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectGoal = (minutes: number) => {
    localStorage.setItem('grit-on-daily-goal', minutes.toString());
    onTargetChange?.(minutes);
    setIsOpen(false);
  };

  return (
    <div className="block bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="font-bold text-gray-900 text-xl">오늘의 목표</h4>
          <p className="text-xs text-gray-500 mt-1">매일 조금씩 성장하는 습관</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 bg-white/40 backdrop-blur-sm rounded-full hover:bg-white/60 transition-colors shadow-sm"
            >
              <Target className="w-5 h-5 text-violet-600" />
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 min-w-[140px]">
                <p className="text-xs text-gray-500 px-4 py-1 border-b border-gray-100 mb-1">
                  목표 시간 설정
                </p>
                {GOAL_OPTIONS.map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => handleSelectGoal(minutes)}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-violet-50 transition-colors ${
                      target === minutes ? "text-violet-600 font-semibold" : "text-gray-700"
                    }`}
                  >
                    <span>{minutes}분</span>
                    {target === minutes && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/stats"
            className="p-2 bg-white/40 backdrop-blur-sm rounded-full hover:bg-white/60 transition-colors shadow-sm"
          >
            <BarChart3 className="w-5 h-5 text-violet-600" />
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6">
        <div className="relative flex items-center justify-center">
          <ProgressRing
            progress={progress}
            size={100}
            strokeWidth={8}
            showValue={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500">달성률</span>
            <motion.span
              className="text-xl font-bold bg-gradient-to-r from-violet-700 to-violet-400 bg-clip-text text-transparent"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              {displayProgress}%
            </motion.span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-400">현재 연습</span>
            <div className="flex items-baseline gap-1">
              <motion.span
                className="text-3xl font-bold bg-gradient-to-r from-violet-700 to-violet-400 bg-clip-text text-transparent"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              >
                {displayCompleted}
              </motion.span>
              <span className="text-sm font-medium text-gray-500">/ {target}분</span>
            </div>
          </div>

          <div className="text-sm text-black bg-white/40 backdrop-blur-sm rounded-xl p-2.5">
            {remaining > 0 ? (
              <span className="flex items-center gap-2">
                <span className="font-medium">{remaining}분</span> 더 힘내봐요!
              </span>
            ) : (
              <span className="flex items-center gap-2 font-medium">
                목표 달성! 대단해요
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 오늘의 명언 */}
      <div className="mt-5 pt-4 border-t border-violet-200/60">
        <p className="text-xs text-gray-400 mb-1">오늘의 명언</p>
        <p className="text-sm text-gray-600 italic">&quot;{quote.text}&quot;</p>
        <p className="text-xs text-gray-400 mt-1">— {quote.author}</p>
      </div>
    </div>
  );
}
