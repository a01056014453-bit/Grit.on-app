"use client";

import { Music, Clock, Calendar } from "lucide-react";
import type { PracticeSession } from "@/lib/db";
import { formatTime } from "@/lib/format";

interface RecentRecordingsListProps {
  sessions: PracticeSession[];
}

export function RecentRecordingsList({ sessions }: RecentRecordingsListProps) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  const formatTimeRange = (start: Date, end: Date) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} - ${e.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  if (sessions.length === 0) {
    return (
      <div className="mt-8 mb-4">
        <h3 className="text-sm font-semibold text-black mb-3">최근 연습</h3>
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <Music className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">아직 연습 기록이 없습니다</p>
          <p className="text-xs text-gray-400 mt-1">녹음 버튼을 눌러 연습을 시작하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-4">
      <h3 className="text-sm font-semibold text-black mb-3">최근 연습</h3>
      <div className="space-y-2">
        {sessions.slice(0, 5).map((session) => (
          <div
            key={session.id}
            className="bg-white rounded-xl p-4 border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">
                  {session.pieceName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(session.practiceTime)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimeRange(session.startTime, session.endTime)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">{formatDate(session.startTime)}</span>
                <div className="text-xs font-medium text-green-600 mt-1">
                  {session.totalTime > 0
                    ? `${Math.round((session.practiceTime / session.totalTime) * 100)}%`
                    : "0%"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
