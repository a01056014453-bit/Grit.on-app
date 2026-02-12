// Plan 관련 타입 정의

/** 주간 연습 데이터 */
export interface WeeklyData {
  day: number;
  minutes: number;
  target: number;
  completed: boolean;
}

/** 드릴 카드 유형 */
export type DrillType = "rhythm" | "sync" | "pedal" | "dynamics" | "tempo" | "technique" | "phrasing" | "fingering" | "custom";

/** 드릴 카드 */
export interface DrillCard {
  id: string;
  type: DrillType;
  icon: string;
  song: string;
  title: string;
  measures: string;
  action: string;
  tempo: number;
  duration: number;
  recurrence: number;
  confidence: number;
}

/** 오늘의 연습 계획 항목 */
export interface TodayPlanItem {
  id: string;
  piece: string;
  measures: string;
  duration: number;
  priority: "high" | "medium" | "low";
  completed: boolean;
  note: string;
}

/** AI 제안 유형 */
export type AISuggestionType = "tempo" | "dynamics" | "practice";

/** AI 제안 항목 */
export interface AISuggestion {
  id: string;
  type: AISuggestionType;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

/** 사용자 정보 */
export interface User {
  name: string;
  instrument: string;
  level: string;
  currentPiece: string;
}

/** 통계 정보 */
export interface Stats {
  totalHours: number;
  weekSessions: number;
  streakDays: number;
  todayMinutes: number;
  dailyGoal: number;
  weeklyGoal: number;
  weeklyProgress: number;
  averageScore: number;
  totalRecordings: number;
}
