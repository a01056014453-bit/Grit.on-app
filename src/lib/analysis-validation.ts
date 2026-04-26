/**
 * 분석 결과 검증 — 저장 전 품질 체크
 *
 * validateAnalysisOutput()  — V1/V2 레거시
 * validateAnalysisOutputV3() — V3 연습 코칭 중심
 */

import type { AnalysisContentV3, WorkType } from "@/types/song-analysis";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ════════════════════════════════════════════════════════
// V1/V2 검증 (기존 — 변경 없음)
// ════════════════════════════════════════════════════════

/** 분석 결과 품질 검증 (V1/V2) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateAnalysisOutput(analysis: { content: any }): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const content = analysis.content;

  // 1. 섹션 최소 3개
  const sections = content?.structure_analysis_v2?.sections
    ?? content?.structure_analysis
    ?? [];
  if (sections.length < 3) {
    errors.push(`섹션 ${sections.length}개 — 최소 3개 필요`);
  }

  // 2. 추천 연주자 최소 3명 (5명 권장)
  const performances = content?.recommended_performances_v2
    ?? content?.recommended_performances
    ?? [];
  if (performances.length < 3) {
    errors.push(`추천 연주자 ${performances.length}명 — 최소 3명 필요`);
  }
  if (performances.length < 5) {
    warnings.push(`추천 연주자 ${performances.length}명 — 5명 권장`);
  }

  // 3. 4주 루틴 28일 확인
  const routine = content?.practice_method?.weekly_routine ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalDays = routine.reduce((sum: number, week: any) =>
    sum + (Array.isArray(week.days) ? week.days.length : 0), 0);
  if (routine.length > 0 && totalDays < 28) {
    warnings.push(`루틴 ${totalDays}일 — 28일 권장`);
  }

  // 4. 필수 필드 존재 확인
  if (!content?.composer_life && !content?.composer_background) {
    warnings.push("작곡가 배경 정보 없음");
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ════════════════════════════════════════════════════════
// V3 검증
// ════════════════════════════════════════════════════════

/** 제네릭/반복 감지용 블랙리스트 */
const GENERIC_BLACKLIST = [
  "베토벤은 고전과 낭만을 잇는 다리",
  "팔 무게를 사용",
  "팔 무게를 실어",
  "프레이즈를 살려",
  "감정을 표현",
  "천천히 연습",
  "메트로놈과 함께",
  "메트로놈을 사용",
  "느리게 연습",
  "손가락을 독립",
];

/** 너무 짧은 단독 제네릭 제목 */
const GENERIC_TITLES = [
  "테크닉", "표현", "리듬", "다이내믹", "음색",
  "아티큘레이션", "템포", "기교", "해석",
];

/** 문자열 정규화 */
function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/** 중복 비율 계산 — 동일 문자열이 전체의 몇 %인지 */
function duplicateRatio(items: string[]): number {
  if (items.length <= 1) return 0;
  const normed = items.map(norm);
  const unique = new Set(normed);
  return 1 - unique.size / normed.length;
}

/** 블랙리스트 문구 포함 여부 */
function containsGeneric(text: string): boolean {
  const lower = norm(text);
  return GENERIC_BLACKLIST.some((b) => lower.includes(norm(b)));
}

/** V3 분석 결과 품질 검증 */
export function validateAnalysisOutputV3(analysis: {
  content: AnalysisContentV3;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const c = analysis.content;

  // ── A. 필수 필드 존재 ──

  if (!c.work_type) {
    errors.push("work_type 누락");
  }

  if (!Array.isArray(c.verified_facts) || c.verified_facts.length < 2) {
    errors.push(`verified_facts ${c.verified_facts?.length ?? 0}개 — 최소 2개 필요`);
  }

  if (!c.summary) {
    errors.push("summary 누락");
  }

  if (!Array.isArray(c.technical_demands) || c.technical_demands.length < 2) {
    errors.push(`technical_demands ${c.technical_demands?.length ?? 0}개 — 최소 2개 필요`);
  }
  if (Array.isArray(c.technical_demands) && c.technical_demands.length < 4) {
    warnings.push(`technical_demands ${c.technical_demands.length}개 — 4개 권장`);
  }

  if (!Array.isArray(c.musical_challenges) || c.musical_challenges.length < 2) {
    errors.push(`musical_challenges ${c.musical_challenges?.length ?? 0}개 — 최소 2개 필요`);
  }

  if (!c.practice_plan || !Array.isArray(c.practice_plan.phases) || c.practice_plan.phases.length < 3) {
    errors.push(`practice_plan.phases ${c.practice_plan?.phases?.length ?? 0}개 — 최소 3개 필요`);
  }

  if (!Array.isArray(c.pitfalls) || c.pitfalls.length < 2) {
    errors.push(`pitfalls ${c.pitfalls?.length ?? 0}개 — 최소 2개 필요`);
  }

  if (!Array.isArray(c.recommended_recordings) || c.recommended_recordings.length < 3) {
    errors.push(`recommended_recordings ${c.recommended_recordings?.length ?? 0}개 — 최소 3개 필요`);
  }

  // 필수 필드 없으면 여기서 즉시 반환 (하위 검증 불가)
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // ── B. summary 품질 ──

  const s = c.summary;
  if (!s.one_liner || s.one_liner.length < 12) {
    errors.push(`summary.one_liner 너무 짧음 (${s.one_liner?.length ?? 0}자 — 최소 12자)`);
  }
  if (!s.context_for_practice || s.context_for_practice.length < 40) {
    errors.push(`summary.context_for_practice 너무 짧음 (${s.context_for_practice?.length ?? 0}자 — 최소 40자)`);
  }
  if (!s.structural_overview || s.structural_overview.length < 40) {
    errors.push(`summary.structural_overview 너무 짧음 (${s.structural_overview?.length ?? 0}자 — 최소 40자)`);
  }
  if (!s.artistic_intent || s.artistic_intent.length < 20) {
    errors.push(`summary.artistic_intent 너무 짧음 (${s.artistic_intent?.length ?? 0}자 — 최소 20자)`);
  }

  // ── C. technical_demands 품질 ──

  const demandTitles: string[] = [];
  const demandDescriptions: string[] = [];
  for (const d of c.technical_demands) {
    if (!d.title) {
      errors.push(`technical_demand 필수 필드 누락: "${d.title ?? "(제목 없음)"}"`);
    }
    if (!d.description || d.description.length < 8) {
      errors.push(`technical_demand description 너무 짧음: "${d.title ?? ""}" (${d.description?.length ?? 0}자)`);
    }
    if (d.title && GENERIC_TITLES.includes(norm(d.title))) {
      warnings.push(`technical_demand 제네릭 제목: "${d.title}"`);
    }
    if (d.title) demandTitles.push(d.title);
    if (d.description) demandDescriptions.push(d.description);
  }

  if (duplicateRatio(demandTitles) > 0.3) {
    errors.push(`technical_demands 제목 중복률 ${Math.round(duplicateRatio(demandTitles) * 100)}% — 30% 이하 권장`);
  }

  // ── D. practice_plan 품질 ──

  const allInstructions: string[] = [];
  for (const phase of c.practice_plan.phases) {
    if (!Array.isArray(phase.tasks) || phase.tasks.length < 1) {
      errors.push(`practice_plan phase "${phase.title ?? phase.phase}" tasks ${phase.tasks?.length ?? 0}개 — 최소 1개 필요`);
    }
    for (const task of phase.tasks ?? []) {
      if (!task.instruction || task.instruction.length < 12) {
        errors.push(`task instruction 너무 짧음: "${task.instruction ?? ""}" (최소 12자)`);
      }
      if (task.instruction) {
        allInstructions.push(task.instruction);
        if (containsGeneric(task.instruction)) {
          warnings.push(`task 제네릭 조언 감지: "${task.instruction.slice(0, 40)}..."`);
        }
      }
    }
  }

  if (duplicateRatio(allInstructions) > 0.2) {
    errors.push(`practice_plan 과제 중복률 ${Math.round(duplicateRatio(allInstructions) * 100)}% — 동일 과제 반복`);
  }

  // ── E. pitfalls 품질 ──

  for (const p of c.pitfalls) {
    if (!p.title || !p.mistake) {
      errors.push(`pitfall 필수 필드 누락: "${p.title ?? "(제목 없음)"}"`);
    }
    if (p.fix && p.fix.length < 10) {
      warnings.push(`pitfall fix 너무 짧음: "${p.title ?? ""}" (${p.fix.length}자)`);
    }
  }

  const pitfallTitles = c.pitfalls.map((p) => p.title).filter(Boolean);
  if (duplicateRatio(pitfallTitles) > 0.3) {
    warnings.push(`pitfalls 제목 중복률 ${Math.round(duplicateRatio(pitfallTitles) * 100)}%`);
  }

  // ── F. 작품 유형별 조건 ──

  const wt: WorkType = c.work_type;
  if (wt === "multi_movement_sonata") {
    if (!Array.isArray(c.movement_guides) || c.movement_guides.length < 2) {
      errors.push(`multi_movement_sonata인데 movement_guides ${c.movement_guides?.length ?? 0}개 — 최소 2개 필요`);
    }
  }
  if (wt === "suite_or_collection") {
    if (!Array.isArray(c.collection_guides) || c.collection_guides.length < 3) {
      errors.push(`suite_or_collection인데 collection_guides ${c.collection_guides?.length ?? 0}개 — 최소 3개 필요`);
    }
  }
  if (wt === "variation_set") {
    const hasGuides = (Array.isArray(c.movement_guides) && c.movement_guides.length > 0) ||
      (Array.isArray(c.collection_guides) && c.collection_guides.length > 0);
    if (!hasGuides) {
      errors.push("variation_set인데 movement_guides/collection_guides 모두 없음");
    }
  }

  // ── G. 제네릭/블랙리스트 감지 ──

  const allTexts = [
    s.context_for_practice,
    s.structural_overview,
    s.artistic_intent,
    ...demandDescriptions,
    ...allInstructions,
  ].filter(Boolean);

  let genericCount = 0;
  for (const text of allTexts) {
    if (containsGeneric(text)) genericCount++;
  }
  if (genericCount > 3) {
    warnings.push(`제네릭/블랙리스트 문구 ${genericCount}건 감지`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
