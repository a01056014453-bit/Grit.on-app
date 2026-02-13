"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, Pause, Square, Calendar, Mic } from "lucide-react";
import { type MetronomeState } from "./metronome-control";
import { ShinyText } from "@/components/ui/shiny-text";
import { StarBorder } from "@/components/ui/star-border";
import dynamic from "next/dynamic";

const MetronomeControl = dynamic(
  () => import("./metronome-control").then((mod) => mod.MetronomeControl),
  { ssr: false }
);

interface PracticeTimerProps {
  /** 총 녹음 시간 (초) */
  totalTime: number;
  isRecording: boolean;
  isPaused: boolean;
  startTime?: Date | null;
  hasPermission?: boolean | null;
  /** 실시간 마이크 볼륨 (0-1) */
  currentVolume?: number;
  /** 실시간 주파수 밴드 데이터 (0-100, 20개) */
  frequencyBands?: number[];
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onRequestPermission?: () => void;
  onMetronomeStateChange?: (state: MetronomeState) => void;
  metronomeDisabled?: boolean;
}

export function PracticeTimer({
  totalTime,
  isRecording,
  isPaused,
  startTime,
  hasPermission,
  currentVolume = 0,
  frequencyBands,
  onStart,
  onPause,
  onResume,
  onStop,
  onRequestPermission,
  onMetronomeStateChange,
  metronomeDisabled = false,
}: PracticeTimerProps) {
  const prevSecondsRef = useRef("00");
  const prevMinutesRef = useRef("00");
  const [secondsKey, setSecondsKey] = useState(0);
  const [minutesKey, setMinutesKey] = useState(0);

  // 주파수 밴드 기반 파형 높이 계산
  const waveformHeights = (!isRecording || isPaused || !frequencyBands)
    ? Array(20).fill(10)
    : frequencyBands.map((band) => Math.max(10, band * 0.8));

  const formatDateTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format time with leading zeros (MM:SS)
  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: String(mins).padStart(2, "0"),
      seconds: String(secs).padStart(2, "0"),
    };
  };

  const time = formatTimerDisplay(totalTime);

  // Trigger digit animation on change
  useEffect(() => {
    if (time.seconds !== prevSecondsRef.current) {
      prevSecondsRef.current = time.seconds;
      setSecondsKey((k) => k + 1);
    }
    if (time.minutes !== prevMinutesRef.current) {
      prevMinutesRef.current = time.minutes;
      setMinutesKey((k) => k + 1);
    }
  }, [time.seconds, time.minutes]);

  return (
    <div className="space-y-2">
      {/* Main Timer Card */}
      <div
        className={`overflow-hidden transition-all duration-500 ${
          isRecording && !isPaused ? "recording-glow" : ""
        }`}
      >
        <div className="pt-6 pb-3">
          {/* Start Time Header - 녹음 중일 때만 표시 */}
          <AnimatePresence>
            {isRecording && startTime && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4"
              >
                <Calendar className="w-4 h-4" />
                <span>시작</span>
                <span className="font-medium text-gray-700">
                  {formatDateTime(startTime)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Large Timer Display */}
          <div className="text-center mb-1">
            <div className="font-number text-7xl font-semibold tracking-tight">
              <motion.span
                key={`m-${minutesKey}`}
                initial={isRecording ? { y: -4, opacity: 0.5 } : false}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`inline-block ${
                  isRecording && !isPaused ? "text-violet-900" : "text-gray-900"
                }`}
              >
                {time.minutes}
              </motion.span>
              <span
                className={`mx-1 ${
                  isRecording && !isPaused
                    ? "text-violet-400 animate-pulse"
                    : "text-gray-400"
                }`}
              >
                :
              </span>
              <motion.span
                key={`s-${secondsKey}`}
                initial={isRecording ? { y: -4, opacity: 0.5 } : false}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`inline-block ${
                  isRecording && !isPaused ? "text-violet-900" : "text-gray-900"
                }`}
              >
                {time.seconds}
              </motion.span>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {isRecording ? (
                <ShinyText
                  text="총 녹음 시간"
                  color="#6b7280"
                  shineColor="#8b5cf6"
                  speed={3}
                  className="text-sm"
                />
              ) : (
                <span>총 녹음 시간</span>
              )}
            </div>
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                    }`}
                  />
                  <span className="text-gray-700 font-medium">
                    {isPaused ? "일시정지" : "녹음 중"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Waveform Visualization */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 64 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-end justify-center gap-[3px] mb-6 px-4"
              >
                {waveformHeights.map((height, i) => (
                  <motion.div
                    key={i}
                    className="w-[6px] rounded-full"
                    animate={{
                      height: `${height}%`,
                      opacity: isPaused ? 0.2 : 0.8,
                    }}
                    transition={{ duration: 0.08, ease: "easeOut" }}
                    style={{
                      background: isPaused
                        ? "#9ca3af"
                        : `linear-gradient(to top, #7c3aed, #a78bfa)`,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Info */}
          <AnimatePresence>
            {isRecording && !isPaused && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-violet-50 rounded-xl p-3 mb-6 text-center border border-violet-100"
              >
                <p className="text-sm text-violet-700">
                  연습을 마치면 AI가 자동으로 분석합니다
                </p>
                <p className="text-xs text-violet-400 mt-1">
                  휴식, 대화 시간은 자동으로 제외됩니다
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {hasPermission === false ? (
              <StarBorder color="rgba(139, 92, 246, 0.6)" speed="3s">
                <button
                  onClick={onRequestPermission}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-violet-900 flex items-center justify-center"
                >
                  <Mic className="w-6 h-6 text-white" />
                </button>
              </StarBorder>
            ) : isRecording ? (
              <>
                {/* Pause/Resume Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={isPaused ? onResume : onPause}
                  className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  {isPaused ? (
                    <Play className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" />
                  ) : (
                    <Pause className="w-6 h-6 text-gray-800" fill="currentColor" />
                  )}
                </motion.button>

                {/* Stop Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onStop}
                  className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  <Square className="w-6 h-6 text-white" fill="currentColor" />
                </motion.button>
              </>
            ) : (
              /* Start Button with StarBorder */
              <div className="relative">
                <StarBorder
                  color="rgba(139, 92, 246, 0.7)"
                  speed="3s"
                  onClick={onStart}
                  disabled={hasPermission === null}
                  className={hasPermission === null ? "opacity-50" : ""}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-violet-900 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                  </div>
                </StarBorder>
              </div>
            )}
          </div>
        </div>

        {/* Metronome Section */}
        <div className="mt-6 mb-4 mx-auto max-w-xs bg-white rounded-2xl border border-gray-100">
          <MetronomeControl
            onStateChange={onMetronomeStateChange}
            disabled={metronomeDisabled}
          />
        </div>
      </div>
    </div>
  );
}
