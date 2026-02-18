"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Circle,
  Music,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowLeft,
  Mic,
} from "lucide-react";

// ─── Sample Data ─────────────────────────────────────────────────────────────

interface Task {
  id: number;
  text: string;
  tempo: number | null;
  reps: number;
  time: string | null;
  done: boolean;
  hasRecording?: boolean;
}

interface Piece {
  id: number;
  title: string;
  completed: number;
  total: number;
  recordingOnly?: boolean;
  tasks: Task[];
}

interface Session {
  id: number;
  time: string;
  piece: string;
  detail: string;
  duration: string;
  hasRecording?: boolean;
}

const calendarData: Record<number, number> = {
  1: 4, 2: 6, 3: 4, 4: 0, 5: 6, 6: 2, 7: 4,
  8: 6, 9: 0, 10: 2, 11: 6, 12: 2, 13: 0, 14: 6,
  15: 4, 16: 2, 17: 9, 18: 6,
};

const piecesData: Record<string, Piece[]> = {
  "2026-2-17": [
    {
      id: 1,
      title: "F. Chopin Ballade Op.23 No.1",
      completed: 2,
      total: 3,
      tasks: [
        { id: 1, text: "mm.23-28 왼손 아르페지오 정확성", tempo: 60, reps: 4, time: "12:13", done: true },
        { id: 2, text: "mm.88-92 Presto 과속 방지", tempo: 168, reps: 3, time: "12:25", done: true },
        { id: 3, text: "mm.1-22 도입부 레가토 연결", tempo: 52, reps: 0, time: null, done: false },
      ],
    },
    {
      id: 2,
      title: "L. v. Beethoven Sonata Op.13 No.8",
      completed: 1,
      total: 2,
      tasks: [
        { id: 4, text: "Mvt.1 mm.1-16 그라베 다이나믹 표현", tempo: 52, reps: 2, time: "12:30", done: true },
        { id: 5, text: "코다 구간 템포 조절", tempo: null, reps: 0, time: null, done: false },
      ],
    },
    {
      id: 3,
      title: "C. Debussy Suite Bergamasque No.3",
      completed: 0,
      total: 0,
      recordingOnly: true,
      tasks: [
        { id: 6, text: "전곡 녹음", tempo: null, reps: 0, time: "12:11", done: false, hasRecording: true },
      ],
    },
  ],
  "2026-2-18": [
    {
      id: 4,
      title: "F. Chopin Ballade Op.23 No.1",
      completed: 1,
      total: 2,
      tasks: [
        { id: 7, text: "mm.1-22 도입부 레가토 연결", tempo: 54, reps: 5, time: "09:15", done: true },
        { id: 8, text: "mm.45-60 중간부 루바토", tempo: null, reps: 0, time: null, done: false },
      ],
    },
    {
      id: 5,
      title: "F. Liszt La Campanella",
      completed: 2,
      total: 2,
      tasks: [
        { id: 9, text: "mm.1-8 주제 도약 정확성", tempo: 80, reps: 6, time: "10:02", done: true },
        { id: 10, text: "mm.32-48 트릴 구간", tempo: 72, reps: 4, time: "10:18", done: true },
      ],
    },
  ],
};

const sessionsData: Record<string, Session[]> = {
  "2026-2-17": [
    { id: 1, time: "12:05", piece: "F. Chopin Ballade Op.23 No.1", detail: "mm.23-28 아르페지오", duration: "18분", hasRecording: false },
    { id: 2, time: "12:11", piece: "C. Debussy Suite Bergamasque No.3", detail: "전곡 녹음", duration: "6분", hasRecording: true },
    { id: 3, time: "12:25", piece: "F. Chopin Ballade Op.23 No.1", detail: "mm.88-92 Presto", duration: "12분", hasRecording: false },
    { id: 4, time: "12:30", piece: "L. v. Beethoven Sonata Op.13 No.8", detail: "Mvt.1 그라베", duration: "15분", hasRecording: false },
  ],
  "2026-2-18": [
    { id: 5, time: "09:10", piece: "F. Chopin Ballade Op.23 No.1", detail: "mm.1-22 도입부", duration: "22분", hasRecording: false },
    { id: 6, time: "10:00", piece: "F. Liszt La Campanella", detail: "주제 도약 + 트릴", duration: "25분", hasRecording: true },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCountStyle(count: number, isToday: boolean, isFuture: boolean) {
  if (isFuture) return "bg-white/10 opacity-30";
  if (isToday) return "bg-violet-600 text-white shadow-lg shadow-violet-500/30";
  if (count >= 7) return "bg-violet-500/70 text-white font-bold";
  if (count >= 5) return "bg-violet-400/60 text-violet-700 font-bold";
  if (count >= 3) return "bg-violet-300/50 text-violet-600";
  if (count >= 1) return "bg-violet-200/40 text-violet-500";
  return "bg-white/20 backdrop-blur-sm";
}

const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

// ─── Component ───────────────────────────────────────────────────────────────

export default function RecordsPage() {
  const today = new Date(2026, 1, 18); // 2026-02-18
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today);
  const [expandedPieces, setExpandedPieces] = useState<Set<number>>(new Set());
  const [showTimeline, setShowTimeline] = useState(false);

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();

  const navigateMonth = (dir: number) => {
    let m = calendarMonth + dir;
    let y = calendarYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const togglePiece = (id: number) => {
    setExpandedPieces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
  const pieces = piecesData[dateKey] || [];
  const sessions = sessionsData[dateKey] || [];

  const totalCompleted = pieces.reduce((s, p) => s + p.completed, 0);
  const totalTasks = pieces.reduce((s, p) => s + p.total, 0);
  const totalRecordings = sessions.filter((s) => s.hasRecording).length;

  // Practice days count for the month
  const practiceDaysInMonth = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if ((calendarData[d] || 0) > 0) count++;
    }
    return count;
  }, [daysInMonth]);

  return (
    <div className="min-h-screen bg-blob-violet relative">
      <div className="bg-blob-extra" />

      <div className="max-w-md mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/40"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <span className="text-sm font-bold text-violet-600">연습 기록</span>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: CALENDAR CARD
        ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-[20px] p-5 mb-4"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 8px 32px rgba(124,58,237,0.08)",
          }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">
                {calendarYear}년 {calendarMonth + 1}월
              </span>
              {practiceDaysInMonth > 0 && (
                <span className="flex items-center gap-1 text-sm text-violet-600 font-bold">
                  <Check className="w-4 h-4" />
                  {practiceDaysInMonth}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 rounded-full hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400 hover:text-violet-600" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 rounded-full hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-400 hover:text-violet-600" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((day, i) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-1 ${
                  i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array(firstDayOfMonth)
              .fill(null)
              .map((_, i) => (
                <div key={`e-${i}`} className="flex flex-col items-center py-1">
                  <div className="w-8 h-8" />
                  <span className="text-[10px] h-4" />
                </div>
              ))}

            {/* Day cells */}
            {Array(daysInMonth)
              .fill(null)
              .map((_, i) => {
                const day = i + 1;
                const count = calendarData[day] || 0;
                const isToday =
                  day === today.getDate() &&
                  calendarMonth === today.getMonth() &&
                  calendarYear === today.getFullYear();
                const isFuture =
                  calendarYear > today.getFullYear() ||
                  (calendarYear === today.getFullYear() && calendarMonth > today.getMonth()) ||
                  (calendarYear === today.getFullYear() &&
                    calendarMonth === today.getMonth() &&
                    day > today.getDate());
                const isSelected =
                  day === selectedDate.getDate() &&
                  calendarMonth === selectedDate.getMonth() &&
                  calendarYear === selectedDate.getFullYear();
                const dayOfWeek = (firstDayOfMonth + i) % 7;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDate(new Date(calendarYear, calendarMonth, day));
                      setExpandedPieces(new Set());
                      setShowTimeline(false);
                    }}
                    className="flex flex-col items-center py-1"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${getCountStyle(
                        count,
                        isToday,
                        isFuture
                      )} ${isSelected && !isToday ? "ring-2 ring-violet-400 ring-offset-1 ring-offset-transparent" : ""}`}
                    >
                      {!isFuture && count > 0 ? count : ""}
                    </div>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        dayOfWeek === 0
                          ? "text-red-400"
                          : dayOfWeek === 6
                          ? "text-blue-400"
                          : "text-gray-500"
                      }`}
                    >
                      {day}
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[10px] text-gray-400 mr-1">적음</span>
            {[
              "bg-violet-200/40",
              "bg-violet-300/50",
              "bg-violet-400/60",
              "bg-violet-500/70",
              "bg-violet-600",
            ].map((cls, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${cls}`} />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">많음</span>
          </div>

          {/* Selected Date Summary */}
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}>
            <h3 className="text-lg font-bold text-gray-900">
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일{" "}
              {weekdayNames[selectedDate.getDay()]}
            </h3>
            <p className="text-sm text-gray-400/80 mt-0.5">
              {pieces.length > 0
                ? `${pieces.reduce((s, p) => s + p.tasks.length, 0)}개 연습 · ${totalRecordings}개 녹음`
                : "연습 기록이 없습니다"}
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2: PRACTICE TO-DO LIST
        ═══════════════════════════════════════════════════════════════════ */}
        {pieces.length > 0 && (
          <div
            className="rounded-[20px] p-5 mb-4"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 8px 32px rgba(124,58,237,0.08)",
            }}
          >
            {/* Progress Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-gray-900">
                  완료한 연습 {totalCompleted}/{totalTasks}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500/80 transition-all duration-500 ease-out"
                  style={{ width: totalTasks > 0 ? `${(totalCompleted / totalTasks) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* Piece List */}
            <div>
              {pieces.map((piece, pieceIdx) => {
                const isExpanded = expandedPieces.has(piece.id);
                const allDone = piece.total > 0 && piece.completed === piece.total;
                const partialDone = piece.completed > 0 && piece.completed < piece.total;
                const isLast = pieceIdx === pieces.length - 1;

                return (
                  <div key={piece.id}>
                    {/* Collapsed Row */}
                    <button
                      onClick={() => togglePiece(piece.id)}
                      className="w-full flex items-center gap-3 py-3.5 text-left active:bg-white/10 transition-colors rounded-lg"
                    >
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {piece.recordingOnly ? (
                          <div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center">
                            <Music className="w-3.5 h-3.5 text-green-500" />
                          </div>
                        ) : allDone ? (
                          <CheckCircle2 className="w-6 h-6 text-violet-600" />
                        ) : partialDone ? (
                          <div className="w-6 h-6 rounded-full border-2 border-violet-400 flex items-center justify-center">
                            <div className="w-2 h-0.5 bg-violet-400 rounded-full" />
                          </div>
                        ) : (
                          <Circle className="w-6 h-6 text-gray-300/60" />
                        )}
                      </div>

                      {/* Piece Title */}
                      <span className="flex-1 text-[15px] font-medium text-gray-800 truncate">
                        {piece.title}
                      </span>

                      {/* Status + Chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        {piece.recordingOnly ? (
                          <span className="text-[13px] text-green-500 font-medium">녹음</span>
                        ) : (
                          <span className="text-[13px] text-violet-500/80 font-medium">
                            {piece.completed}/{piece.total}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    <div
                      className="overflow-hidden transition-all duration-300 ease-out"
                      style={{
                        maxHeight: isExpanded ? `${piece.tasks.length * 64 + 24}px` : "0px",
                        opacity: isExpanded ? 1 : 0,
                      }}
                    >
                      <div
                        className="mx-2 my-1.5 rounded-xl overflow-hidden"
                        style={{
                          background: "rgba(255,255,255,0.35)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.4)",
                        }}
                      >
                        {piece.tasks.map((task, taskIdx) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 px-3.5 py-3"
                            style={
                              taskIdx < piece.tasks.length - 1
                                ? { borderBottom: "1px solid rgba(255,255,255,0.2)" }
                                : undefined
                            }
                          >
                            {/* Check */}
                            <div className="shrink-0">
                              {task.hasRecording ? (
                                <Mic className="w-4 h-4 text-green-500/80" />
                              ) : task.done ? (
                                <Check className="w-4 h-4 text-green-500/80" />
                              ) : (
                                <div className="w-4 h-4 rounded border border-gray-300/60" />
                              )}
                            </div>

                            {/* Task detail */}
                            <div className={`flex-1 min-w-0 ${task.done && !task.hasRecording ? "line-through text-gray-400/60" : "text-gray-700"}`}>
                              <span className="text-[13px] leading-tight block truncate">
                                {task.text}
                                {task.tempo && (
                                  <span className="text-gray-400/80"> · 템포 {task.tempo}</span>
                                )}
                                {task.reps > 0 && (
                                  <span className="text-gray-400/80"> · {task.reps}회</span>
                                )}
                              </span>
                            </div>

                            {/* Time */}
                            <span className="text-[13px] text-gray-300/80 shrink-0">
                              {task.time || "미완료"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    {!isLast && (
                      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.3)" }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ─── Session Timeline Toggle ─── */}
            {sessions.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowTimeline(!showTimeline)}
                  className="text-sm text-violet-500 font-medium hover:text-violet-700 transition-colors"
                >
                  {showTimeline ? "연습 타임라인 숨기기" : "연습 타임라인 보기"}
                </button>

                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    maxHeight: showTimeline ? `${sessions.length * 80 + 32}px` : "0px",
                    opacity: showTimeline ? 1 : 0,
                  }}
                >
                  <div className="mt-3 ml-2 relative">
                    {/* Vertical line */}
                    <div
                      className="absolute left-[3px] top-2 bottom-2"
                      style={{ borderLeft: "2px solid rgba(167,139,250,0.3)" }}
                    />

                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-start gap-3 mb-3 relative">
                        {/* Dot */}
                        <div className="w-2 h-2 rounded-full bg-violet-400/60 mt-2.5 shrink-0 relative z-10" />

                        {/* Session Card */}
                        <div
                          className="flex-1 rounded-xl px-3.5 py-2.5"
                          style={{
                            background: "rgba(255,255,255,0.35)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.4)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-gray-800 truncate">
                              {session.piece}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {session.hasRecording && (
                                <span
                                  className="text-[11px] font-medium text-green-600 px-1.5 py-0.5 rounded-md"
                                  style={{
                                    background: "rgba(34,197,94,0.15)",
                                    backdropFilter: "blur(4px)",
                                  }}
                                >
                                  녹음
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[12px] text-gray-400">{session.detail}</span>
                            <span className="text-[12px] text-gray-400">·</span>
                            <span className="text-[12px] text-gray-400 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {session.duration}
                            </span>
                          </div>
                          <span className="text-[11px] text-violet-400 mt-1 block">{session.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {pieces.length === 0 && (
          <div
            className="rounded-[20px] p-8 mb-4 text-center"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 8px 32px rgba(124,58,237,0.08)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.35)" }}
            >
              <Music className="w-5 h-5 text-violet-300" />
            </div>
            <p className="text-sm text-gray-400">이 날은 연습 기록이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
