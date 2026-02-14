"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Music, Clock, Calendar, ChevronRight, Mic } from "lucide-react";
import { formatTime } from "@/lib/format";
import { getAllSessions, PracticeSession } from "@/lib/db";

export default function RecordingsPage() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await getAllSessions();
        // Sort by date, newest first
        const sorted = allSessions.sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        setSessions(sorted);
      } catch (error) {
        console.error("Failed to load sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);

  const totalPracticeTime = sessions.reduce((sum, s) => sum + s.practiceTime, 0);
  const totalSessions = sessions.length;
  const sessionsWithAudio = sessions.filter((s) => s.audioBlob).length;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `오늘 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    } else if (days === 1) {
      return "어제";
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return `${d.getMonth() + 1}월 ${d.getDate()}일`;
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-20"></div>
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-24 mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">녹음 기록</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          연습 녹음을 다시 들어보세요
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalSessions}</div>
          <div className="text-xs text-gray-500">총 세션</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-primary">
            {Math.floor(totalPracticeTime / 60)}
          </div>
          <div className="text-xs text-gray-500">총 연습(분)</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-gray-900">{sessionsWithAudio}</div>
          <div className="text-xs text-gray-500">녹음 파일</div>
        </div>
      </div>

      {/* Recordings List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">아직 녹음이 없습니다</p>
          <p className="text-sm text-gray-400">연습을 시작하면 자동으로 저장됩니다</p>
          <Link
            href="/practice"
            className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-violet-500 to-violet-900 text-white rounded-lg text-sm font-medium"
          >
            연습 시작하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/recordings/${session.id}`}
              className="block bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {session.pieceName}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      <Clock className="w-3 h-3" />
                      {formatTime(session.practiceTime)}
                    </div>
                    {session.audioBlob && (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                        <Mic className="w-3 h-3" />
                        녹음됨
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between h-full">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(session.startTime)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
