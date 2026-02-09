"use client";

import { useState, useRef, useEffect } from "react";
import { Music, Clock, Play, Pause, X, Volume2 } from "lucide-react";
import type { PracticeSession } from "@/lib/db";
import { formatTime } from "@/lib/format";

interface RecentRecordingsListProps {
  sessions: PracticeSession[];
}

export function RecentRecordingsList({ sessions }: RecentRecordingsListProps) {
  const [selectedSession, setSelectedSession] = useState<PracticeSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  // Handle session click
  const handleSessionClick = (session: PracticeSession) => {
    if (session.audioBlob) {
      // Clean up previous audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(session.audioBlob);
      setAudioUrl(url);
      setSelectedSession(session);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Close player
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setSelectedSession(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Format seconds to mm:ss
  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
          <button
            key={session.id}
            onClick={() => handleSessionClick(session)}
            disabled={!session.audioBlob}
            className={`w-full text-left bg-white rounded-xl p-4 border border-gray-100 transition-colors ${
              session.audioBlob ? "hover:bg-gray-50 active:bg-gray-100 cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                session.audioBlob ? "bg-black" : "bg-gray-200"
              }`}>
                {session.audioBlob ? (
                  <Volume2 className="w-5 h-5 text-white" />
                ) : (
                  <Music className="w-5 h-5 text-gray-400" />
                )}
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
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Audio Player Modal */}
      {selectedSession && audioUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg animate-in slide-in-from-bottom duration-300">
            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleAudioEnded}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <p className="font-semibold text-black">{selectedSession.pieceName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(selectedSession.startTime).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">{formatSeconds(currentTime)}</span>
                <span className="text-xs text-gray-500">{formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white ml-1" />
                )}
              </button>
            </div>

            {/* Session Info */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-black">{formatTime(selectedSession.practiceTime)}</p>
                  <p className="text-[10px] text-gray-500">연습 시간</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-black">{formatTime(selectedSession.totalTime)}</p>
                  <p className="text-[10px] text-gray-500">총 시간</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {selectedSession.totalTime > 0
                      ? `${Math.round((selectedSession.practiceTime / selectedSession.totalTime) * 100)}%`
                      : "0%"}
                  </p>
                  <p className="text-[10px] text-gray-500">효율</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
