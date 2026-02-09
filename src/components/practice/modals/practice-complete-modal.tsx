"use client";

import { Music, Trophy, Clock } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatTime } from "@/lib/format";
import type { PracticeType, Song } from "@/types";

interface CompletedSession {
  totalTime: number;
  practiceTime: number;
  practiceType: PracticeType;
  startTime?: Date;
  endTime?: Date;
}

interface PracticeCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSong: Song;
  completedSession: CompletedSession | null;
  onViewRecording: () => void;
}

export function PracticeCompleteModal({
  isOpen,
  onClose,
  selectedSong,
  completedSession,
  onViewRecording,
}: PracticeCompleteModalProps) {
  const formatDateTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      showClose={false}
    >
      <div className="p-6 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-black" />
        </div>

        <h3 className="text-xl font-bold text-black mb-1">연습 완료!</h3>
        <p className="text-gray-500 mb-6">
          {completedSession && completedSession.practiceTime > 0
            ? "오늘도 수고하셨어요"
            : "다음에는 조금 더 연습해볼까요?"}
        </p>

        {/* Session Time Info */}
        {completedSession?.startTime && completedSession?.endTime && (
          <div className="flex items-center justify-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">시작</span>
              <span className="font-semibold text-black">
                {formatDateTime(completedSession.startTime)}
              </span>
            </div>
            <span className="text-gray-300">→</span>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-gray-500">종료</span>
              <span className="font-semibold text-black">
                {formatDateTime(completedSession.endTime)}
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Music className="w-5 h-5 text-black" />
            <span className="font-medium text-black">
              {selectedSong.title}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-black">
                {completedSession ? formatTime(completedSession.totalTime) : "00:00"}
              </div>
              <div className="text-xs text-gray-500">총 시간</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-black">
                {completedSession ? formatTime(completedSession.practiceTime) : "00:00"}
              </div>
              <div className="text-xs text-gray-500">순연습</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                {completedSession && completedSession.totalTime > 0
                  ? Math.round(
                      (completedSession.practiceTime /
                        completedSession.totalTime) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-xs text-gray-500">집중도</div>
            </div>
          </div>
        </div>

        {/* Encouragement based on practice ratio */}
        {completedSession && (
          <div className="bg-gray-100 rounded-xl p-3 mb-6">
            <p className="text-sm text-gray-700">
              {completedSession.totalTime > 0 &&
              completedSession.practiceTime / completedSession.totalTime >= 0.7
                ? "훌륭해요! 집중력이 대단합니다!"
                : completedSession.totalTime > 0 &&
                  completedSession.practiceTime / completedSession.totalTime >= 0.5
                ? "좋은 연습이었어요! 조금 더 집중해볼까요?"
                : "꾸준히 연습하면 더 좋아질 거예요!"}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
}
