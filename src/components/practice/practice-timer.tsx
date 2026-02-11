"use client";

import { useState, useEffect } from "react";
import { Clock, Play, Pause, Square, Calendar, Mic } from "lucide-react";
import { type MetronomeState } from "./metronome-control";
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
  onStart,
  onPause,
  onResume,
  onStop,
  onRequestPermission,
  onMetronomeStateChange,
  metronomeDisabled = false,
}: PracticeTimerProps) {
  const [waveformHeights, setWaveformHeights] = useState<number[]>(
    Array(20).fill(15)
  );

  // Waveform animation
  useEffect(() => {
    if (!isRecording || isPaused) {
      setWaveformHeights(Array(20).fill(15));
      return;
    }

    const interval = setInterval(() => {
      setWaveformHeights(
        Array(20)
          .fill(0)
          .map(() => 15 + Math.random() * 55)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

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

  return (
    <div className="space-y-4">
      {/* Main Timer Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 pb-4">
          {/* Start Time Header - 녹음 중일 때만 표시 */}
          {isRecording && startTime && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
              <Calendar className="w-4 h-4" />
              <span>시작</span>
              <span className="font-medium text-gray-700">{formatDateTime(startTime)}</span>
            </div>
          )}

          {/* Large Timer Display */}
          <div className="text-center mb-2">
            <div className="font-mono text-7xl font-bold tracking-tight">
              <span className="text-gray-900">{time.minutes}</span>
              <span className="text-gray-400 mx-1">:</span>
              <span className="text-gray-900">{time.seconds}</span>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>총 녹음 시간</span>
            </div>
            {isRecording && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                  }`}
                />
                <span className="text-gray-700">
                  {isPaused ? "일시정지" : "녹음 중"}
                </span>
              </div>
            )}
          </div>

          {/* Waveform Visualization */}
          {isRecording && (
            <div className="flex items-end justify-center gap-1 h-16 mb-6 px-4">
              {waveformHeights.map((height, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full bg-gray-800 transition-all duration-100"
                  style={{
                    height: `${height}%`,
                    opacity: isPaused ? 0.3 : 0.7,
                  }}
                />
              ))}
            </div>
          )}

          {/* Recording Info */}
          {isRecording && !isPaused && (
            <div className="bg-gray-50 rounded-xl p-3 mb-6 text-center">
              <p className="text-sm text-gray-600">
                연습을 마치면 AI가 자동으로 분석합니다
              </p>
              <p className="text-xs text-gray-400 mt-1">
                휴식, 대화 시간은 자동으로 제외됩니다
              </p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {hasPermission === false ? (
              <button
                onClick={onRequestPermission}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-violet-900 flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
              >
                <Mic className="w-7 h-7 text-white" />
              </button>
            ) : isRecording ? (
              <>
                {/* Pause/Resume Button */}
                <button
                  onClick={isPaused ? onResume : onPause}
                  className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  {isPaused ? (
                    <Play className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" />
                  ) : (
                    <Pause className="w-6 h-6 text-gray-800" fill="currentColor" />
                  )}
                </button>

                {/* Stop Button */}
                <button
                  onClick={onStop}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Square className="w-6 h-6 text-white" fill="currentColor" />
                </button>
              </>
            ) : (
              /* Start Button */
              <button
                onClick={onStart}
                disabled={hasPermission === null}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-violet-900 flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-violet-500/30"
              >
                <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
              </button>
            )}
          </div>
        </div>

        {/* Metronome Section */}
        <div className="border-t border-gray-100">
          <MetronomeControl
            onStateChange={onMetronomeStateChange}
            disabled={metronomeDisabled}
          />
        </div>
      </div>
    </div>
  );
}
