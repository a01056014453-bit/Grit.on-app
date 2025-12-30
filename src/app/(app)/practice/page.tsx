"use client";

import { useState } from "react";
import { Play, Pause, Square, Music, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PracticePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">연습 세션</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          녹음 버튼을 눌러 연습을 시작하세요
        </p>
      </div>

      {/* Piece Selection */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">연습곡 선택</p>
            <p className="text-xs text-gray-500">탭하여 곡을 선택하세요</p>
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-6">
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-900 font-mono mb-2">
            {formatTime(elapsedTime)}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>순연습시간</span>
          </div>
        </div>

        {/* Waveform placeholder */}
        <div className="mt-6 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="flex items-end gap-1 h-8">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary/30 rounded-full transition-all"
                style={{
                  height: isRecording && !isPaused
                    ? `${20 + Math.random() * 80}%`
                    : "20%",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <Button
            onClick={() => setIsRecording(true)}
            className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
          >
            <Play className="w-8 h-8 text-white" fill="white" />
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
              className="w-16 h-16 rounded-full"
            >
              {isPaused ? (
                <Play className="w-6 h-6" fill="currentColor" />
              ) : (
                <Pause className="w-6 h-6" />
              )}
            </Button>
            <Button
              onClick={() => {
                setIsRecording(false);
                setIsPaused(false);
              }}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
            >
              <Square className="w-6 h-6 text-white" fill="white" />
            </Button>
          </>
        )}
      </div>

      {isRecording && (
        <p className="text-center text-sm text-gray-500 mt-4">
          {isPaused ? "일시정지됨" : "녹음 중..."}
        </p>
      )}
    </div>
  );
}
