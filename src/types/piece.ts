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
