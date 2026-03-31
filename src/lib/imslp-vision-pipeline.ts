/**
 * IMSLP MediaWiki API 크롤링 파이프라인
 *
 * 1. IMSLP 검색 → 곡 페이지 찾기 (여러 검색 전략)
 * 2. 페이지 wikitext 파싱 → 조성, 악장, 템포, 작곡연도 추출
 * 3. LOCKED FACTS 블록 생성 → Phase 1~4 프롬프트에 주입
 *
 * 실패 시 null 반환 → Perplexity fallback
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
  movementDetails: Array<{
    number: number;
    tempo_marking: string | null;
    key: string | null;
    time_signature: string | null;
  }>;
  pageUrl: string;
}

// ── IMSLP API ──

const IMSLP_API = "https://imslp.org/api.php";
const UA = "Sempre/1.0 (classical music education; contact@withsempre.com)";

/** 작곡가 약어 → IMSLP 풀네임 매핑 */
const COMPOSER_MAP: Record<string, string> = {
  "beethoven": "Beethoven, Ludwig van",
  "mozart": "Mozart, Wolfgang Amadeus",
  "bach": "Bach, Johann Sebastian",
  "chopin": "Chopin, Frédéric",
  "liszt": "Liszt, Franz",
  "brahms": "Brahms, Johannes",
  "schumann": "Schumann, Robert",
  "schubert": "Schubert, Franz",
  "debussy": "Debussy, Claude",
  "ravel": "Ravel, Maurice",
  "rachmaninoff": "Rachmaninoff, Sergei",
  "prokofiev": "Prokofiev, Sergey",
  "tchaikovsky": "Tchaikovsky, Pyotr",
  "haydn": "Haydn, Joseph",
  "mendelssohn": "Mendelssohn, Felix",
  "grieg": "Grieg, Edvard",
  "dvořák": "Dvořák, Antonín",
  "dvorak": "Dvořák, Antonín",
  "sibelius": "Sibelius, Jean",
  "scriabin": "Scriabin, Aleksandr",
  "bartók": "Bartók, Béla",
  "bartok": "Bartók, Béla",
  "stravinsky": "Stravinsky, Igor",
  "shostakovich": "Shostakovich, Dmitry",
};

/** 별칭 제거 — "Appassionata", "Moonlight" 등 */
function stripNickname(title: string): string {
  return title
    .replace(/['"""']/g, "")
    .replace(/\b(Appassionata|Moonlight|Pathétique|Pathetique|Waldstein|Emperor|Spring|Kreutzer|Tempest|Hammerklavier|Les Adieux)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Op 번호 추출 — "Op.10 No.4" → "Op.10" */
function extractOpus(title: string): string | null {
  const match = title.match(/Op\.?\s*(\d+)/i) ?? title.match(/BWV\s*(\d+)/i) ?? title.match(/K\.?\s*(\d+)/i) ?? title.match(/S\.?\s*(\d+)/i);
  return match ? match[0] : null;
}

/**
 * IMSLP 검색 — 다단계 전략
 */
async function searchIMSLP(composer: string, title: string): Promise<string | null> {
  const lastName = composer.trim().split(" ").pop() ?? composer;
  const imslpComposer = COMPOSER_MAP[lastName.toLowerCase()] ?? null;
  const opus = extractOpus(title);
  const stripped = stripNickname(title);

  // 검색 전략: 구체적 → 일반적
  const queries = [
    // 1. IMSLP 페이지명 직접 매칭 시도
    imslpComposer ? `${stripped.split(",")[0]} ${imslpComposer.split(",")[0]}` : null,
    // 2. 원래 제목 + 작곡가 성
    `${title} ${lastName}`,
    // 3. 별칭 제거 + 작곡가 성
    `${stripped} ${lastName}`,
    // 4. 쉼표 이전만 + 작곡가 성
    `${title.split(",")[0]} ${lastName}`,
    // 5. Op 번호만 + 악기 + 작곡가 성
    opus ? `${opus} ${lastName}` : null,
    // 6. 숫자가 있으면 "No.X" 패턴으로
    title.match(/No\.?\s*\d+/) ? `${title.match(/No\.?\s*\d+/)?.[0]} ${opus ?? ""} ${lastName}` : null,
    // 7. 특수문자 전부 제거
    `${title.replace(/['"(),.]/g, " ").replace(/\s+/g, " ")} ${lastName}`,
  ].filter(Boolean) as string[];

  for (const q of queries) {
    try {
      const url = `${IMSLP_API}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=0&srlimit=8&format=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const results: { title: string }[] = data?.query?.search ?? [];

      // 필터: 작곡가 포함 + 편곡 제외
      const filtered = results.filter((r) => {
        const t = r.title.toLowerCase();
        return t.includes(lastName.toLowerCase()) &&
          !t.includes("arrangement") &&
          !t.includes("number score") &&
          !t.includes("transcription") &&
          !t.includes("simplified");
      });

      // Op 번호가 있으면 Op 매칭 우선
      if (opus && filtered.length > 0) {
        const opusMatch = filtered.find((r) => r.title.includes(opus.replace(/\s/g, "")));
        if (opusMatch) return opusMatch.title;
      }

      if (filtered.length > 0) return filtered[0].title;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * IMSLP 페이지 wikitext 가져와서 팩트 추출
 */
async function parseIMSLPPage(pageTitle: string): Promise<IMSLPParsedData | null> {
  try {
    const url = `${IMSLP_API}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const wt: string = data?.parse?.wikitext?.["*"] ?? "";
    if (!wt || wt.length < 100) return null;

    const key = extractKey(wt);
    const movements = extractField(wt, "Movements/Sections") ?? extractField(wt, "Movements/SectionsHeader");
    const year = extractField(wt, "Year/Date of Composition") ?? extractField(wt, "Year of Composition");
    const dedication = extractField(wt, "Dedication");
    const movementDetails = parseMovements(wt, movements);
    const pageUrl = `https://imslp.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`;

    return { key, movements, year, dedication, movementDetails, pageUrl };
  } catch (e) {
    console.error("[IMSLP] 페이지 파싱 실패:", e);
    return null;
  }
}

/**
 * Key 추출 — {{Key|g|minor}}, {{Key|E-flat|major}}, 일반 텍스트 모두 처리
 */
function extractKey(wt: string): string | null {
  // 1. {{Key|...}} 템플릿
  const templateMatch = wt.match(/\{\{Key\|([^}]+)\}\}/i);
  if (templateMatch) {
    const parts = templateMatch[1].split("|").map((p) => p.trim());
    if (parts.length >= 2) {
      return `${capitalize(parts[0])} ${parts[1]}`;
    }
    if (parts.length === 1) {
      const note = parts[0];
      // 소문자 = minor, 대문자 = major (IMSLP 관례)
      return note === note.toLowerCase()
        ? `${capitalize(note)} minor`
        : `${note} major`;
    }
  }

  // 2. |Key=E-flat major (일반 텍스트)
  const textMatch = wt.match(/\|\s*Key\s*=\s*([^|}\n{]+)/i);
  if (textMatch) {
    const val = textMatch[1].trim().replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
    if (val && val !== "-") return val;
  }

  return null;
}

/**
 * wikitext에서 |FieldName=value 추출
 */
function extractField(wt: string, fieldName: string): string | null {
  const escaped = fieldName.replace(/[/()]/g, "\\$&");
  const regex = new RegExp(`\\|\\s*${escaped}\\s*=\\s*([^|\\n}]+)`, "i");
  const match = wt.match(regex);
  if (!match) return null;
  let value = match[1].trim();
  if (!value || value === "-") return null;
  // 위키 링크 제거
  value = value.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
  // 템플릿 제거 (단순)
  value = value.replace(/\{\{[^}]+\}\}/g, "").trim();
  return value || null;
}

/**
 * 악장 상세 파싱 — wikitext에서 템포 마킹 추출
 */
function parseMovements(
  wt: string,
  movementsField: string | null
): Array<{ number: number; tempo_marking: string | null; key: string | null; time_signature: string | null }> {
  const details: Array<{ number: number; tempo_marking: string | null; key: string | null; time_signature: string | null }> = [];

  // 패턴 1: #*'''Allegro molto e con brio'''
  const pattern1 = /(?:^|\n)\s*#\s*\*?\s*'{0,3}([A-Z][a-zà-ü]+(?:\s+[a-zà-üA-Z.,()]+)*)\s*'{0,3}/g;
  let match;
  while ((match = pattern1.exec(wt)) !== null) {
    const tempo = match[1].trim();
    if (isTempoMarking(tempo)) {
      details.push({ number: details.length + 1, tempo_marking: tempo, key: null, time_signature: null });
    }
  }

  // 패턴 2: movements 필드에서 "I. Allegro, II. Largo, ..."
  if (details.length === 0 && movementsField) {
    const parts = movementsField.split(/[,;]/);
    for (const part of parts) {
      const cleaned = part.replace(/^[\s\dIVXivx.():\-]+/, "").trim();
      if (cleaned && isTempoMarking(cleaned)) {
        details.push({ number: details.length + 1, tempo_marking: cleaned, key: null, time_signature: null });
      }
    }
  }

  // 패턴 3: "Mov./Sec's" 테이블에서 파싱 (IMSLP General Information)
  if (details.length === 0) {
    // |Movements/SectionsHeader = 3 movements:\n# Allegro\n# Andante\n# Rondo
    const headerMatch = wt.match(/Movements\/Sections\w*\s*=\s*([\s\S]*?)(?:\n\||\n\}\})/i);
    if (headerMatch) {
      const block = headerMatch[1];
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        // "# Allegro con brio" 또는 "I. Allegro" 형식
        const cleaned = line.replace(/^[#*\s\d.IVX]+/, "").replace(/'{2,3}/g, "").trim();
        if (cleaned && isTempoMarking(cleaned)) {
          details.push({ number: details.length + 1, tempo_marking: cleaned, key: null, time_signature: null });
        }
      }
    }
  }

  // 패턴 4: "4 movements" 텍스트에서 수만 추출
  if (details.length === 0 && movementsField) {
    const numMatch = movementsField.match(/(\d+)\s*movement/i);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      for (let i = 1; i <= n; i++) {
        details.push({ number: i, tempo_marking: null, key: null, time_signature: null });
      }
    }
  }

  return details;
}

function isTempoMarking(text: string): boolean {
  const words = [
    "allegr", "adagi", "andant", "largo", "lento", "prest", "vivac",
    "moderato", "grave", "scherzo", "menuett", "rondo", "finale",
    "molto", "assai", "poco", "quasi", "agitato", "cantabile",
    "espressivo", "grazioso", "maestoso", "tranquillo", "marcia",
    "introduction", "intermezzo", "nocturne", "ballade",
  ];
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w)) && text.length < 80;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── LOCKED FACTS 블록 ──

export function buildLockedFactsBlock(facts: ScoreFactsFromVision): string {
  const { locked, unknown_fields } = facts;
  const movLines = locked.movements
    .map((m) => `  ${m.number}악장: 템포=${m.tempo_marking ?? "UNKNOWN"} | 조성=${m.key ?? "UNKNOWN"} | 박자=${m.time_signature ?? "UNKNOWN"}`)
    .join("\n");

  return `
[🔒 LOCKED FACTS — IMSLP에서 확인. 절대 변경 불가]
전체 조성: ${locked.overall_key ?? "UNKNOWN"}
${movLines}
출처: ${facts.source_url ?? "IMSLP"}
신뢰도: ${facts.confidence}

[❌ UNKNOWN — 확인 불가. 생성/추측 금지]
${unknown_fields.length > 0 ? unknown_fields.map((f) => `  - ${f}`).join("\n") : "  없음"}
  `.trim();
}

// ── 메인 함수 ──

export async function getScoreFactsFromIMSLP(
  composer: string,
  title: string,
  _openaiApiKey: string,
): Promise<{
  facts: ScoreFactsFromVision | null;
  lockedFactsBlock: string;
  imslpUrl: string | null;
}> {
  console.log(`[IMSLP] 시작: ${composer} - ${title}`);

  const pageTitle = await searchIMSLP(composer, title);
  if (!pageTitle) {
    console.log("[IMSLP] 검색 실패 → Perplexity fallback");
    return { facts: null, lockedFactsBlock: "", imslpUrl: null };
  }

  console.log(`[IMSLP] 페이지: ${pageTitle}`);

  const parsed = await parseIMSLPPage(pageTitle);
  if (!parsed) {
    console.log("[IMSLP] 파싱 실패 → Perplexity fallback");
    return { facts: null, lockedFactsBlock: "", imslpUrl: `https://imslp.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}` };
  }

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

  console.log(`[IMSLP] 완료: 조성=${parsed.key}, 악장=${parsed.movementDetails.length}개, 신뢰도=${confidence}`);

  return { facts, lockedFactsBlock, imslpUrl: parsed.pageUrl };
}
