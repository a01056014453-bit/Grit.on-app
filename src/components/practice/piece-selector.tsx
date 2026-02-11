"use client";

import { useState } from "react";
import { Music, ChevronRight, Target, ChevronDown } from "lucide-react";
import type { Song } from "@/types";

interface PieceSelectorProps {
  selectedSong: Song;
  isRecording: boolean;
  measureRange?: { start: number; end: number } | null;
  dailyGoal?: number;
  todayPracticed?: number;
  onSongClick: () => void;
  onMeasureChange?: (range: { start: number; end: number } | null) => void;
}

export function PieceSelector({
  selectedSong,
  isRecording,
  measureRange,
  dailyGoal = 60,
  todayPracticed = 0,
  onSongClick,
  onMeasureChange,
}: PieceSelectorProps) {
  const [isMeasureOpen, setIsMeasureOpen] = useState(false);
  const [startMeasure, setStartMeasure] = useState(measureRange?.start?.toString() || "");
  const [endMeasure, setEndMeasure] = useState(measureRange?.end?.toString() || "");

  const handleMeasureSubmit = () => {
    const start = parseInt(startMeasure);
    const end = parseInt(endMeasure);
    if (start > 0 && end > 0 && end >= start) {
      onMeasureChange?.({ start, end });
    } else if (!startMeasure && !endMeasure) {
      onMeasureChange?.(null); // 전체 연습
    }
    setIsMeasureOpen(false);
  };

  const handleClearMeasure = () => {
    setStartMeasure("");
    setEndMeasure("");
    onMeasureChange?.(null);
    setIsMeasureOpen(false);
  };

  const remainingGoal = Math.max(0, dailyGoal - todayPracticed);
  const goalProgress = Math.min((todayPracticed / dailyGoal) * 100, 100);

  return (
    <div className="space-y-3 mb-6">
      {/* 곡 선택 */}
      <div
        onClick={() => !isRecording && onSongClick()}
        className={`bg-white rounded-xl p-4 border border-gray-200 transition-transform cursor-pointer ${
          !isRecording ? "active:scale-[0.99] hover:border-gray-300" : "opacity-60"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-black">
              {selectedSong.title}
            </p>
            <p className="text-xs text-gray-500">
              {measureRange
                ? `${measureRange.start}-${measureRange.end}번 마디 집중`
                : "전체 연습"}
            </p>
          </div>
          {!isRecording && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* 마디 선택 */}
      {!isRecording && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setIsMeasureOpen(!isMeasureOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">집중 타겟 마디</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-violet-600 font-medium">
                {measureRange ? `${measureRange.start}-${measureRange.end}마디` : "전체"}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isMeasureOpen ? "rotate-180" : ""}`} />
            </div>
          </button>

          {isMeasureOpen && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  value={startMeasure}
                  onChange={(e) => setStartMeasure(e.target.value)}
                  placeholder="시작"
                  className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-center border-0 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  min={1}
                />
                <span className="text-gray-400">~</span>
                <input
                  type="number"
                  value={endMeasure}
                  onChange={(e) => setEndMeasure(e.target.value)}
                  placeholder="끝"
                  className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-center border-0 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  min={1}
                />
                <span className="text-gray-500 text-sm">마디</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClearMeasure}
                  className="flex-1 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  전체 연습
                </button>
                <button
                  onClick={handleMeasureSubmit}
                  className="flex-1 py-2 text-sm text-white bg-black rounded-lg hover:bg-gray-800"
                >
                  설정
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 오늘의 목표 */}
      {!isRecording && (
        <div className="bg-violet-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-violet-700 font-medium">오늘의 목표</span>
            <span className="text-sm text-violet-600">
              {todayPracticed > 0 ? `${todayPracticed}분 / ` : ""}{dailyGoal}분
            </span>
          </div>
          <div className="h-2 bg-violet-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          {todayPracticed > 0 ? (
            <p className="text-xs text-violet-600 text-center">
              {goalProgress >= 100
                ? "목표 달성! 추가 연습도 좋아요 🎉"
                : `남은 목표: ${remainingGoal}분`}
            </p>
          ) : (
            <p className="text-xs text-violet-600 text-center">
              연습을 시작하면 순수 연습 시간만 기록됩니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}
