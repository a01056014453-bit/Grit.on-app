/**
 * IMSLP MediaWiki API 파이프라인
 *
 * 1. IMSLP 검색 → 곡 페이지 찾기
 * 2. 페이지 wikitext 파싱 → 조성, 악장, 템포, 작곡연도 추출
 * 3. LOCKED FACTS 블록 생성 → Phase 1~4 프롬프트에 주입
 *
 * 실패 시 null 반환 → 기존 Perplexity 방식으로 fallback
 */

// ── 타입 ──

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

interface IMSLPParsedData {
  key: string | null;
  movements: string | null;
  year: string | null;
  dedication: string | null;
  firstPerformance: string | null;
  movementDetails: Array<{
    number: number;
    tempo_marking: string | null;
    key: string | null;
    time_signature: string | null;
  }>;
  pageUrl: string;
}

// ── IMSLP MediaWiki API ──

const IMSLP_API = "https://imslp.org/api.php";
const USER_AGENT = "Sempre/1.0 (classical music education; contact@gritonclassic.com)";

/**
 * IMSLP에서 곡 검색 → 가장 관련도 높은 페이지 제목 반환
 */
async function searchIMSLP(composer: string, title: string): Promise<string | null> {
  const composerParts = composer.trim().split(" ");
  const lastName = composerParts[composerParts.length - 1];
  const query = `${title} ${lastName}`;

  try {
    const url = new URL(IMSLP_API);
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", query);
    url.searchParams.set("srnamespace", "0");
    url.searchParams.set("srlimit", "5");
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const results: Array<{ title: string }> = data?.query?.search ?? [];
    if (results.length === 0) return null;

    // 작곡가 성이 포함된 결과 우선
    const best =
      results.find((r) => r.title.toLowerCase().includes(lastName.toLowerCase())) ??
      results[0];

    return best.title;
  } catch (e) {
    console.error("[IMSLP] 검색 실패:", e);
    return null;
  }
}

/**
 * IMSLP 페이지의 wikitext를 가져와서 팩트 추출
 */
async function parseIMSLPPage(pageTitle: string): Promise<IMSLPParsedData | null> {
  try {
    const url = new URL(IMSLP_API);
    url.searchParams.set("action", "parse");
    url.searchParams.set("page", pageTitle);
    url.searchParams.set("prop", "wikitext");
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const wikitext: string = data?.parse?.wikitext?.["*"] ?? "";

    if (!wikitext) return null;

    // wikitext에서 팩트 추출
    const key = extractField(wikitext, "Key");
    const movements = extractField(wikitext, "Movements/Sections") ??
      extractField(wikitext, "Movements/SectionsHeader");
    const year = extractField(wikitext, "Year/Date of Composition") ??
      extractField(wikitext, "Year of Composition");
    const dedication = extractField(wikitext, "Dedication");
    const firstPerformance = extractField(wikitext, "First Performance");

    // 악장 상세 파싱
    const movementDetails = parseMovements(wikitext, movements);

    const pageUrl = `https://imslp.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`;

    return {
      key,
      movements,
      year,
      dedication,
      firstPerformance,
      movementDetails,
      pageUrl,
    };
  } catch (e) {
    console.error("[IMSLP] 페이지 파싱 실패:", e);
    return null;
  }
}

/**
 * wikitext에서 |Key=value 형태의 필드 추출
 */
function extractField(wikitext: string, fieldName: string): string | null {
  // |Key=E-flat major 또는 |Key = E-flat major
  const regex = new RegExp(`\\|\\s*${fieldName.replace(/[/()]/g, "\\$&")}\\s*=\\s*([^|\\n}]+)`, "i");
  const match = wikitext.match(regex);
  if (!match) return null;
  const value = match[1].trim();
  // 빈 값이나 위키 마크업만 있는 경우 무시
  if (!value || value === "-" || value.startsWith("{{") && !value.includes("=")) return null;
  // 위키 링크 제거: [[E-flat major]] → E-flat major
  return value.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
}

/**
 * wikitext에서 악장 상세 정보 파싱
 */
function parseMovements(
  wikitext: string,
  movementsField: string | null
): Array<{ number: number; tempo_marking: string | null; key: string | null; time_signature: string | null }> {
  const details: Array<{ number: number; tempo_marking: string | null; key: string | null; time_signature: string | null }> = [];

  // "4 movements" 같은 텍스트에서 악장 수 추출
  let numMovements = 0;
  if (movementsField) {
    const numMatch = movementsField.match(/(\d+)\s*movement/i);
    if (numMatch) numMovements = parseInt(numMatch[1], 10);
  }

  // wikitext에서 악장별 템포 마킹 추출
  // 패턴: #*'''Allegro molto e con brio''' 또는 # Allegro molto e con brio
  const tempoPattern = /(?:^|\n)\s*#\s*\*?\s*'{0,3}([A-Z][a-zà-ü]+(?:\s+[a-zà-üA-Z.,]+)*)\s*'{0,3}/g;
  let match;
  let movNum = 1;

  while ((match = tempoPattern.exec(wikitext)) !== null) {
    const tempo = match[1].trim();
    // 일반적인 템포 지시어인지 확인
    if (isTempoMarking(tempo)) {
      details.push({
        number: movNum,
        tempo_marking: tempo,
        key: null,
        time_signature: null,
      });
      movNum++;
    }
  }

  // 템포 마킹을 못 찾았으면 movements 필드에서 파싱 시도
  if (details.length === 0 && movementsField) {
    // "4 movements: I. Allegro molto e con brio, II. Largo, ..."
    const parts = movementsField.split(/[,;]/);
    for (const part of parts) {
      const cleaned = part.replace(/^[\s\dIVXivx.()]+/, "").trim();
      if (cleaned && isTempoMarking(cleaned)) {
        details.push({
          number: details.length + 1,
          tempo_marking: cleaned,
          key: null,
          time_signature: null,
        });
      }
    }
  }

  // 최소한 악장 수만큼 빈 항목 생성
  while (details.length < numMovements) {
    details.push({
      number: details.length + 1,
      tempo_marking: null,
      key: null,
      time_signature: null,
    });
  }

  return details;
}

/**
 * 문자열이 템포 마킹인지 확인
 */
function isTempoMarking(text: string): boolean {
  const tempoWords = [
    "allegr", "adagi", "andant", "largo", "lento", "prest", "vivac",
    "moderato", "grave", "scherzo", "menuett", "rondo", "finale",
    "molto", "assai", "poco", "con", "quasi", "tempo", "agitato",
    "appassionato", "cantabile", "espressivo", "grazioso", "maestoso",
    "tranquillo", "funeral", "marcia", "introduction",
  ];
  const lower = text.toLowerCase();
  return tempoWords.some((w) => lower.includes(w)) && text.length < 80;
}

// ── LOCKED FACTS 블록 생성 ──

export function buildLockedFactsBlock(facts: ScoreFactsFromVision): string {
  const { locked, unknown_fields } = facts;
  const movementLines = locked.movements
    .map(
      (m) =>
        `  ${m.number}악장: 템포=${m.tempo_marking ?? "UNKNOWN"} | 조성=${m.key ?? "UNKNOWN"} | 박자=${m.time_signature ?? "UNKNOWN"}`
    )
    .join("\n");

  return `
[🔒 LOCKED FACTS — IMSLP에서 확인된 값. 절대 변경 불가]
전체 조성: ${locked.overall_key ?? "UNKNOWN"}
${movementLines}
출처: ${facts.source_url ?? "IMSLP"}
신뢰도: ${facts.confidence}

[❌ UNKNOWN FIELDS — 확인 불가. 생성하거나 추측 금지]
${unknown_fields.length > 0 ? unknown_fields.map((f) => `  - ${f}`).join("\n") : "  없음"}
  `.trim();
}

// ── 메인 함수 ──

export async function getScoreFactsFromIMSLP(
  composer: string,
  title: string,
  _openaiApiKey: string // 하위 호환 (Vision 미사용)
): Promise<{
  facts: ScoreFactsFromVision | null;
  lockedFactsBlock: string;
  imslpUrl: string | null;
}> {
  console.log(`[IMSLP API] 시작: ${composer} - ${title}`);

  // 1. IMSLP 검색
  const pageTitle = await searchIMSLP(composer, title);
  if (!pageTitle) {
    console.log("[IMSLP API] 검색 결과 없음 → Perplexity fallback");
    return {
      facts: null,
      lockedFactsBlock: "[IMSLP 검색 실패 — Perplexity 기반으로 분석]",
      imslpUrl: null,
    };
  }

  console.log(`[IMSLP API] 페이지 발견: ${pageTitle}`);

  // 2. 페이지 파싱
  const parsed = await parseIMSLPPage(pageTitle);
  if (!parsed) {
    console.log("[IMSLP API] 페이지 파싱 실패 → Perplexity fallback");
    return {
      facts: null,
      lockedFactsBlock: "[IMSLP 파싱 실패 — Perplexity 기반으로 분석]",
      imslpUrl: `https://imslp.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`,
    };
  }

  // 3. ScoreFactsFromVision 구조로 변환
  const unknown: string[] = [];
  if (!parsed.key) unknown.push("overall_key");
  parsed.movementDetails.forEach((m, i) => {
    if (!m.tempo_marking) unknown.push(`movements[${i}].tempo_marking`);
    if (!m.key) unknown.push(`movements[${i}].key`);
    if (!m.time_signature) unknown.push(`movements[${i}].time_signature`);
  });

  const confidence: "high" | "medium" | "low" =
    parsed.key && parsed.movementDetails.length > 0 ? "high" :
    parsed.key || parsed.movementDetails.length > 0 ? "medium" : "low";

  const facts: ScoreFactsFromVision = {
    locked: {
      overall_key: parsed.key,
      movements: parsed.movementDetails,
      time_signatures: parsed.movementDetails.map((m) => m.time_signature ?? "unknown"),
      tempo_markings: parsed.movementDetails.map((m) => m.tempo_marking ?? "unknown"),
      clef_info: null,
    },
    unknown_fields: unknown,
    page_images: [],
    confidence,
    source_url: parsed.pageUrl,
  };

  const lockedFactsBlock = buildLockedFactsBlock(facts);

  console.log(`[IMSLP API] 완료: 조성=${parsed.key}, 악장=${parsed.movementDetails.length}개, 신뢰도=${confidence}`);
  if (parsed.year) console.log(`[IMSLP API] 작곡연도: ${parsed.year}`);
  if (parsed.dedication) console.log(`[IMSLP API] 헌정: ${parsed.dedication}`);

  return {
    facts,
    lockedFactsBlock,
    imslpUrl: parsed.pageUrl,
  };
}
