/**
 * drill-records.ts
 * 드릴 데이터 ↔ 연습기록 브릿지
 * TodayDrillList의 완료 상태를 records 페이지에서 동적으로 표시
 */

import { mockDrillCards, groupDrillsBySong } from "@/data";
import type { DrillCard } from "@/types";
import type { PracticeSession } from "@/lib/db";

// ─── Shared Interfaces ───────────────────────────────────────────────────────

export interface RecordTask {
  id: number;
  drillId: string;
  text: string;
  tempo: number | null;
  reps: number;
  time: string | null;
  done: boolean;
  hasRecording?: boolean;
}

export interface RecordPiece {
  id: number;
  title: string;
  completed: number;
  total: number;
  recordingOnly?: boolean;
  tasks: RecordTask[];
}

export interface RecordSession {
  id: number;
  time: string;
  piece: string;
  detail: string;
  duration: string;
  hasRecording?: boolean;
}

// ─── localStorage Helpers ────────────────────────────────────────────────────

export function loadCustomDrills(): DrillCard[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("grit-on-custom-drills");
  if (!saved) return [];
  try {
    const drills = JSON.parse(saved);
    return drills.map((d: any) => ({
      id: d.id,
      type: "custom" as const,
      icon: "",
      song: d.song,
      title: d.title || "연습",
      measures: d.measures,
      action: "",
      tempo: d.tempo || 0,
      duration: d.duration || 0,
      recurrence: d.recurrence || 1,
      confidence: 0,
    }));
  } catch {
    return [];
  }
}

export function loadHiddenDrills(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const saved = localStorage.getItem("grit-on-hidden-drills");
  if (!saved) return new Set();
  try {
    return new Set(JSON.parse(saved));
  } catch {
    return new Set();
  }
}

export function loadCompletedDrills(dateStr: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  const saved = localStorage.getItem(`grit-on-completed-${dateStr}`);
  if (!saved) return new Set();
  try {
    const data = JSON.parse(saved);
    return new Set(data.completedDrillIds || []);
  } catch {
    return new Set();
  }
}

// ─── Schedule (날짜별 연습 일정) ─────────────────────────────────────────────

export function loadScheduledDrillIds(dateStr: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  const saved = localStorage.getItem(`grit-on-scheduled-${dateStr}`);
  if (!saved) return new Set();
  try {
    return new Set(JSON.parse(saved));
  } catch {
    return new Set();
  }
}

export function saveScheduledDrillIds(dateStr: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  if (ids.length === 0) {
    localStorage.removeItem(`grit-on-scheduled-${dateStr}`);
  } else {
    localStorage.setItem(`grit-on-scheduled-${dateStr}`, JSON.stringify(ids));
  }
}

/** 해당 월에서 일정이 잡힌 날짜 Set */
export function buildScheduledDays(year: number, month: number): Set<number> {
  if (typeof window === "undefined") return new Set();
  const result = new Set<number>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(new Date(year, month, d));
    const saved = localStorage.getItem(`grit-on-scheduled-${dateStr}`);
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids) && ids.length > 0) result.add(d);
      } catch { /* ignore */ }
    }
  }
  return result;
}

/** 사용 가능한 전체 드릴 목록 (mock + custom - hidden) */
export function getAllAvailableDrills(): DrillCard[] {
  const customDrills = loadCustomDrills();
  const hiddenDrills = loadHiddenDrills();
  return [...mockDrillCards, ...customDrills].filter(
    (d) => !hiddenDrills.has(d.id)
  );
}

// ─── Bridge Functions ────────────────────────────────────────────────────────

/** 날짜 → zero-padded YYYY-MM-DD */
export function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 특정 날짜의 드릴 상태 → RecordPiece[] 생성
 * 완료된 드릴 + 스케줄된 드릴을 곡별로 그룹핑
 */
export function buildPiecesForDate(
  dateStr: string,
  sessions: PracticeSession[]
): RecordPiece[] {
  const allDrills = getAllAvailableDrills();
  const completedIds = loadCompletedDrills(dateStr);
  const scheduledIds = loadScheduledDrillIds(dateStr);

  // 완료 또는 스케줄된 드릴만 표시
  const relevantIds = new Set([...completedIds, ...scheduledIds]);
  if (relevantIds.size === 0) return [];

  const relevantDrills = allDrills.filter((d) => relevantIds.has(d.id));
  if (relevantDrills.length === 0) return [];

  const grouped = groupDrillsBySong(relevantDrills);

  // 해당 날짜의 세션 맵 (pieceId → session)
  const sessionMap = new Map<string, PracticeSession>();
  sessions.forEach((s) => {
    const sd = new Date(s.startTime);
    const sDateStr = formatDateStr(sd);
    if (sDateStr === dateStr) {
      sessionMap.set(s.pieceId, s);
    }
  });

  let pieceIdCounter = 1;
  let taskIdCounter = 1;

  return grouped.map((group) => {
    const tasks: RecordTask[] = group.drills.map((drill) => {
      const isDone = completedIds.has(drill.id);
      const matchingSession = sessionMap.get(`drill-${drill.id}`);
      const timeStr = matchingSession
        ? formatTimeFromDate(new Date(matchingSession.startTime))
        : null;

      return {
        id: taskIdCounter++,
        drillId: drill.id,
        text: `${drill.measures} ${drill.title}`,
        tempo: drill.tempo > 0 ? drill.tempo : null,
        reps: isDone ? drill.recurrence : 0,
        time: isDone ? timeStr : null,
        done: isDone,
      };
    });

    const completedCount = tasks.filter((t) => t.done).length;
    const totalCount = tasks.length;

    return {
      id: pieceIdCounter++,
      title: group.song,
      completed: completedCount,
      total: totalCount,
      tasks,
    };
  });
}

/**
 * 특정 날짜의 IndexedDB PracticeSession → RecordSession[] 생성
 */
export function buildSessionsForDate(
  dateStr: string,
  sessions: PracticeSession[]
): RecordSession[] {
  let idCounter = 1;

  return sessions
    .filter((s) => {
      const sd = new Date(s.startTime);
      return formatDateStr(sd) === dateStr;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .map((s) => {
      const durationMin = Math.round(s.totalTime / 60);
      return {
        id: idCounter++,
        time: formatTimeFromDate(new Date(s.startTime)),
        piece: s.pieceName,
        detail: s.todoNote || s.label || "",
        duration: `${durationMin}분`,
        hasRecording: !!s.audioBlob,
      };
    });
}

/**
 * 세션 배열 → 캘린더 히트맵 데이터 (일별 세션 수)
 */
export function buildCalendarData(
  year: number,
  month: number, // 0-indexed
  sessions: PracticeSession[]
): Record<number, number> {
  const result: Record<number, number> = {};

  sessions.forEach((s) => {
    const d = new Date(s.startTime);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      result[day] = (result[day] || 0) + 1;
    }
  });

  return result;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function formatTimeFromDate(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
