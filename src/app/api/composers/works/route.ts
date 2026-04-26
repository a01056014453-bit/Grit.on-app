import { NextRequest, NextResponse } from "next/server";

const IMSLP_API = "https://imslp.org/api.php";
const UA = "Sempre/1.0 (classical music education; contact@withsempre.com)";

/** 약어/풀네임 → IMSLP 카테고리 형식 매핑 */
const IMSLP_COMPOSER_MAP: Record<string, string> = {
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
  "scriabin": "Scriabin, Aleksandr",
  "bartók": "Bartók, Béla",
  "bartok": "Bartók, Béla",
  "satie": "Satie, Erik",
  "mussorgsky": "Mussorgsky, Modest",
  "shostakovich": "Shostakovich, Dmitry",
  "gershwin": "Gershwin, George",
  "scarlatti": "Scarlatti, Domenico",
  "czerny": "Czerny, Carl",
  "burgmüller": "Burgmüller, Friedrich",
  "saint-saëns": "Saint-Saëns, Camille",
  "fauré": "Fauré, Gabriel",
  "faure": "Fauré, Gabriel",
  "clementi": "Clementi, Muzio",
  "handel": "Handel, George Frideric",
  "vivaldi": "Vivaldi, Antonio",
  "strauss": "Strauss, Richard",
  "mahler": "Mahler, Gustav",
  "dvorak": "Dvořák, Antonín",
  "dvořák": "Dvořák, Antonín",
  "sibelius": "Sibelius, Jean",
  "stravinsky": "Stravinsky, Igor",
  "poulenc": "Poulenc, Francis",
  "albéniz": "Albéniz, Isaac",
  "albeniz": "Albéniz, Isaac",
  "granados": "Granados, Enrique",
};

/** 작곡가 이름 → IMSLP 카테고리 형식 */
function toImslpComposer(name: string): string {
  // 성(last name)으로 매핑 시도
  const lower = name.toLowerCase().replace(/[^a-zà-ÿ]/g, "");
  for (const [key, imslp] of Object.entries(IMSLP_COMPOSER_MAP)) {
    if (lower.includes(key.replace(/[^a-zà-ÿ]/g, ""))) return imslp;
  }
  // 매핑 없으면 "First Last" → "Last, First" 변환
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return `${last}, ${first}`;
}

/** 서버 캐시 — 작곡가별 곡 목록 (프로세스 수명 동안 유지) */
const worksCache = new Map<string, { works: string[]; time: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

/**
 * GET /api/composers/works?composer=Chopin&q=ball
 * IMSLP에서 작곡가의 곡 목록 검색 → IMSLP 표준 제목 반환
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const composer = searchParams.get("composer")?.trim();
  const query = searchParams.get("q")?.trim().toLowerCase();

  if (!composer) {
    return NextResponse.json({ works: [] });
  }

  try {
    // 캐시에서 전체 목록 확인
    const cacheKey = composer.toLowerCase();
    const cached = worksCache.get(cacheKey);
    let allWorks: string[];

    if (cached && Date.now() - cached.time < CACHE_TTL) {
      allWorks = cached.works;
    } else {
      // IMSLP에서 작곡가의 곡 목록 가져오기
      console.log(`[composers/works] IMSLP fetch 시작: "${composer}"`);
      allWorks = await fetchImslpWorks(composer);
      console.log(`[composers/works] IMSLP fetch 완료: ${allWorks.length}곡`);
      if (allWorks.length > 0) {
        worksCache.set(cacheKey, { works: allWorks, time: Date.now() });
      }
    }

    // 쿼리로 필터링 — 제목 시작 매칭 우선, 그 다음 포함 매칭
    if (query && query.length >= 2) {
      const startsWith: string[] = [];
      const includes: string[] = [];
      for (const w of allWorks) {
        const lower = w.toLowerCase();
        if (lower.startsWith(query)) {
          startsWith.push(w);
        } else if (lower.includes(query)) {
          includes.push(w);
        }
      }
      let filtered = [...startsWith, ...includes];

      // 카테고리 목록에서 부족하면 IMSLP full-text search로 보완 (영어 제목 등)
      if (filtered.length < 5) {
        const searchResults = await searchImslpWorks(query, composer);
        const existingSet = new Set(filtered.map((w) => w.toLowerCase()));
        for (const r of searchResults) {
          if (!existingSet.has(r.toLowerCase())) {
            filtered.push(r);
            existingSet.add(r.toLowerCase());
          }
        }
      }

      return NextResponse.json({ works: filtered.slice(0, 20) });
    }

    // 쿼리 없으면 상위 20개
    return NextResponse.json({ works: allWorks.slice(0, 20) });
  } catch (err) {
    console.error("[composers/works]", err);
    return NextResponse.json({ works: [] });
  }
}

/** IMSLP MediaWiki API로 작곡가의 곡 목록 가져오기 */
async function fetchImslpWorks(composer: string): Promise<string[]> {
  const imslpName = toImslpComposer(composer);

  // Category:작곡가이름 에서 곡 목록 가져오기
  const works: string[] = [];
  let cmcontinue = "";

  for (let i = 0; i < 5; i++) { // 최대 5페이지 (약 250곡)
    let url = `${IMSLP_API}?action=query&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${imslpName}`)}&cmnamespace=0&cmlimit=50&cmtype=page&format=json`;
    if (cmcontinue) url += `&cmcontinue=${encodeURIComponent(cmcontinue)}`;

    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) break;
    const data = await res.json();
    const members = data.query?.categorymembers ?? [];

    for (const m of members) {
      const title = m.title as string;
      // IMSLP 페이지 제목에서 작곡가 부분 제거: "Sonata No.1 (Beethoven, Ludwig van)" → "Sonata No.1"
      const cleaned = title.replace(/\s*\([^)]*\)\s*$/, "").trim();
      if (cleaned && !cleaned.startsWith("Category:")) {
        works.push(cleaned);
      }
    }

    // IMSLP uses "query-continue" (old MediaWiki format)
    cmcontinue = data["query-continue"]?.categorymembers?.cmcontinue ?? data.continue?.cmcontinue ?? "";
    if (!cmcontinue) break;
  }

  // 알파벳 정렬
  works.sort((a, b) => a.localeCompare(b));
  return works;
}

/** IMSLP full-text search — 영어/다국어 제목 검색 */
async function searchImslpWorks(query: string, composer: string): Promise<string[]> {
  const imslpName = toImslpComposer(composer);
  // 작곡가 성(last name)만 추출
  const lastName = imslpName.split(",")[0].trim();

  try {
    const url = `${IMSLP_API}?action=query&list=search&srsearch=${encodeURIComponent(`${query} ${lastName}`)}&srnamespace=0&srlimit=10&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results: string[] = [];
    for (const item of data.query?.search ?? []) {
      const title = (item.title as string).replace(/\s*\([^)]*\)\s*$/, "").trim();
      if (title && !title.startsWith("Category:")) {
        results.push(title);
      }
    }
    return results;
  } catch {
    return [];
  }
}
