// Practice 관련 타입 정의

/** 연습 유형 */
export type PracticeType = "partial" | "routine" | "runthrough";

/** 연습 유형 정보 */
export interface PracticeTypeInfo {
  id: PracticeType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: "blue" | "green" | "purple";
}

/** 곡 정보 */
export interface Song {
  id: string;
  title: string;
  duration: string;
  lastPracticed: string;
}

/** 새 곡 추가 폼 데이터 */
export interface NewSongForm {
  composer: string;
  songType: string;
  opus: string;
  number: string;
  duration: string;
}

/** 완료된 연습 세션 정보 */
export interface CompletedSession {
  totalTime: number;
  practiceTime: number;
  practiceType: PracticeType;
}

/** 최근 녹음 항목 (연습 페이지용) */
export interface RecentRecording {
  id: string;
  title: string;
  duration: string;
  score: number;
  date: string;
  focusAreas: number;
}

/** 테크닉 유형 */
export type TechniqueType =
  | "dotted"      // 붓점
  | "staccato"    // 스타카토
  | "legato"      // 레가토
  | "octave"      // 옥타브
  | "arpeggio"    // 아르페지오
  | "scale"       // 스케일
  | "trill"       // 트릴
  | "dynamics"    // 강약
  | "pedal"       // 페달링
  | "rhythm"      // 리듬
  | "other";      // 기타

/** 테크닉 라벨 맵 */
export const TECHNIQUE_LABELS: Record<TechniqueType, string> = {
  dotted: "붓점",
  staccato: "스타카토",
  legato: "레가토",
  octave: "옥타브",
  arpeggio: "아르페지오",
  scale: "스케일",
  trill: "트릴",
  dynamics: "강약",
  pedal: "페달링",
  rhythm: "리듬",
  other: "기타",
};

/** 연습 To-do 항목 */
export interface PracticeTodo {
  id: string;
  songId: string;
  songTitle: string;
  measureStart: number;
  measureEnd: number;
  technique?: TechniqueType;
  note?: string; // 자유 입력 메모 (테크닉, 메모 등)
  targetTempo?: number;
  targetRepetitions?: number;
  completedRepetitions: number;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
  order: number;
}
