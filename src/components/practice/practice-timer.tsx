"use client";

import { Clock, Sparkles, Play, Pause, Calendar } from "lucide-react";
import { formatTime } from "@/lib/format";

interface RecordedAudio {
  url: string;
  duration: number;
}

interface PracticeTimerProps {
  practiceTime: number;
  isRecording: boolean;
  isPaused: boolean;
  tip: string;
  recordedAudio?: RecordedAudio | null;
  isPlaying?: boolean;
  onPlayRecording?: () => void;
  startTime?: Date | null;
}

export function PracticeTimer({
  practiceTime,
  isRecording,
  isPaused,
  tip,
  recordedAudio,
  isPlaying,
  onPlayRecording,
  startTime,
}: PracticeTimerProps) {
  const formatDateTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 mb-6 relative overflow-hidden">
      <div className="text-center relative z-10">
        {/* Session Time Info */}
        {isRecording && startTime && (
          <div className="flex items-center justify-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>시작</span>
              <span className="font-semibold text-black">{formatDateTime(startTime)}</span>
            </div>
          </div>
        )}

        {/* Main Timer - Practice Time */}
        <div className="text-6xl font-bold text-black font-mono mb-1 tracking-tighter">
          {formatTime(practiceTime)}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
          <Clock className="w-4 h-4" />
          <span>순연습시간</span>
          {isRecording && (
            <span className="ml-2 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"}`} />
              <span className="text-xs">{isPaused ? "일시정지" : "녹음 중"}</span>
            </span>
          )}
        </div>

        {/* Dynamic Content Area */}
        <div className="min-h-[80px] flex items-center justify-center">
          {recordedAudio && !isRecording ? (
            /* 녹음 재생 UI */
            <button
              onClick={onPlayRecording}
              className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 rounded-xl px-6 py-4 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-black">
                  {isPlaying ? "재생 중..." : "녹음 다시 듣기"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTime(recordedAudio.duration)}
                </p>
              </div>
            </button>
          ) : isRecording ? (
            /* 녹음 중 웨이브폼 */
            <div className="flex items-end gap-1 h-12 w-full justify-center px-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full bg-black transition-all duration-150`}
                  style={{
                    height: isPaused ? "15%" : `${20 + Math.random() * 60}%`,
                    opacity: isPaused ? 0.3 : 0.6,
                  }}
                />
              ))}
            </div>
          ) : (
            /* 팁 표시 */
            <div className="bg-gray-50 rounded-xl p-4 w-full flex items-center gap-3 animate-fade-in">
              <div className="shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-sm text-gray-600 font-medium text-left leading-snug text-pretty">
                &quot;{tip}&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
