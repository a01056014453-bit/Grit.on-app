/**
 * IMSLP Vision Pipeline — stub
 * Vercel 환경에서 poppler-utils 사용 가능 확인 후 전체 구현 활성화 예정
 */

export interface ScoreFactsFromVision {
  locked: {
    overall_key: string | null;
    movements: Array<{
      number: number;
      tempo_marking: string | null;
      key: string | null;
      time_signature: string | null;
    }>;
    time_signatures: string[];
    tempo_markings: string[];
    clef_info: string | null;
  };
  unknown_fields: string[];
  page_images: string[];
  confidence: "high" | "medium" | "low";
  source_url: string | null;
}

export function buildLockedFactsBlock(facts: ScoreFactsFromVision): string {
  const { locked, unknown_fields } = facts;
  const movementLines = locked.movements
    .map(
      (m) =>
        `  ${m.number}악장: 템포=${m.tempo_marking ?? "UNKNOWN"} | 조성=${m.key ?? "UNKNOWN"} | 박자=${m.time_signature ?? "UNKNOWN"}`
    )
    .join("\n");

  return `
[🔒 LOCKED FACTS — 악보에서 직접 읽은 값]
전체 조성: ${locked.overall_key ?? "UNKNOWN"}
${movementLines}
Vision 신뢰도: ${facts.confidence}

[❌ UNKNOWN FIELDS]
${unknown_fields.length > 0 ? unknown_fields.map((f) => `  - ${f}`).join("\n") : "  없음"}
  `.trim();
}

/**
 * IMSLP → PDF → Vision 파이프라인
 * 현재 stub — poppler-utils 설정 후 활성화
 */
export async function getScoreFactsFromIMSLP(
  composer: string,
  title: string,
  openaiApiKey: string
): Promise<{
  facts: ScoreFactsFromVision | null;
  lockedFactsBlock: string;
  imslpUrl: string | null;
}> {
  console.log(`[IMSLP Vision] stub — 아직 비활성. ${composer} - ${title}`);
  return {
    facts: null,
    lockedFactsBlock: "[악보 없음 — Perplexity + 학술 자료 기반으로만 분석]",
    imslpUrl: null,
  };
}
