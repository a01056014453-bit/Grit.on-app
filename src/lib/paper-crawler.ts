/**
 * lib/paper-crawler.ts
 *
 * 음악학 논문/자료 크롤링 + 한국어 번역 + Supabase 캐시
 */

import { supabaseServer } from "@/lib/supabase-server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");
import OpenAI from "openai";

export interface PaperCacheRow {
  id: string;
  composer: string;
  title: string;
  source_url: string;
  source_type: "pdf" | "html" | "abstract";
  extracted_text: string;
  summary_korean: string;
  language_detected: string;
  created_at: string;
}

// ── 키 정규화 ──────────────────────────────────────────────────

function normalizeComposerKey(composer: string): string {
  return composer.split(" ").pop()!.replace(/[^a-zA-Z]/g, "").toLowerCase();
}

function normalizeTitleKey(title: string): string {
  const opusMatch = title.match(/op\.?\s*\d+/i);
  if (opusMatch) return opusMatch[0].replace(/\s/g, "").toLowerCase();
  return title.substring(0, 20).toLowerCase();
}

// ── Supabase CRUD ──────────────────────────────────────────────

// paper_cache 테이블은 Supabase 타입 정의에 아직 없으므로 any 캐스팅
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const paperCacheTable = () => (supabaseServer as any).from("paper_cache");

async function getCachedPapers(composer: string, title: string): Promise<PaperCacheRow[]> {
  const { data, error } = await paperCacheTable()
    .select("*")
    .ilike("composer", `%${normalizeComposerKey(composer)}%`)
    .ilike("title", `%${normalizeTitleKey(title)}%`)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("[PaperCache] 조회 실패:", error.message);
    return [];
  }
  return (data as PaperCacheRow[]) || [];
}

async function savePaperCache(row: Omit<PaperCacheRow, "id" | "created_at">): Promise<void> {
  const { error } = await paperCacheTable().upsert(
    {
      ...row,
      extracted_text: row.extracted_text.substring(0, 50000),
      summary_korean: row.summary_korean.substring(0, 10000),
      created_at: new Date().toISOString(),
    },
    { onConflict: "source_url" }
  );
  if (error) console.error("[PaperCache] 저장 실패:", error.message);
}

// ── 검색 쿼리 생성 ────────────────────────────────────────────

function buildSearchQueries(composer: string, title: string): string[] {
  const lastName = composer.split(" ").pop() || composer;
  const opusMatch = title.match(/(?:op\.?\s*\d+(?:\s*no\.?\s*\d+)?|bwv\s*\d+|s\.\s*\d+|k\.?\s*\d+)/i);
  const opusStr = opusMatch ? opusMatch[0] : "";
  const cleanTitle = title.replace(/op\.?\s*\d+(?:\s*no\.?\s*\d+)?/i, "").trim();

  return [
    `"${lastName}" "${cleanTitle}" ${opusStr} analysis filetype:pdf`,
    `site:academia.edu "${lastName}" "${cleanTitle || opusStr}" piano analysis`,
    `site:researchgate.net "${lastName}" ${opusStr} harmonic analysis`,
    `"${lastName}" ${opusStr} "music theory" OR "harmonic analysis" OR "formal analysis" journal`,
    `"${lastName}" "${cleanTitle || opusStr}" piano performance technique interpretation`,
    `"${lastName}" ${opusStr} musicology dissertation university`,
    `"${lastName}" ${opusStr} site:oxfordmusiconline.com OR site:grove.com`,
    `site:imslp.org "${lastName}" "${cleanTitle || opusStr}"`,
  ].filter((q) => q.length > 20);
}

// ── Perplexity: URL 탐색 ──────────────────────────────────────

async function findPaperUrls(composer: string, title: string): Promise<string[]> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return [];

  const perplexity = new OpenAI({ apiKey: key, baseURL: "https://api.perplexity.ai" });
  const queries = buildSearchQueries(composer, title);
  const lastName = composer.split(" ").pop() || composer;

  try {
    const completion = await perplexity.chat.completions.create({
      model: "sonar-pro",
      messages: [{
        role: "user",
        content: `Find publicly accessible academic resources about "${composer}" - "${title}".

Search these queries:
${queries.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Priority sources: Academia.edu PDF, ResearchGate PDF, JSTOR open-access, University repositories, Grove/Oxford open sections, IMSLP editorial notes, Composer society publications.

Rules:
- ONLY URLs accessible WITHOUT login or paywall
- Up to 10 URLs
- Must be about "${lastName}" and "${title}"
- Return ONLY a valid JSON array: ["url1", "url2", ...]`,
      }],
      max_tokens: 2048,
      temperature: 0.1,
    });

    const text = completion.choices[0]?.message?.content || "[]";
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return [];

    const urls: unknown = JSON.parse(match[0]);
    if (!Array.isArray(urls)) return [];

    return (urls as unknown[])
      .filter((u): u is string => typeof u === "string" && u.startsWith("http"))
      .slice(0, 10);
  } catch (e) {
    console.error("[PaperFinder] 실패:", e instanceof Error ? e.message : e);
    return [];
  }
}

// ── 언어 감지 ─────────────────────────────────────────────────

function detectLanguage(text: string): string {
  const s = text.substring(0, 500);
  if (/[가-힣]/.test(s)) return "ko";
  if (/[\u3040-\u30FF]/.test(s)) return "ja";
  if (/[äöüÄÖÜß]/.test(s) && s.split(" ").length > 20) return "de";
  if (/[àâçéèêëîïôùûü]/.test(s) && s.split(" ").length > 20) return "fr";
  return "en";
}

// ── 텍스트 추출 ───────────────────────────────────────────────

async function extractTextFromUrl(
  url: string
): Promise<{ text: string; sourceType: PaperCacheRow["source_type"] } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/pdf,text/html,text/plain,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    const isPdf = contentType.includes("pdf") || url.toLowerCase().includes(".pdf");

    if (isPdf) {
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1000) return null;
      const parsed = await pdfParse(buffer, { max: 15 });
      const text = parsed.text?.trim() || "";
      if (text.length < 300) return null;
      return { text: text.substring(0, 40000), sourceType: "pdf" };
    }

    if (contentType.includes("html") || contentType.includes("text")) {
      const html = await response.text();
      const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<header[\s\S]*?<\/header>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      if (cleaned.length < 300) return null;
      const isAbstract =
        url.includes("abstract") || url.includes("jstor") || url.includes("doi.org");
      return {
        text: cleaned.substring(0, 30000),
        sourceType: isAbstract ? "abstract" : "html",
      };
    }

    return null;
  } catch (e) {
    if (e instanceof Error && e.name !== "AbortError") {
      console.error(`[Extract] 실패 (${url}):`, e.message);
    }
    return null;
  }
}

// ── GPT-4o-mini: 번역 + 요약 ─────────────────────────────────

async function extractAndTranslate(
  rawText: string,
  composer: string,
  title: string,
  language: string,
  openai: OpenAI
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "음악학 전문 번역가. 자료에 없는 내용 절대 추가 금지. 한국어로 번역하되 음악 용어는 원어 병기.",
        },
        {
          role: "user",
          content: `"${composer}" "${title}" 관련 해외 자료 (원문: ${language}).
있는 항목만 추출·번역하고 없는 항목은 생략:
1. 화성 분석 (조성, 화성 진행, 특이한 화성 언어)
2. 형식·구조 분석 (구조, 마디 번호, 섹션 구분)
3. 작곡 기법 (이 작곡가 고유의 기법)
4. 연주 해석 (템포, 터치, 페달링, 연주자 비교)
5. 역사·맥락 (작곡 동기, 헌정, 초연, 비평)
6. 출처 (저자, 연도, 학술지명)
---
${rawText.substring(0, 20000)}
---`,
        },
      ],
      max_tokens: 3000,
      temperature: 0.1,
    });
    return completion.choices[0]?.message?.content || "";
  } catch (e) {
    console.error("[Translate] 실패:", e instanceof Error ? e.message : e);
    return "";
  }
}

// ── 포맷팅 ────────────────────────────────────────────────────

function formatCombinedSummary(
  results: { url: string; summary: string; sourceType: string }[]
): string {
  const label: Record<string, string> = {
    pdf: "📄 논문/PDF",
    html: "🌐 웹 자료",
    abstract: "📋 초록",
  };
  return results
    .map(
      (r, i) =>
        `[자료 ${i + 1}] ${label[r.sourceType] || "📎"}\n출처: ${r.url}\n\n${r.summary}`
    )
    .join("\n\n" + "─".repeat(60) + "\n\n");
}

// ── 메인 함수 ─────────────────────────────────────────────────

export async function crawlMusicPapers(
  composer: string,
  title: string,
  forceRefresh = false
): Promise<string | null> {
  console.log(`[PaperCrawler] 시작: ${composer} - ${title}`);

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;
  const openai = new OpenAI({ apiKey: openaiKey });

  if (!forceRefresh) {
    const cached = await getCachedPapers(composer, title);
    if (cached.length > 0) {
      console.log(`[PaperCrawler] 캐시 HIT: ${cached.length}개`);
      return formatCombinedSummary(
        cached.map((p) => ({
          url: p.source_url,
          summary: p.summary_korean,
          sourceType: p.source_type,
        }))
      );
    }
  }

  const urls = await findPaperUrls(composer, title);
  if (urls.length === 0) return null;

  const allResults: { url: string; summary: string; sourceType: string }[] = [];

  for (let i = 0; i < urls.length; i += 4) {
    const batch = urls.slice(i, i + 4);
    const settled = await Promise.allSettled(
      batch.map(async (url) => {
        const extracted = await extractTextFromUrl(url);
        if (!extracted || extracted.text.length < 200) return null;

        const language = detectLanguage(extracted.text);
        const summary = await extractAndTranslate(
          extracted.text,
          composer,
          title,
          language,
          openai
        );
        if (summary.length < 100) return null;

        await savePaperCache({
          composer,
          title,
          source_url: url,
          source_type: extracted.sourceType,
          extracted_text: extracted.text,
          summary_korean: summary,
          language_detected: language,
        });
        return { url, summary, sourceType: extracted.sourceType };
      })
    );

    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) allResults.push(r.value);
    }
  }

  if (allResults.length === 0) return null;
  const combined = formatCombinedSummary(allResults);
  console.log(`[PaperCrawler] 완료: ${allResults.length}개, ${combined.length}자`);
  return combined;
}
