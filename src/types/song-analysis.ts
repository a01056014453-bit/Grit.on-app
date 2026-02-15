/** 곡 분석 7가지 항목 타입 정의 */

export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced" | "Virtuoso";
export type VerificationStatus = "Verified" | "Needs Review" | "Pending";

export interface SongAnalysisMeta {
  composer: string;
  title: string;
  opus: string;
  key: string;
  difficulty_level: DifficultyLevel;
}

export interface StructureSection {
  section: string;
  measures?: string;
  key_tempo?: string;
  character?: string;
  description: string;
}

export type TechniqueCategory = "Physiological" | "Interpretative" | "Structural";

export interface TechniqueTip {
  section: string;
  problem: string;
  category?: TechniqueCategory;
  solution: string;
  practice: string;
}

export interface RecommendedPerformance {
  artist: string;
  year: string;
  comment: string;
}

export interface SongAnalysisContent {
  /** 1. 작곡가 배경 */
  composer_background: string;
  /** 2. 시대적 상황 */
  historical_context: string;
  /** 3. 작품 배경 */
  work_background: string;
  /** 4. 곡 구조 - 모든 섹션/변주 개별 나열 */
  structure_analysis: StructureSection[];
  /** 5. 테크닉 팁 - 섹션별 1:1 매칭 솔루션 */
  technique_tips: TechniqueTip[];
  /** 6. 음악적 해석 */
  musical_interpretation: string;
  /** 7. 추천 연주 */
  recommended_performances: RecommendedPerformance[];
}

export interface SongAnalysis {
  id: string;
  meta: SongAnalysisMeta;
  content: SongAnalysisContent;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
  /** PDF 원본 저장 경로 (Supabase Storage) */
  pdf_storage_path?: string;
  /** MusicXML 소스 저장 경로 (Supabase Storage) */
  musicxml_storage_path?: string;
}

/** DB 캐시 저장 형식 */
export interface SongAnalysisCache {
  [key: string]: SongAnalysis; // key: `${composer}_${title}` 형식
}

/** API 요청 타입 */
export interface AnalyzeSongRequest {
  composer: string;
  title: string;
  forceRefresh?: boolean; // 캐시 무시하고 재분석
  sheetMusicImages?: string[]; // 악보 이미지 base64 data URL 배열 (선택)
  musicXml?: string; // MusicXML 텍스트 (OMR 변환 결과, 선택)
  pdfStoragePath?: string; // Supabase Storage PDF 경로
  musicxmlStoragePath?: string; // Supabase Storage MusicXML 경로
  useStoredSource?: boolean; // 관리자: 저장된 악보로 재분석
}

/** API 응답 타입 */
export interface AnalyzeSongResponse {
  success: boolean;
  data?: SongAnalysis;
  cached?: boolean; // 캐시에서 가져왔는지 여부
  error?: string;
}

/** 난이도 한국어 변환 */
export function getDifficultyLabel(level: DifficultyLevel): string {
  switch (level) {
    case "Beginner": return "초급";
    case "Intermediate": return "중급";
    case "Advanced": return "고급";
    case "Virtuoso": return "전문가";
    default: return "중급";
  }
}

/** 검증 상태 한국어 변환 */
export function getVerificationLabel(status: VerificationStatus): string {
  switch (status) {
    case "Verified": return "검증됨";
    case "Needs Review": return "검수 필요";
    case "Pending": return "분석 중";
    default: return "미확인";
  }
}
