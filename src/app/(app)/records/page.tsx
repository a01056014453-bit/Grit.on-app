"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  Plus,
  X,
} from "lucide-react";
import { usePracticeSessions } from "@/hooks";
import { savePracticeSession, getAllSessions, deleteSession } from "@/lib/db";
import {
  buildPiecesForDate,
  buildSessionsForDate,
  buildCalendarData,
  buildScheduledDays,
  formatDateStr,
  saveScheduledDrillIds,
  loadCompletedDrills,
  getAllAvailableDrills,
} from "@/lib/drill-records";
import { ScheduleModal } from "@/components/practice";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCountStyle(count: number, isToday: boolean, isFuture: boolean, hasSchedule: boolean) {
  if (isFuture && hasSchedule) return "bg-violet-100/60 text-violet-400";
  if (isFuture) return "bg-white/10 opacity-30";
  if (isToday) return "bg-violet-600 text-white shadow-lg shadow-violet-500/30";
  if (count >= 1) return "bg-violet-200/40 text-violet-500";
  return "bg-white/20 backdrop-blur-sm";
}

const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

// ─── Component ───────────────────────────────────────────────────────────────

export default function RecordsPage() {
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today);
  const [expandedPieces, setExpandedPieces] = useState<Set<number>>(new Set());
  const [showTimeline, setShowTimeline] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // IndexedDB 세션 로드
  const { sessions, reload: reloadSessions } = usePracticeSessions();

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();

  const dateStr = formatDateStr(selectedDate);
  const isSelectedToday =
    selectedDate.getFullYear() === today.getFullYear() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getDate() === today.getDate();

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

  // 동적 데이터 생성
  const pieces = useMemo(() => buildPiecesForDate(dateStr, sessions), [dateStr, sessions, refreshKey]);
  const recordSessions = useMemo(() => buildSessionsForDate(dateStr, sessions), [dateStr, sessions]);
  const calendarData = useMemo(() => buildCalendarData(calendarYear, calendarMonth, sessions), [calendarYear, calendarMonth, sessions]);
  const scheduledDays = useMemo(() => buildScheduledDays(calendarYear, calendarMonth), [calendarYear, calendarMonth, refreshKey]);

  const totalCompleted = pieces.reduce((s, p) => s + p.completed, 0);
  const totalTasks = pieces.reduce((s, p) => s + p.total, 0);
  const totalRecordings = recordSessions.filter((s) => s.hasRecording).length;

  // Practice days count for the month
  const practiceDaysInMonth = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if ((calendarData[d] || 0) > 0) count++;
    }
    return count;
  }, [daysInMonth, calendarData]);

  // 스케줄 저장
  const handleSaveSchedule = useCallback(
    (ids: string[]) => {
      saveScheduledDrillIds(dateStr, ids);
      setIsScheduleModalOpen(false);
      setRefreshKey((k) => k + 1);
    },
    [dateStr]
  );

  // 드릴 완료 토글 (오늘만)
  const handleToggleComplete = useCallback(
    async (drillId: string) => {
      if (!isSelectedToday) return;

      const completedIds = loadCompletedDrills(dateStr);
      const wasDone = completedIds.has(drillId);

      // localStorage 업데이트
      if (wasDone) {
        completedIds.delete(drillId);
      } else {
        completedIds.add(drillId);
      }
      localStorage.setItem(
        `grit-on-completed-${dateStr}`,
        JSON.stringify({ date: dateStr, completedDrillIds: Array.from(completedIds) })
      );

      const allDrills = getAllAvailableDrills();
      const drill = allDrills.find((d) => d.id === drillId);

      // IndexedDB 세션 저장/삭제
      if (!wasDone && drill) {
        try {
          const now = new Date();
          const durationSec = (drill.duration || 3) * 60;
          const startTime = new Date(now.getTime() - durationSec * 1000);
          await savePracticeSession({
            pieceId: `drill-${drill.id}`,
            pieceName: drill.song,
            startTime,
            endTime: now,
            totalTime: durationSec,
            practiceTime: durationSec,
            synced: false,
            practiceType: "partial",
            label: "드릴 완료",
            todoNote: `${drill.measures} · ${drill.title}`,
          });
        } catch (err) {
          console.error("Failed to save drill session:", err);
        }
      }

      if (wasDone && drill) {
        try {
          const allSess = await getAllSessions();
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const matching = allSess.filter((s) => {
            if (s.pieceId !== `drill-${drill.id}`) return false;
            const sd = new Date(s.startTime);
            sd.setHours(0, 0, 0, 0);
            return sd.getTime() === todayStart.getTime();
          });
          for (const s of matching) {
            if (s.id != null) await deleteSession(s.id);
          }
        } catch (err) {
          console.error("Failed to delete drill session:", err);
        }
      }

      await reloadSessions();
      setRefreshKey((k) => k + 1);
    },
    [isSelectedToday, dateStr, reloadSessions]
  );

  // 클라이언트 마운트 후 데이터 갱신
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted) setRefreshKey((k) => k + 1);
  }, [mounted]);

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

        {/* CALENDAR CARD */}
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
              <span className="text-[18px] font-bold text-gray-900">
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
              <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-full hover:bg-white/30 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-400 hover:text-violet-600" />
              </button>
              <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-full hover:bg-white/30 transition-colors">
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
            {Array(firstDayOfMonth)
              .fill(null)
              .map((_, i) => (
                <div key={`e-${i}`} className="flex flex-col items-center py-1">
                  <div className="w-8 h-8" />
                  <span className="text-[10px] h-4" />
                </div>
              ))}

            {Array(daysInMonth)
              .fill(null)
              .map((_, i) => {
                const day = i + 1;
                const count = calendarData[day] || 0;
                const hasSchedule = scheduledDays.has(day);
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
                        isFuture,
                        hasSchedule
                      )} ${isSelected && !isToday ? "ring-2 ring-violet-400 ring-offset-1 ring-offset-transparent" : ""}`}
                    >
                      {!isFuture && count > 0 ? count : isFuture && hasSchedule ? "·" : ""}
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
          <div className="flex items-center justify-end gap-2 mt-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-violet-100/60 border border-violet-200" />
              <span className="text-[10px] text-gray-400">일정</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-violet-200/40" />
              <span className="text-[10px] text-gray-400">연습</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-violet-600" />
              <span className="text-[10px] text-gray-400">오늘</span>
            </div>
          </div>

          {/* Selected Date Summary */}
          <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-gray-900">
                  {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일{" "}
                  {weekdayNames[selectedDate.getDay()]}
                </h3>
                <p className="text-[11px] text-gray-400/80 mt-0.5">
                  {pieces.length > 0
                    ? `${pieces.reduce((s, p) => s + p.tasks.length, 0)}개 연습 · ${totalRecordings}개 녹음`
                    : "연습 일정이 없습니다"}
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center hover:bg-violet-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* ─── DRILL LIST ─── */}
          {pieces.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}>
              {/* Progress Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-bold text-gray-900">
                    {isSelectedToday ? "오늘의 연습" : "연습 일정"} {totalCompleted}/{totalTasks}
                  </span>
                  {!isSelectedToday && (
                    <span className="text-[10px] text-gray-400">
                      {isSelectedToday ? "" : selectedDate > today ? "예정" : "완료 기록"}
                    </span>
                  )}
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
                        <div className="shrink-0">
                          {allDone ? (
                            <CheckCircle2 className="w-6 h-6 text-violet-600" />
                          ) : partialDone ? (
                            <div className="w-6 h-6 rounded-full border-2 border-violet-400 flex items-center justify-center">
                              <div className="w-2 h-0.5 bg-violet-400 rounded-full" />
                            </div>
                          ) : (
                            <Circle className="w-6 h-6 text-gray-300/60" />
                          )}
                        </div>
                        <span className="flex-1 text-[12px] font-medium text-gray-800 truncate">
                          {piece.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-violet-500/80 font-medium">
                            {piece.completed}/{piece.total}
                          </span>
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
                              {/* Completion toggle */}
                              <button
                                className="shrink-0"
                                disabled={!isSelectedToday}
                                onClick={() => handleToggleComplete(task.drillId)}
                              >
                                {task.done ? (
                                  <div className="w-[18px] h-[18px] rounded-md bg-violet-500 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </div>
                                ) : isSelectedToday ? (
                                  <div className="w-[18px] h-[18px] rounded-md border-[1.5px] border-gray-300 hover:border-violet-400 transition-colors" />
                                ) : (
                                  <div className="w-[18px] h-[18px] rounded-md border-[1.5px] border-gray-200/60" />
                                )}
                              </button>

                              {/* Task detail */}
                              <div className={`flex-1 min-w-0 ${task.done ? "line-through text-gray-400/60" : "text-gray-700"}`}>
                                <span className="text-[10px] leading-tight block truncate">
                                  {task.text}
                                  {task.tempo && (
                                    <span className="text-gray-400/80"> · 템포 {task.tempo}</span>
                                  )}
                                  {task.reps > 0 && (
                                    <span className="text-gray-400/80"> · {task.reps}회</span>
                                  )}
                                </span>
                              </div>

                              {/* Time / status */}
                              <span className="text-[10px] text-gray-300/80 shrink-0">
                                {task.time || (task.done ? "" : isSelectedToday ? "미완료" : "예정")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {!isLast && (
                        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.3)" }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Session Timeline Toggle */}
              {recordSessions.length > 0 && (
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
                      maxHeight: showTimeline ? `${recordSessions.length * 80 + 32}px` : "0px",
                      opacity: showTimeline ? 1 : 0,
                    }}
                  >
                    <div className="mt-3 ml-2 relative">
                      <div
                        className="absolute left-[3px] top-2 bottom-2"
                        style={{ borderLeft: "2px solid rgba(167,139,250,0.3)" }}
                      />
                      {recordSessions.map((session) => (
                        <div key={session.id} className="flex items-start gap-3 mb-3 relative">
                          <div className="w-2 h-2 rounded-full bg-violet-400/60 mt-2.5 shrink-0 relative z-10" />
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
                                    style={{ background: "rgba(34,197,94,0.15)" }}
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
        </div>

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
            <p className="text-sm text-gray-400 mb-3">이 날은 연습 일정이 없습니다</p>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 text-white text-[13px] font-medium hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              연습 일정 추가
            </button>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <ScheduleModal
          dateStr={dateStr}
          dateLabel={`${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 ${weekdayNames[selectedDate.getDay()]}`}
          onClose={() => setIsScheduleModalOpen(false)}
          onSave={handleSaveSchedule}
        />
      )}
    </div>
  );
}
