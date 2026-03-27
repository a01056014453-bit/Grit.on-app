/**
 * Phase 0-A: 학술 논문 검색 + PDF 추출 파이프라인
 * Semantic Scholar + CORE + Unpaywall 조합
 *
 * 입시 레퍼토리 대상: 하이든/모차르트/베토벤/리스트/쇼팽/라흐마니노프/
 *                     스크리아빈/모슈코프스키/브람스/슈베르트/생상스/슈만 등
 */

// ─────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────

export interface AcademicPaper {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  pdf_url: string | null;        // 접근 가능한 무료 PDF URL
  source: "semantic_scholar" | "core" | "unpaywall";
  relevance_score: number;       // 0-1, 관련도 자체 평가
  extracted_sections: ExtractedSection[] | null; // PDF 파싱 결과
}

export interface ExtractedSection {
  type:
    | "harmonic_analysis"    // 화성 분석
    | "formal_analysis"      // 형식 분석
    | "performance_practice" // 연주 기법
    | "historical_context"   // 역사적 배경
    | "biography"            // 작곡가 생애
    | "other";
  content: string;           // 추출된 텍스트 (최대 2000자)
  confidence: "high" | "medium" | "low";
}

export interface AcademicSearchResult {
  papers: AcademicPaper[];
  has_academic_source: boolean;  // 논문이 1개 이상 확보됐는지
  primary_paper: AcademicPaper | null; // 가장 관련도 높은 논문
  academic_prompt_injection: string;   // 프롬프트에 주입할 포맷된 텍스트
}

// ─────────────────────────────────────────
// 검색 쿼리 생성
// ─────────────────────────────────────────

function buildSearchQueries(composer: string, title: string): string[] {
  // 작품번호 제거한 순수 제목 (Op.35 같은 것 제거)
  const cleanTitle = title.replace(/Op\.\s*\d+.*$/i, "").replace(/No\.\s*\d+/i, "").trim();

  return [
    // 가장 구체적인 쿼리부터
    `"${composer}" "${cleanTitle}" analysis`,
    `"${composer}" "${cleanTitle}" harmonic`,
    `"${composer}" "${cleanTitle}" performance`,
    `"${composer}" piano technique style`,
    `"${composer}" harmonic language`,
  ];
}

// ─────────────────────────────────────────
// 1. Semantic Scholar API
// ─────────────────────────────────────────

async function searchSemanticScholar(
  composer: string,
  title: string
): Promise<AcademicPaper[]> {
  const queries = buildSearchQueries(composer, title);
  const results: AcademicPaper[] = [];
  const seen = new Set<string>();

  for (const query of queries.slice(0, 3)) { // 상위 3개 쿼리만
    try {
      const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
      url.searchParams.set("query", query);
      url.searchParams.set("limit", "5");
      url.searchParams.set("fields", "title,authors,year,abstract,openAccessPdf,externalIds");

      const res = await fetch(url.toString(), {
        headers: { "Accept": "application/json" },
      });

      if (!res.ok) continue;
      const data = await res.json();

      for (const paper of data.data ?? []) {
        if (seen.has(paper.paperId)) continue;
        seen.add(paper.paperId);

        // 관련도 평가: 제목에 작곡가명 또는 곡 제목 포함 여부
        const composerLast = composer.split(" ").pop()?.toLowerCase() ?? "";
        const titleLower = (paper.title ?? "").toLowerCase();
        const abstractLower = (paper.abstract ?? "").toLowerCase();
        const cleanTitleLower = title.toLowerCase();

        let relevance = 0;
        if (titleLower.includes(composerLast)) relevance += 0.4;
        if (titleLower.includes(cleanTitleLower.split(" ")[0])) relevance += 0.3;
        if (abstractLower.includes("harmonic") || abstractLower.includes("analysis")) relevance += 0.2;
        if (abstractLower.includes("performance") || abstractLower.includes("technique")) relevance += 0.1;

        if (relevance < 0.3) continue; // 관련도 낮으면 스킵

        results.push({
          title: paper.title ?? "",
          authors: (paper.authors ?? []).map((a: { name: string }) => a.name),
          year: paper.year ?? 0,
          abstract: paper.abstract ?? "",
          pdf_url: paper.openAccessPdf?.url ?? null,
          source: "semantic_scholar",
          relevance_score: relevance,
          extracted_sections: null,
        });
      }
    } catch (e) {
      console.error("[SemanticScholar] 검색 실패:", e);
    }
  }

  return results.sort((a, b) => b.relevance_score - a.relevance_score).slice(0, 5);
}

// ─────────────────────────────────────────
// 2. CORE API (오픈액세스 전문 무료)
// ─────────────────────────────────────────

async function searchCORE(
  composer: string,
  title: string,
  apiKey: string
): Promise<AcademicPaper[]> {
  const query = `${composer} ${title} piano analysis`;

  try {
    const res = await fetch("https://api.core.ac.uk/v3/search/works", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        limit: 5,
        fields: ["title", "authors", "yearPublished", "abstract", "downloadUrl"],
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const composerLast = composer.split(" ").pop()?.toLowerCase() ?? "";

    return (data.results ?? [])
      .filter((p: { title?: string }) => {
        const t = (p.title ?? "").toLowerCase();
        return t.includes(composerLast);
      })
      .map((p: {
        title?: string;
        authors?: Array<{ name: string }>;
        yearPublished?: number;
        abstract?: string;
        downloadUrl?: string;
      }) => ({
        title: p.title ?? "",
        authors: (p.authors ?? []).map((a) => a.name),
        year: p.yearPublished ?? 0,
        abstract: p.abstract ?? "",
        pdf_url: p.downloadUrl ?? null,
        source: "core" as const,
        relevance_score: 0.5,
        extracted_sections: null,
      }));
  } catch (e) {
    console.error("[CORE] 검색 실패:", e);
    return [];
  }
}

// ─────────────────────────────────────────
// 3. PDF 추출 + 섹션 분류
// ─────────────────────────────────────────

/**
 * PDF URL에서 텍스트를 추출하고 분석에 유용한 섹션을 분류
 * Next.js API route에서 호출 (서버사이드 전용)
 */
async function extractPdfSections(
  pdfUrl: string
): Promise<ExtractedSection[] | null> {
  try {
    // PDF fetch
    const res = await fetch(pdfUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (academic research bot)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();

    // pdf-parse로 텍스트 추출 (서버사이드)
    // npm install pdf-parse 필요
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(Buffer.from(buffer));
    const fullText = parsed.text;

    if (!fullText || fullText.length < 500) return null;

    // 섹션 분류 키워드 매핑
    const sectionKeywords: Record<ExtractedSection["type"], string[]> = {
      harmonic_analysis: [
        "harmonic", "chord", "modulation", "key", "tonic", "dominant",
        "화성", "조성", "전조", "코드",
      ],
      formal_analysis: [
        "form", "structure", "section", "theme", "exposition", "development",
        "형식", "구조", "주제", "소나타",
      ],
      performance_practice: [
        "performance", "technique", "fingering", "pedal", "touch", "practice",
        "연주", "기법", "페달", "터치", "연습",
      ],
      historical_context: [
        "historical", "context", "period", "style", "influence", "era",
        "시대", "역사", "배경", "시기",
      ],
      biography: [
        "born", "composed", "life", "career", "biography",
        "생애", "태어", "작곡", "경력",
      ],
      other: [],
    };

    // 단락 단위로 분리 후 분류
    const paragraphs = fullText
      .split(/\n{2,}/)
      .map((p: string) => p.replace(/\s+/g, " ").trim())
      .filter((p: string) => p.length > 100); // 너무 짧은 단락 제거

    const sections: ExtractedSection[] = [];

    for (const para of paragraphs.slice(0, 100)) { // 최대 100단락
      const paraLower = para.toLowerCase();
      let bestType: ExtractedSection["type"] = "other";
      let maxHits = 0;

      for (const [type, keywords] of Object.entries(sectionKeywords)) {
        if (type === "other") continue;
        const hits = (keywords as string[]).filter((k: string) => paraLower.includes(k)).length;
        if (hits > maxHits) {
          maxHits = hits;
          bestType = type as ExtractedSection["type"];
        }
      }

      if (bestType === "other") continue; // other는 수집 안 함

      const confidence: ExtractedSection["confidence"] =
        maxHits >= 3 ? "high" : maxHits >= 2 ? "medium" : "low";

      // 같은 타입 내 중복 내용 방지
      const existing = sections.find((s) => s.type === bestType);
      if (existing && existing.confidence === "high") continue;

      sections.push({
        type: bestType,
        content: para.slice(0, 2000), // 최대 2000자
        confidence,
      });

      // 타입별 최대 2개까지
      if (sections.filter((s) => s.type === bestType).length >= 2) continue;
    }

    return sections.length > 0 ? sections : null;
  } catch (e) {
    console.error("[PDF Extract] 실패:", e);
    return null;
  }
}

// ─────────────────────────────────────────
// 4. 프롬프트 주입 텍스트 생성
// ─────────────────────────────────────────

function buildAcademicPromptInjection(papers: AcademicPaper[]): string {
  const withSections = papers.filter(
    (p) => p.extracted_sections && p.extracted_sections.length > 0
  );

  if (withSections.length === 0) {
    // 논문은 있지만 PDF 추출 실패한 경우 → abstract만 활용
    const withAbstract = papers.filter((p) => p.abstract.length > 100);
    if (withAbstract.length === 0) return "";

    return `
[📚 학술 출처 — Abstract 요약]
${withAbstract
  .slice(0, 3)
  .map(
    (p) => `
논문: "${p.title}" (${p.authors.join(", ")}, ${p.year})
요약: ${p.abstract.slice(0, 500)}
`
  )
  .join("\n")}

🚨 위 학술 자료의 분석 관점을 반영하되, abstract 수준의 정보이므로
   구체적 마디/코드를 이 자료에서 직접 인용하지 말 것.
`;
  }

  // PDF 추출 성공한 경우 → 섹션별로 정리
  const sectionTypeLabels: Record<ExtractedSection["type"], string> = {
    harmonic_analysis: "화성 분석",
    formal_analysis: "형식 분석",
    performance_practice: "연주 기법",
    historical_context: "역사적 배경",
    biography: "작곡가 생애",
    other: "기타",
  };

  const allSections = withSections.flatMap((p) =>
    (p.extracted_sections ?? []).map((s) => ({
      ...s,
      paper: `"${p.title}" (${p.authors[0] ?? ""}, ${p.year})`,
    }))
  );

  // 타입별로 그룹화
  const grouped = allSections.reduce(
    (acc, s) => {
      if (!acc[s.type]) acc[s.type] = [];
      acc[s.type].push(s);
      return acc;
    },
    {} as Record<string, typeof allSections>
  );

  const priorityOrder: ExtractedSection["type"][] = [
    "harmonic_analysis",
    "formal_analysis",
    "performance_practice",
    "historical_context",
    "biography",
  ];

  const injectionParts: string[] = [
    "[📚 학술 논문 분석 — 1차 출처로 사용. 이 내용이 있으면 반드시 반영]",
  ];

  for (const type of priorityOrder) {
    const items = grouped[type];
    if (!items || items.length === 0) continue;

    // confidence high인 것 우선
    const sorted = items.sort((a, b) =>
      a.confidence === "high" ? -1 : b.confidence === "high" ? 1 : 0
    );

    injectionParts.push(`
▶ ${sectionTypeLabels[type]}
출처: ${sorted[0].paper}
내용: ${sorted[0].content}
${sorted[1] ? `(보조) ${sorted[1].content.slice(0, 500)}` : ""}
`);
  }

  injectionParts.push(`
🚨 위 학술 자료의 내용과 상충하는 분석 생성 금지.
🚨 학술 자료에 없는 구체적 마디 번호·코드명은 MusicXML 기반으로만 생성.
🚨 학술 자료에 있는 내용은 반드시 해당 섹션에 반영.
`);

  return injectionParts.join("\n");
}

// ─────────────────────────────────────────
// 5. 메인 함수 (Phase 0-A)
// ─────────────────────────────────────────

export async function searchAcademicSources(
  composer: string,
  title: string,
  coreApiKey: string = process.env.CORE_API_KEY ?? ""
): Promise<AcademicSearchResult> {
  console.log(`[Academic] 논문 검색 시작: ${composer} - ${title}`);

  // 병렬 검색
  const [ssResults, coreResults] = await Promise.allSettled([
    searchSemanticScholar(composer, title),
    coreApiKey ? searchCORE(composer, title, coreApiKey) : Promise.resolve([]),
  ]);

  const allPapers: AcademicPaper[] = [
    ...(ssResults.status === "fulfilled" ? ssResults.value : []),
    ...(coreResults.status === "fulfilled" ? coreResults.value : []),
  ].sort((a, b) => b.relevance_score - a.relevance_score);

  // 상위 5개만 PDF 추출 시도 (병렬, 타임아웃 15초)
  const topPapers = allPapers.slice(0, 5);

  await Promise.allSettled(
    topPapers
      .filter((p) => p.pdf_url)
      .map(async (paper) => {
        paper.extracted_sections = await extractPdfSections(paper.pdf_url!);
        console.log(
          `[Academic] PDF 추출 ${paper.extracted_sections ? "성공" : "실패"}: ${paper.title.slice(0, 50)}`
        );
      })
  );

  const primaryPaper =
    topPapers.find((p) => p.extracted_sections && p.extracted_sections.length > 0) ??
    topPapers[0] ??
    null;

  const academicPromptInjection = buildAcademicPromptInjection(topPapers);

  console.log(
    `[Academic] 완료: ${topPapers.length}개 논문, PDF 추출 ${topPapers.filter((p) => p.extracted_sections).length}개`
  );

  return {
    papers: topPapers,
    has_academic_source: topPapers.length > 0,
    primary_paper: primaryPaper,
    academic_prompt_injection: academicPromptInjection,
  };
}

// ─────────────────────────────────────────
// 6. analyze-song-v2 라우트에 통합하는 방법
// ─────────────────────────────────────────

/**
 * 기존 Phase 0 (Perplexity) + 새 Phase 0-A (학술) 통합 예시
 *
 * // Phase 0-A: 학술 논문 (Perplexity와 병렬 실행)
 * const [perplexityRef, academicRef] = await Promise.all([
 *   searchMusicReference(composer, title, instrument),  // 기존
 *   searchAcademicSources(composer, title),             // 신규
 * ]);
 *
 * // Phase 1~4에 주입할 레퍼런스 합성
 * const enrichedReference = `
 * ${perplexityRef}
 *
 * ${academicRef.academic_prompt_injection}
 * `;
 *
 * // LOCKED FACTS 블록 (Phase 1 프롬프트 최상단)
 * const lockedFacts = buildLockedFacts(perplexityRef); // 기존 함수
 *
 * // Phase별 우선순위:
 * // 1순위: MusicXML (있을 때)
 * // 2순위: 학술 논문 PDF 추출 내용
 * // 3순위: Perplexity 팩트
 * // 4순위: GPT-4o 추론 (ALLOWED INFERENCE 구역만)
 */

// ─────────────────────────────────────────
// 7. Phase 1~4 프롬프트 주입 구조 (신규)
// ─────────────────────────────────────────

export function buildPhasePromptHeader(
  lockedFacts: Record<string, string | null>,
  academicInjection: string,
  perplexityRef: string
): string {
  // null 필드 목록 → GPT-4o에게 생성 금지 명시
  const unknownFields = Object.entries(lockedFacts)
    .filter(([, v]) => v === null)
    .map(([k]) => k);

  const knownFields = Object.entries(lockedFacts)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k}: "${v}"`)
    .join("\n");

  return `
[🔒 LOCKED FACTS — 절대 변경 불가. 다른 값 생성 시 분석 전체 무효]
${knownFields}

[❌ UNKNOWN — 아래 필드는 확인 불가. 생성하거나 추측 금지]
${unknownFields.length > 0 ? unknownFields.join(", ") : "없음"}
→ 해당 필드는 빈 문자열 또는 빈 배열로 출력

[✅ ALLOWED INFERENCE — 위 LOCKED FACTS와 모순되지 않는 범위에서만 추론 허용]
genre, musical_features, mood, character, description 류 서술형 필드

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${academicInjection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[🔍 Perplexity 팩트 (3차 참고)]
${perplexityRef}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
