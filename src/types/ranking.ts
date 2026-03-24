// 악기 타입
export type InstrumentType =
  | "piano"
  | "violin"
  | "cello"
  | "flute"
  | "clarinet"
  | "guitar"
  | "vocal";

// 악기 라벨
export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  piano: "피아노",
  violin: "바이올린",
  cello: "첼로",
  flute: "플루트",
  clarinet: "클라리넷",
  guitar: "기타",
  vocal: "보컬",
};

// 악기 이모지
export const INSTRUMENT_EMOJIS: Record<InstrumentType, string> = {
  piano: "🎹",
  violin: "🎻",
  cello: "🎻",
  flute: "🎵",
  clarinet: "🎷",
  guitar: "🎸",
  vocal: "🎤",
};

// 랭킹 유저 정보
export interface RankingUser {
  id: string;
  nickname: string;
  instrument: InstrumentType;
  netPracticeTime: number; // 초 단위
  isPracticing: boolean; // 현재 연습 중인지
  practiceStartedAt?: string; // 연습 시작 시간 (ISO string)
  currentSong?: string; // 현재 연습 중인 곡
  gritScore: number; // 0-100
  rank: number;
}

// 랭킹 필터
export interface RankingFilter {
  schoolId?: string;
  instrument?: InstrumentType;
}

// 학교 정보 (필터 선택용)
export interface SchoolOption {
  id: string;
  name: string;
  shortName: string;
}

// Grit 점수 레벨
export type GritLevel = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export const GRIT_LEVEL_THRESHOLDS: Record<GritLevel, number> = {
  bronze: 0,
  silver: 20,
  gold: 40,
  platinum: 60,
  diamond: 80,
};

export const GRIT_LEVEL_COLORS: Record<GritLevel, string> = {
  bronze: "bg-amber-600",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-cyan-400",
  diamond: "bg-violet-500",
};

export function getGritLevel(score: number): GritLevel {
  if (score >= 80) return "diamond";
  if (score >= 60) return "platinum";
  if (score >= 40) return "gold";
  if (score >= 20) return "silver";
  return "bronze";
}
