"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface TimerSpotlightStepProps {
  onNext: () => void;
}

type DetectionState = "playing" | "noise" | "idle";

export function TimerSpotlightStep({ onNext }: TimerSpotlightStepProps) {
  const [seconds, setSeconds] = useState(0);
  const [detection, setDetection] = useState<DetectionState>("idle");
  const [demoPhase, setDemoPhase] = useState(0);

  // Demo simulation: cycles through phases
  useEffect(() => {
    const phases: { state: DetectionState; duration: number }[] = [
      { state: "idle", duration: 1500 },
      { state: "playing", duration: 3000 },
      { state: "noise", duration: 2000 },
      { state: "playing", duration: 3000 },
    ];

    let timeout: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    const runPhase = (idx: number) => {
      const phase = phases[idx % phases.length];
      setDetection(phase.state);
      setDemoPhase(idx);

      timeout = setTimeout(() => {
        runPhase(idx + 1);
      }, phase.duration);
    };

    // Start timer counting
    timerInterval = setInterval(() => {
      setSeconds((prev) => {
        if (detection === "playing") return prev + 1;
        return prev;
      });
    }, 1000);

    // Start demo after a brief delay
    const startTimeout = setTimeout(() => runPhase(0), 800);

    return () => {
      clearTimeout(timeout);
      clearTimeout(startTimeout);
      clearInterval(timerInterval);
    };
  }, []);

  // Update timer only during "playing" phase
  useEffect(() => {
    if (detection !== "playing") return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [detection, demoPhase]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const secs = (s % 60).toString().padStart(2, "0");
    return { mins, secs };
  };

  const { mins, secs } = formatTime(seconds);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-lg font-bold text-white mb-2"
      >
        순연습 타이머의 마법
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-violet-300/70 text-sm mb-8"
      >
        당신의 진짜 연습 시간만 기록합니다
      </motion.p>

      {/* Spotlight container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        className="relative mb-8"
      >
        {/* Spotlight gradient overlay */}
        <div className="absolute -inset-16 rounded-full bg-radial-gradient pointer-events-none"
          style={{
            background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 70%)",
          }}
        />

        {/* Timer circle with breathing border */}
        <div className="relative">
          <div className="recording-glow rounded-3xl">
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 w-64">
              {/* Timer display */}
              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-6xl font-bold font-number text-white tracking-tight">
                  {mins}
                </span>
                <motion.span
                  className="text-6xl font-bold font-number text-violet-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  :
                </motion.span>
                <span className="text-6xl font-bold font-number text-white tracking-tight">
                  {secs}
                </span>
              </div>

              {/* Pure practice time label */}
              <p className="text-violet-300/60 text-xs mb-4">순연습 시간</p>

              {/* Detection indicator */}
              <motion.div
                layout
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl mx-auto"
                animate={{
                  backgroundColor:
                    detection === "playing"
                      ? "rgba(34, 197, 94, 0.15)"
                      : detection === "noise"
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(255, 255, 255, 0.05)",
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full"
                  animate={{
                    backgroundColor:
                      detection === "playing"
                        ? "#22c55e"
                        : detection === "noise"
                          ? "#ef4444"
                          : "#6b7280",
                    scale:
                      detection !== "idle" ? [1, 1.3, 1] : 1,
                  }}
                  transition={{
                    scale: { duration: 0.8, repeat: Infinity },
                    backgroundColor: { duration: 0.3 },
                  }}
                />
                <span
                  className={`text-xs font-medium ${
                    detection === "playing"
                      ? "text-green-400"
                      : detection === "noise"
                        ? "text-red-400"
                        : "text-gray-400"
                  }`}
                >
                  {detection === "playing"
                    ? "연주 감지 중"
                    : detection === "noise"
                      ? "소음 감지 - 일시정지"
                      : "대기 중..."}
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="bg-violet-900/60 backdrop-blur-xl border border-violet-400/30 rounded-2xl px-6 py-4 max-w-xs mb-8"
      >
        <p className="text-violet-200 text-sm leading-relaxed">
          말소리나 소음은 기록되지 않습니다.
          <br />
          오직 당신의 연주 시간만{" "}
          <span className="text-white font-semibold">&apos;순연습 시간&apos;</span>으로
          인정됩니다.
        </p>
      </motion.div>

      {/* Next button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        onClick={onNext}
        className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl px-8 py-3 flex items-center gap-2 transition-colors active:scale-[0.97]"
      >
        다음
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
