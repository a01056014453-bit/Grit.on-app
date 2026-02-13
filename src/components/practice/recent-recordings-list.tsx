"use client";

import { useState, useRef, useEffect } from "react";
import { Music, Clock, Play, Pause, X, Volume2, Target, TrendingUp, Lightbulb, Trash2 } from "lucide-react";
import type { PracticeSession } from "@/lib/db";
import { deleteSession } from "@/lib/db";
import { formatTime } from "@/lib/format";

interface RecentRecordingsListProps {
  sessions: PracticeSession[];
  onSessionDeleted?: () => void;
}

// AI 코칭 피드백 생성
function generateCoachingFeedback(session: PracticeSession): string[] {
  const feedback: string[] = [];
  const practiceRatio = session.totalTime > 0
    ? (session.practiceTime / session.totalTime) * 100
    : 0;

  if (practiceRatio < 30) {
    feedback.push("연습보다 휴식이 더 많았어요. 타이머를 설정해 집중 시간을 늘려보세요.");
  } else if (practiceRatio < 50) {
    feedback.push("집중력을 조금 더 높여볼까요? 짧은 구간을 반복 연습해보세요.");
  } else if (practiceRatio >= 70) {
    feedback.push("훌륭한 집중력이에요! 이 페이스를 유지해보세요.");
  }

  if (session.practiceTime < 300) { // 5분 미만
    feedback.push("짧은 연습이었네요. 10-15분씩 집중 연습을 해보세요.");
  } else if (session.practiceTime >= 1800) { // 30분 이상
    feedback.push("충분한 연습 시간이에요! 중간에 휴식도 잊지 마세요.");
  }

  if (feedback.length === 0) {
    feedback.push("꾸준히 연습하고 있어요. 계속 이어가세요!");
  }

  return feedback;
}

export function RecentRecordingsList({ sessions, onSessionDeleted }: RecentRecordingsListProps) {
  const [selectedSession, setSelectedSession] = useState<PracticeSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const formatMinSec = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  // Handle session click
  const handleSessionClick = (session: PracticeSession) => {
    if (session.audioBlob) {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(session.audioBlob);
      setAudioUrl(url);
    }
    setSelectedSession(session);
    setIsPlaying(false);
    setCurrentTime(0);
    // Blob 오디오는 duration 메타데이터가 없는 경우가 많으므로 세션 시간을 fallback으로 사용
    setDuration(session.totalTime || 0);
  };

  // Close modal
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

  // Delete session
  const handleDelete = async (sessionId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (!confirm("이 연습 기록을 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSession(sessionId);
      if (selectedSession?.id === sessionId) {
        handleClose();
      }
      onSessionDeleted?.();
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert("삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
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
      const d = audioRef.current.duration;
      if (isFinite(d) && d > 0) {
        setDuration(d);
      }
    }
  };

  // Handle duration change (Blob URLs often fire this after loadedmetadata with the real duration)
  const handleDurationChange = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (isFinite(d) && d > 0) {
        setDuration(d);
      }
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
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return "0:00";
    }
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
            className="w-full text-left bg-white rounded-xl p-4 border border-gray-100 transition-colors hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-black truncate">
                    {session.pieceName}
                  </p>
                  {session.measureRange && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded text-[10px] font-medium shrink-0">
                      <Target className="w-2.5 h-2.5" />
                      {session.measureRange.start}-{session.measureRange.end}
                    </span>
                  )}
                </div>
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

      {/* Analysis Result Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 z-[60] overflow-y-auto">
          <div className="min-h-full flex items-end justify-center pb-20">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Hidden Audio Element */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onDurationChange={handleDurationChange}
                onEnded={handleAudioEnded}
              />
            )}

            {/* Purple Header */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-6 py-8 text-white text-center relative">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-white" />
              </div>

              {/* 곡명 & To-do 정보 */}
              <h3 className="text-lg font-bold mb-1">{selectedSession.pieceName}</h3>
              {(selectedSession.measureRange || selectedSession.todoNote) && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  {selectedSession.measureRange && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      <Target className="w-3 h-3" />
                      {selectedSession.measureRange.start}-{selectedSession.measureRange.end}마디
                    </span>
                  )}
                  {selectedSession.todoNote && !selectedSession.measureRange && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {selectedSession.todoNote}
                    </span>
                  )}
                </div>
              )}

              <p className="text-white/80 text-sm mb-1">
                총 {formatMinSec(selectedSession.totalTime)} 중
              </p>
              <h2 className="text-2xl font-bold mb-2">
                실제 연주 시간은 {formatMinSec(selectedSession.practiceTime)}
              </h2>
              <p className="text-white/70 text-sm">
                나머지 {formatMinSec(selectedSession.totalTime - selectedSession.practiceTime)}은 휴식 및 준비 시간입니다
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* 연습 목표 (To-do Info) */}
              {(selectedSession.measureRange || selectedSession.todoNote) && (
                <div className="bg-violet-50 rounded-2xl border border-violet-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-violet-800">연습 목표</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedSession.measureRange && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium">
                        {selectedSession.measureRange.start}-{selectedSession.measureRange.end}마디
                      </span>
                    )}
                    {selectedSession.todoNote && (
                      <span className="text-sm text-violet-700">
                        {selectedSession.todoNote}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Grit Gauge */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-gray-900">Grit Gauge 반영</span>
                  </div>
                  <span className="text-violet-600 font-bold">
                    +{Math.floor(selectedSession.practiceTime / 60)}분
                  </span>
                </div>
                <div className="h-2 bg-violet-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min((selectedSession.practiceTime / 3600) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  오늘의 목표 {Math.round((selectedSession.practiceTime / 3600) * 100)}% 달성 ({Math.floor(selectedSession.practiceTime / 60)}/60분)
                </p>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">연습 타임라인</span>
                </div>

                {/* Timeline Bar */}
                <div className="h-8 rounded-lg overflow-hidden flex mb-3">
                  {selectedSession.totalTime > 0 ? (
                    <>
                      <div
                        className="bg-violet-500 h-full"
                        style={{ width: `${(selectedSession.practiceTime / selectedSession.totalTime) * 100}%` }}
                      />
                      <div
                        className="bg-gray-300 h-full"
                        style={{ width: `${((selectedSession.totalTime - selectedSession.practiceTime) / selectedSession.totalTime) * 100}%` }}
                      />
                    </>
                  ) : (
                    <div className="bg-gray-200 h-full w-full" />
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <span className="text-gray-600">
                      연주 {selectedSession.totalTime > 0
                        ? Math.round((selectedSession.practiceTime / selectedSession.totalTime) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <span className="text-gray-600">
                      휴식 {selectedSession.totalTime > 0
                        ? Math.round(((selectedSession.totalTime - selectedSession.practiceTime) / selectedSession.totalTime) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Coaching */}
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">AI 코칭</span>
                </div>
                <ul className="space-y-2">
                  {generateCoachingFeedback(selectedSession).map((tip, i) => (
                    <li key={i} className="text-sm text-amber-900 flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Audio Player (if available) */}
              {audioUrl && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-3 text-center">녹음 재생</p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <input
                      type="range"
                      min={0}
                      max={duration > 0 ? duration : 1}
                      step={0.01}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{formatSeconds(currentTime)}</span>
                      <span className="text-xs text-gray-500">{formatSeconds(duration)}</span>
                    </div>
                  </div>

                  {/* Play Button */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => selectedSession.id && handleDelete(selectedSession.id)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
