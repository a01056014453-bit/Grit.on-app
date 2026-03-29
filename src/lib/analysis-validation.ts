/**
 * 분석 결과 검증 — 저장 전 품질 체크
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** 분석 결과 품질 검증 */
export function validateAnalysisOutput(analysis: {
  content: any;
}): ValidationResult {
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
  const totalDays = routine.reduce((sum: number, week: any) =>
    sum + (Array.isArray(week.days) ? week.days.length : 0), 0);
  if (routine.length > 0 && totalDays < 28) {
    warnings.push(`루틴 ${totalDays}일 — 28일 권장`);
  }

  // 4. 필수 필드 존재 확인
  if (!content?.composer_life && !content?.composer_background) {
    warnings.push("작곡가 배경 정보 없음");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
