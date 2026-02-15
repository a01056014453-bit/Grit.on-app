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

// ── V2 타입: 7개 섹션 상세 분석 ──

/** 1. 곡의 개요 */
export interface SongOverview {
  title_original: string;
  title_korean?: string;
  composition_period: string;
  tempo_marking: string;
  genre: string;
  form: string;
  musical_features: string[];
}

/** 2. 작곡가 생애 - 타임라인 항목 */
export interface ComposerTimelineEntry {
  period: string;
  description: string;
}

/** 2. 작곡가 생애 */
export interface ComposerLife {
  summary: string;
  timeline: ComposerTimelineEntry[];
  at_composition: string;
}

/** 3. 시대적 배경 */
export interface HistoricalBackground {
  era_characteristics: string;
  contemporary_composers: string;
  musical_movement: string;
}

/** 4. 곡의 특징 */
export interface SongCharacteristics {
  composition_background: string;
  form_and_structure: string;
  technique: string;
  literary_dramatic: string;
  conclusion: string;
}

/** 5. 구조/화성 분석 V2 - 구간별 구성 */
export interface StructureSectionV2 {
  section: string;
  measures: string;
  key_signature: string;
  time_signature: string;
  tempo: string;
  mood: string;
  description: string;
}

/** 5. 구조/화성 분석 V2 - 화성 분석 테이블 행 */
export interface HarmonyTableRow {
  measure: string;
  beat: string;
  chord: string;
  roman_numeral: string;
  function: string;
  voice_leading: string;
  pedal: string;
  note: string;
}

/** 5. 구조/화성 분석 V2 */
export interface StructureAnalysisV2 {
  sections: StructureSectionV2[];
  harmony_table: HarmonyTableRow[];
}

/** 6. 연습법 - 기술 카테고리 표 항목 */
export interface PracticeTechniqueItem {
  category: string;
  items: string[];
}

/** 6. 연습법 - 구간별 연습 가이드 */
export interface PracticeSectionGuide {
  section: string;
  guide: string;
}

/** 6. 연습법 - 4주 루틴 1일 항목 */
export interface WeeklyRoutineDay {
  day: string;
  focus: string;
  tasks: string[];
}

/** 6. 연습법 - 4주 루틴 1주 */
export interface WeeklyRoutine {
  week: number;
  theme: string;
  days: WeeklyRoutineDay[];
}

/** 6. 연습법 */
export interface PracticeMethod {
  technique_summary: PracticeTechniqueItem[];
  section_guides: PracticeSectionGuide[];
  weekly_routine: WeeklyRoutine[];
}

/** 7. 추천 연주 V2 */
export interface RecommendedPerformanceV2 {
  artist: string;
  year: string;
  comment: string;
  youtube_url?: string;
}

/** V2 확장 콘텐츠 (기존 content에 optional로 추가) */
export interface SongAnalysisContentV2 extends SongAnalysisContent {
  /** V2: 곡의 개요 */
  song_overview?: SongOverview;
  /** V2: 작곡가 생애 */
  composer_life?: ComposerLife;
  /** V2: 시대적 배경 */
  historical_background?: HistoricalBackground;
  /** V2: 곡의 특징 */
  song_characteristics?: SongCharacteristics;
  /** V2: 구조/화성 분석 */
  structure_analysis_v2?: StructureAnalysisV2;
  /** V2: 연습법 + 4주 루틴 */
  practice_method?: PracticeMethod;
  /** V2: 추천 연주 (youtube_url 포함) */
  recommended_performances_v2?: RecommendedPerformanceV2[];
}

export interface SongAnalysis {
  id: string;
  meta: SongAnalysisMeta;
  content: SongAnalysisContent | SongAnalysisContentV2;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
  /** PDF 원본 저장 경로 (Supabase Storage) */
  pdf_storage_path?: string;
  /** MusicXML 소스 저장 경로 (Supabase Storage) */
  musicxml_storage_path?: string;
  /** V2: 스키마 버전 (1 = 기존, 2 = 7섹션 상세) */
  schema_version?: number;
}

/** V2 타입 가드 */
export function isV2Content(content: SongAnalysisContent | SongAnalysisContentV2): content is SongAnalysisContentV2 {
  return 'song_overview' in content || 'composer_life' in content;
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
  useV2?: boolean; // V2 상세 분석 사용
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
