// 작곡가 정보
export interface Composer {
  fullName: string;
  shortName: string;
  nationality: string;
}

// 분석 상태
export type AnalysisStatus = "completed" | "pending" | "failed";

// AI 분석 완료된 곡 정보
export interface AnalyzedPiece {
  id: string;
  composer: Composer;
  title: string;
  opus: string;
  key?: string;
  movement?: number;
  movementTitle?: string;
  nickname?: string | null;
  analysisStatus: AnalysisStatus;
  createdAt: string;
}

// 곡 검색용 간단 정보
export interface PieceSearchResult {
  id: string;
  displayName: string; // "F. Chopin Ballade Op.23 No.1"
  composer: string;
  hasAnalysis: boolean;
}

// 마디별 난이도 (연습용)
export type PracticeDifficultyLevel = "easy" | "medium" | "hard" | "very_hard";

// 마디별 분석 데이터
export interface MeasureAnalysis {
  measureNumber: number;           // 마디 번호
  startMeasure: number;            // 시작 마디
  endMeasure: number;              // 끝 마디
  sectionName: string;             // "제시부", "발전부", "재현부", "코다"
  technicalDifficulty: PracticeDifficultyLevel;
  techniques: string[];            // ["옥타브", "트릴", "아르페지오"]
  suggestedTempo: {
    min: number;                   // 최소 BPM
    max: number;                   // 최대 BPM
    practice: number;              // 연습 권장 BPM
  };
  rhythmPattern: string;           // "4/4", "3/4", "6/8"
  dynamics: string;                // "pp", "p", "mp", "mf", "f", "ff"
  expression: string[];            // ["legato", "dolce", "con fuoco"]
  practiceNotes: string;           // AI 연습 조언
}

// 곡 전체 분석 데이터
export interface PieceAnalysis {
  pieceId: string;
  totalMeasures: number;
  estimatedDuration: number;       // 초 단위
  overallDifficulty: PracticeDifficultyLevel;
  keySignature: string;            // "G minor"
  timeSignature: string;           // "6/8"
  form: string;                    // "소나타 형식", "론도 형식"
  sections: MeasureAnalysis[];     // 마디별/섹션별 분석
  practiceRecommendations: string[];
  commonMistakes: string[];
  analyzedAt: string;
}

// 유저의 곡별 연습 데이터
export interface PiecePracticeData {
  pieceId: string;
  userId: string;
  totalPracticeTime: number;       // 총 연습 시간 (초)
  sessionCount: number;            // 연습 세션 수
  lastPracticedAt: string;
  measureProgress: MeasureProgress[];
  averageAccuracy?: number;        // 평균 정확도 (%)
  completionPercentage: number;    // 완성도 (%)
}

// 마디별 연습 진행도
export interface MeasureProgress {
  measureStart: number;
  measureEnd: number;
  practiceCount: number;           // 연습 횟수
  practiceTime: number;            // 연습 시간 (초)
  mastery: "not_started" | "learning" | "practicing" | "mastered";
  lastPracticedAt?: string;
}
