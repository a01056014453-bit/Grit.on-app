/**
 * song-analysis-v3.ts — V3 곡 분석 타입 (연습 코칭 중심)
 *
 * V1: 7개 텍스트 필드 (composer_background, structure_analysis 등)
 * V2: 7개 섹션 상세 (song_overview, composer_life, structure_analysis_v2 등)
 * V3: 연습 코칭 중심 — 검증된 사실 + 기술 과제 + 연습 플랜 + 함정
 *
 * 이 파일은 V3 전용 타입만 정의한다.
 * 기존 V1/V2 타입은 song-analysis.ts에 그대로 유지.
 */

import type {
  DifficultyLevel,
  VerificationStatus,
  SongAnalysis,
} from "./song-analysis";

// ════════════════════════════════════════════════════════
// 작품 유형
// ════════════════════════════════════════════════════════

/** 작품의 구조적 유형 — 분석 흐름과 UI 분기에 사용 */
export type WorkType =
  | "single_movement_piece"   // 단악장 소품 (녹턴, 에튀드, 전주곡 등)
  | "multi_movement_sonata"   // 다악장 소나타/협주곡/교향곡
  | "suite_or_collection"     // 모음곡/소품집 (전람회의 그림, 어린이 정경 등)
  | "variation_set"           // 변주곡 (골드베르크, 디아벨리 등)
  | "unknown";                // 판별 불가

// ════════════════════════════════════════════════════════
// 작품 식별 (Canonical Work Reference)
// ════════════════════════════════════════════════════════

/** 작품을 고유하게 식별하는 정규화된 메타데이터 */
export interface CanonicalWorkRef {
  /** 표시용 작곡가 이름 (예: "Ludwig van Beethoven") */
  composer_display: string;
  /** 검색/캐시용 정규화 이름 (예: "beethoven") */
  composer_normalized: string;
  /** 정식 제목 (예: "Piano Sonata No. 23 in F minor") */
  canonical_title: string;
  /** 부제/별칭 (예: "Appassionata") */
  subtitle?: string;
  /** 작품번호/카탈로그 번호 (예: "Op. 57", "BWV 846") */
  opus_catalogue?: string;
  /** 모음곡/세트 내 번호 (예: 3 → "No. 3") */
  work_number?: number;
  /** 조성 (예: "F minor") */
  key?: string;
  /** 외부 소스 ID (IMSLP work ID 등) */
  source_work_id?: string;
}

// ════════════════════════════════════════════════════════
// 검증된 사실 (Verified Fact)
// ════════════════════════════════════════════════════════

/** 사실 데이터의 출처 */
export type FactSource =
  | "IMSLP"            // IMSLP 악보/메타데이터에서 확인
  | "MusicXML"         // MusicXML 파싱으로 확인
  | "Manual"           // 사람이 직접 입력/검증
  | "Model-Inferred";  // AI 모델이 추론 (검증 안 됨)

/** 사실의 신뢰도 */
export type FactConfidence = "high" | "medium" | "low";

/** 개별 검증된 사실 — 조성, 박자, 작곡 연도 등 */
export interface VerifiedFact {
  /** 사실의 라벨 (예: "조성", "박자", "작곡 연도", "총 마디 수") */
  label: string;
  /** 사실의 값 (예: "F minor", "3/4", "1804", "312") */
  value: string;
  /** 출처 */
  source: FactSource;
  /** 신뢰도 */
  confidence: FactConfidence;
}

// ════════════════════════════════════════════════════════
// 작품 요약 (Work Summary)
// ════════════════════════════════════════════════════════

/** 작품에 대한 코칭 관점 요약 — 보고서가 아닌 연습 맥락 */
export interface WorkSummary {
  /** 작품의 핵심 성격 한 줄 요약 (예: "격렬한 정열과 비극적 긴장의 소나타") */
  one_liner: string;
  /** 이 곡을 연습하기 전에 알아야 할 배경 (3-5문장) */
  context_for_practice: string;
  /** 작품의 전체 구조 개요 (악장/섹션 흐름 설명, 3-5문장) */
  structural_overview: string;
  /** 작곡가의 의도 또는 이 곡의 음악적 핵심 (2-3문장) */
  artistic_intent: string;
}

// ════════════════════════════════════════════════════════
// 기술적 과제 (Technical Demand)
// ════════════════════════════════════════════════════════

/** 기술 과제의 카테고리 */
export type TechnicalDemandCategory =
  | "tone_production"     // 소리 만들기 (터치, 보잉, 앙부쉬르)
  | "articulation"        // 아티큘레이션 (레가토, 스타카토, 악센트)
  | "dynamic_control"     // 다이내믹 (pp-ff 범위, 점진적 변화)
  | "tempo_rhythm"        // 템포/리듬 (폴리리듬, 루바토, 박자 변화)
  | "passage_work"        // 패시지워크 (스케일, 아르페지오, 옥타브)
  | "polyphony"           // 다성부 처리 (보이싱, 성부 독립)
  | "pedaling"            // 페달링 (피아노) / 활 배분 (현악)
  | "physical_endurance"  // 체력/지구력
  | "memorization"        // 암보 난관
  | "other";              // 기타

/** 이 곡에서 요구하는 개별 기술 과제 */
export interface TechnicalDemand {
  /** 카테고리 */
  category: TechnicalDemandCategory;
  /** 과제 제목 (예: "좌우 교차 옥타브 패시지") */
  title: string;
  /** 구체적 설명 — 어디서 왜 어려운지 (2-3문장) */
  description: string;
  /** 해당 위치 (예: "1악장 발전부", "mm.51-93") — 확인된 경우만 */
  location?: string;
  /** 난이도 */
  severity: "critical" | "major" | "moderate";
}

// ════════════════════════════════════════════════════════
// 음악적 과제 (Musical Challenge)
// ════════════════════════════════════════════════════════

/** 기교가 아닌 음악적/해석적 과제 */
export interface MusicalChallenge {
  /** 과제 제목 (예: "코다의 비극적 절정 표현") */
  title: string;
  /** 왜 어려운지, 어떤 해석이 필요한지 (2-4문장) */
  description: string;
  /** 해당 위치 */
  location?: string;
  /** 참고할 만한 연주자의 접근법 (선택) */
  reference_interpretation?: string;
}

// ════════════════════════════════════════════════════════
// 연습 플랜 (Practice Plan)
// ════════════════════════════════════════════════════════

/** 연습 플랜의 개별 단계 */
export interface PracticePhase {
  /** 단계 번호 (1부터) */
  phase: number;
  /** 단계 이름 (예: "1주차: 1악장 제시부 해부") */
  title: string;
  /** 이 단계의 목표 (1-2문장) */
  goal: string;
  /** 권장 기간 (예: "3-5일", "1주") */
  duration: string;
  /** 구체적 연습 과제 목록 */
  tasks: PracticeTask[];
}

/** 연습 플랜의 개별 과제 */
export interface PracticeTask {
  /** 과제 설명 — 구체적 동작 수준 (예: "mm.1-8 왼손만 느리게, 각 음의 무게감 확인") */
  instruction: string;
  /** 대상 위치 (예: "mm.1-8", "1악장 제시부") */
  target?: string;
  /** 권장 연습 시간 (분 단위, 선택) */
  minutes?: number;
  /** 연결된 기술 과제 카테고리 (선택) */
  related_demand?: TechnicalDemandCategory;
}

/** 전체 연습 플랜 — 4주 루틴의 상위 구조 */
export interface PracticePlan {
  /** 전체 소요 기간 예상 (예: "4-6주") */
  estimated_duration: string;
  /** 연습 순서 권장 사항 (예: "2악장 → 1악장 제시부 → …") */
  recommended_order?: string;
  /** 단계별 플랜 */
  phases: PracticePhase[];
}

// ════════════════════════════════════════════════════════
// 함정 (Pitfall)
// ════════════════════════════════════════════════════════

/** 흔히 빠지는 함정 — 연습 시 주의사항 */
export interface Pitfall {
  /** 함정 제목 (예: "발전부 템포 폭주") */
  title: string;
  /** 어떤 실수인지 (1-2문장) */
  mistake: string;
  /** 왜 발생하는지 (1-2문장) */
  cause: string;
  /** 해결/예방 방법 (1-2문장) */
  fix: string;
  /** 해당 위치 (선택) */
  location?: string;
}

// ════════════════════════════════════════════════════════
// 추천 음반 (Recommended Recording)
// ════════════════════════════════════════════════════════

/** 추천 음반 — V2의 RecommendedPerformanceV2를 확장 */
export interface RecommendedRecording {
  /** 연주자 이름 */
  artist: string;
  /** 녹음 연도 (확인된 경우만) */
  year?: string;
  /** 레이블 (확인된 경우만) */
  label?: string;
  /** 왜 이 녹음을 추천하는지 (1-2문장) */
  why: string;
  /** YouTube URL (검증된 경우만) */
  youtube_url?: string;
  /** 이 녹음에서 특히 주목할 포인트 (선택) */
  listen_for?: string;
}

// ════════════════════════════════════════════════════════
// 악장별 가이드 (Movement Guide)
// ════════════════════════════════════════════════════════

/** 다악장 작품의 개별 악장 가이드 */
export interface MovementGuide {
  /** 악장 번호 */
  number: number;
  /** 악장 제목/템포 (예: "Allegro assai") */
  title: string;
  /** 조성 */
  key?: string;
  /** 형식 (예: "소나타 형식") */
  form?: string;
  /** 이 악장의 핵심 성격 (1문장) */
  character: string;
  /** 이 악장의 기술 과제 */
  technical_demands: TechnicalDemand[];
  /** 이 악장의 음악적 과제 */
  musical_challenges: MusicalChallenge[];
  /** 이 악장 전용 함정 */
  pitfalls: Pitfall[];
  /** 다음 악장과의 연결 참고 (attacca 등) */
  connection_to_next?: string;
}

// ════════════════════════════════════════════════════════
// 모음곡/소품집 가이드 (Collection Piece Guide)
// ════════════════════════════════════════════════════════

/** 모음곡/소품집의 개별 곡 가이드 */
export interface CollectionPieceGuide {
  /** 곡 번호 */
  number: number;
  /** 곡 제목 (예: "Promenade", "Gnome", "Träumerei") */
  title: string;
  /** 조성 */
  key?: string;
  /** 이 곡의 핵심 성격 (1문장) */
  character: string;
  /** 이 곡의 핵심 기술 과제 (1-3개) */
  technical_focus: string[];
  /** 연습 시 주의점 (1-2문장) */
  practice_note: string;
}

// ════════════════════════════════════════════════════════
// V3 분석 콘텐츠
// ════════════════════════════════════════════════════════

/** V3 분석 본문 — 연습 코칭 중심 */
export interface AnalysisContentV3 {
  /** 작품 유형 */
  work_type: WorkType;
  /** 검증된 사실 목록 (조성, 박자, 작곡 연도 등) */
  verified_facts: VerifiedFact[];
  /** 작품 요약 — 연습 맥락 중심 */
  summary: WorkSummary;
  /** 기술적 과제 목록 */
  technical_demands: TechnicalDemand[];
  /** 음악적/해석적 과제 목록 */
  musical_challenges: MusicalChallenge[];
  /** 연습 플랜 — 단계별 구체적 과제 */
  practice_plan: PracticePlan;
  /** 흔한 함정/실수 */
  pitfalls: Pitfall[];
  /** 추천 음반 */
  recommended_recordings: RecommendedRecording[];
  /** 악장별 가이드 — 다악장 작품 전용 (multi_movement_sonata) */
  movement_guides?: MovementGuide[];
  /** 개별곡 가이드 — 모음곡/소품집 전용 (suite_or_collection) */
  collection_guides?: CollectionPieceGuide[];
}

// ════════════════════════════════════════════════════════
// V3 메타
// ════════════════════════════════════════════════════════

/** V3 분석 메타데이터 */
export interface SongAnalysisMetaV3 {
  /** 작품 식별 */
  work: CanonicalWorkRef;
  /** 난이도 — V3에서는 생성하지 않음. legacy 호환용 optional */
  difficulty_level?: DifficultyLevel;
}

// ════════════════════════════════════════════════════════
// V3 최상위 타입
// ════════════════════════════════════════════════════════

/** V3 곡 분석 — 연습 코칭 중심, schema_version: 3 필수 */
export interface SongAnalysisV3 {
  /** 분석 고유 ID */
  id: string;
  /** 스키마 버전 — V3는 반드시 3 */
  schema_version: 3;
  /** 메타데이터 (작품 식별 + 난이도) */
  meta: SongAnalysisMetaV3;
  /** 분석 본문 */
  content: AnalysisContentV3;
  /** 검증 상태 */
  verification_status: VerificationStatus;
  /** 생성 시각 (ISO 8601) */
  created_at: string;
  /** 수정 시각 (ISO 8601) */
  updated_at: string;
  /** PDF 원본 저장 경로 (Supabase Storage) */
  pdf_storage_path?: string;
  /** MusicXML 소스 저장 경로 (Supabase Storage) */
  musicxml_storage_path?: string;
}

// ════════════════════════════════════════════════════════
// Discriminated Union + Legacy 별칭
// ════════════════════════════════════════════════════════

/** 레거시 분석 타입 (V1/V2) — 기존 SongAnalysis와 동일 */
export type LegacySongAnalysis = SongAnalysis;

/** 모든 버전의 분석을 포괄하는 union — API/UI에서 버전별 분기에 사용 */
export type AnySongAnalysis = LegacySongAnalysis | SongAnalysisV3;

// ════════════════════════════════════════════════════════
// 타입 가드
// ════════════════════════════════════════════════════════

/** V3 분석인지 확인 — schema_version === 3 으로 판별 */
export function isSongAnalysisV3(value: AnySongAnalysis): value is SongAnalysisV3 {
  return "schema_version" in value && value.schema_version === 3;
}

/** 레거시(V1/V2) 분석인지 확인 */
export function isLegacySongAnalysis(value: AnySongAnalysis): value is LegacySongAnalysis {
  return !isSongAnalysisV3(value);
}

/** 다악장 작품인지 확인 — V3 content의 work_type으로 판별 */
export function isMultiMovementWork(analysis: SongAnalysisV3): boolean {
  return analysis.content.work_type === "multi_movement_sonata";
}

/** 모음곡/소품집인지 확인 — V3 content의 work_type으로 판별 */
export function isCollectionWork(analysis: SongAnalysisV3): boolean {
  return analysis.content.work_type === "suite_or_collection";
}

/** 변주곡인지 확인 */
export function isVariationSet(analysis: SongAnalysisV3): boolean {
  return analysis.content.work_type === "variation_set";
}

/** 악장별 가이드가 있는지 확인 */
export function hasMovementGuides(analysis: SongAnalysisV3): boolean {
  return Array.isArray(analysis.content.movement_guides) &&
    analysis.content.movement_guides.length > 0;
}

/** 개별곡 가이드가 있는지 확인 */
export function hasCollectionGuides(analysis: SongAnalysisV3): boolean {
  return Array.isArray(analysis.content.collection_guides) &&
    analysis.content.collection_guides.length > 0;
}

// ════════════════════════════════════════════════════════
// 분석 버전 식별 유틸
// ════════════════════════════════════════════════════════

/** 분석 객체에서 스키마 버전 추론 — legacy 호환 */
export function getAnalysisSchemaVersion(analysis: AnySongAnalysis): 1 | 2 | 3 {
  // V3: schema_version === 3 (required 필드)
  if ("schema_version" in analysis && analysis.schema_version === 3) {
    return 3;
  }

  // V1/V2: optional schema_version 필드
  const legacy = analysis as LegacySongAnalysis;

  // 명시적 schema_version이 있으면 사용
  if (legacy.schema_version === 2) {
    return 2;
  }
  if (legacy.schema_version === 1) {
    return 1;
  }

  // schema_version 없으면 content 필드로 추론
  const content = legacy.content as unknown as Record<string, unknown>;
  if (content && ("song_overview" in content || "composer_life" in content)) {
    return 2;
  }

  return 1;
}

// ════════════════════════════════════════════════════════
// V3 요청/응답 타입 (미래 확장 포인트)
// ════════════════════════════════════════════════════════

/** V3 분석 요청 — 기존 AnalyzeSongRequest 확장 */
export interface AnalyzeSongRequestV3 {
  /** 작곡가 */
  composer: string;
  /** 곡 제목 */
  title: string;
  /** 악기 */
  instrument?: string;
  /** 캐시 무시하고 재분석 */
  forceRefresh?: boolean;
  /** 분석 버전 — 3으로 요청하면 V3 파이프라인 사용 */
  analysisVersion: 3;
  /** 원하는 출력 형식 */
  desiredOutput?: "v3" | "legacy";
}

/** V3 분석 응답 */
export interface AnalyzeSongResponseV3 {
  success: boolean;
  data?: SongAnalysisV3;
  cached?: boolean;
  error?: string;
}

/** 모든 버전을 지원하는 통합 응답 타입 (미래용) */
export interface AnalyzeSongResponseAny {
  success: boolean;
  data?: AnySongAnalysis;
  cached?: boolean;
  error?: string;
}
