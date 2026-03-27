import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { songAnalysisV2Limiter } from "@/lib/rate-limiters";
import { getClientIdentifier, rateLimitResponse } from "@/lib/api-utils";
import { getCachedAnalysis, saveCachedAnalysis, deleteCachedAnalysis, updateAnalysisById, addToUserHistory } from "@/lib/song-analysis-db";
import { supabaseServer } from "@/lib/supabase-server";
import {
  createReferenceSearchPrompt,
  createPhase1Prompt,
  createPhase2Prompt,
  createPhase3Prompt,
  createPhase4aPrompt,
  createPhase4bPrompt,
  createMusicologistPrompt,
  createMusicXmlPrompt,
  createStructureOnlyPrompt,
  createDetailAnalysisPrompt,
  createExtraTechniquePrompt,
  isLargeWork,
  AnalysisInstrument,
} from "@/lib/analysis-prompts";
import { findComposerResources } from "@/lib/composer-resources";
import type {
  SongAnalysis,
  SongAnalysisContentV2,
  AnalyzeSongRequest,
  AnalyzeSongResponse,
  DifficultyLevel,
  VerificationStatus,
  StructureAnalysisV2,
  PracticeMethod,
  RecommendedPerformanceV2,
  SongOverview,
  ComposerLife,
  HistoricalBackground,
  SongCharacteristics,
} from "@/types/song-analysis";

// ── 클라이언트 ──────────────────────────────────────────────────

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getPerplexityClient(): OpenAI | null {
  if (!process.env.PERPLEXITY_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseURL: "https://api.perplexity.ai",
  });
}

// ── 유틸 ───────────────────────────────────────────────────────

function generateId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** JSON 블록 추출 (Perplexity citations 제거) */
function extractJSON(text: string): string {
  let cleaned = text.replace(/\[(\d+)\]/g, "");

  const jsonBlockMatch = cleaned.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) cleaned = jsonBlockMatch[1].trim();
  else {
    const braceMatch = cleaned.match(/\{[\s\S]*\}/);
    if (braceMatch) cleaned = braceMatch[0].trim();
    else cleaned = cleaned.trim();
  }

  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
  cleaned = cleaned.replace(/[\u3040-\u309F\u30A0-\u30FF]+/g, "");

  return cleaned;
}

/**
 * 잘린 JSON 복구 시도
 * max_tokens에 걸려 중간에 잘린 JSON을 부분적으로라도 파싱
 */
function tryRepairTruncatedJSON(text: string): Record<string, unknown> | null {
  let json = text.trim();

  // 열린 브래킷/브레이스 카운트
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of json) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }

  // 닫히지 않은 문자열 닫기
  if (inString) json += '"';

  // 닫히지 않은 배열/객체 닫기
  while (brackets > 0) { json += "]"; brackets--; }
  while (braces > 0) { json += "}"; braces--; }

  // 마지막 불완전한 요소 제거 (쉼표 뒤 잘림)
  json = json.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** "확인 필요" 문구 → undefined (조용히 제거) */
function filterNeedsReview(text: string | undefined): string | undefined {
  if (!text) return undefined;
  if (
    text.includes("확인 필요") ||
    text.includes("문헌 확인") ||
    text.includes("needs review") ||
    text.includes("verify via") ||
    text === "확인 필요"
  ) {
    return undefined;
  }
  return text;
}

/** sections의 measures 필드에서 "문헌 확인 필요" 등 제거 */
function sanitizeSections(
  sections: StructureAnalysisV2["sections"]
): StructureAnalysisV2["sections"] {
  return sections.map((s) => ({
    ...s,
    measures: filterNeedsReview(s.measures) ?? "",
  }));
}

// ── AI 호출 ─────────────────────────────────────────────────────

/** sleep 유틸 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GPT-4o 호출 — 글쓰기 전용
 * 429 Rate Limit 시 자동 재시도 (최대 3회, 대기 후 재시도)
 */
const SYSTEM_PROMPT =
  "반드시 한국어로만 응답하세요. 일본어, 중국어는 절대 사용하지 마세요. " +
  "고유명사(인명, 지명, 작품명)는 원어 표기를 허용합니다. " +
  "제공된 레퍼런스 데이터에 없는 구체적 수치(연도, 마디 번호, 작품번호)를 절대 생성하지 마세요. " +
  "확실하지 않은 정보는 빈 문자열(\"\")로 반환하세요. JSON 외에 다른 텍스트는 출력하지 마세요.";

/**
 * 멀티 프로바이더 AI 호출
 * 1순위: OpenAI GPT-4o
 * 2순위: Anthropic Claude Sonnet (OpenAI 실패 시 자동 전환)
 */
async function callGPT(
  openai: OpenAI,
  prompt: string,
  maxTokens: number = 8192,
  temperature: number = 0.1,
): Promise<string> {
  // 1순위: OpenAI GPT-4o
  const openaiResult = await tryOpenAI(openai, prompt, maxTokens, temperature);
  if (openaiResult !== null) return openaiResult;

  // 2순위: Claude Sonnet 폴백
  console.log("[callGPT] OpenAI 실패 → Claude Sonnet 폴백 시도...");
  const claudeResult = await tryClaude(prompt, maxTokens, temperature);
  if (claudeResult !== null) return claudeResult;

  throw new Error("OpenAI와 Claude 모두 실패했습니다.");
}

async function tryOpenAI(
  openai: OpenAI,
  prompt: string,
  maxTokens: number,
  temperature: number,
): Promise<string | null> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: 0.2,
      });
      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const is429 = errMsg.includes("429") || errMsg.includes("Rate limit");
      const isFatal = errMsg.includes("401") || errMsg.includes("Incorrect API key") || errMsg.includes("quota");

      if (isFatal) {
        console.error(`[OpenAI] 치명적 에러 (폴백 전환): ${errMsg}`);
        return null; // Claude 폴백으로
      }

      if (is429 && attempt < MAX_RETRIES - 1) {
        const waitSec = 15 * (attempt + 1);
        console.log(`[OpenAI] 429 Rate limit — ${waitSec}초 대기 (${attempt + 1}/${MAX_RETRIES})`);
        await sleep(waitSec * 1000);
        continue;
      }

      console.error(`[OpenAI] 에러 (폴백 전환): ${errMsg}`);
      return null; // Claude 폴백으로
    }
  }
  return null;
}

async function tryClaude(
  prompt: string,
  maxTokens: number,
  temperature: number,
): Promise<string | null> {
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    console.error("[Claude] ANTHROPIC_API_KEY 미설정 — 폴백 불가");
    return null;
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      temperature: Math.min(temperature, 1.0),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const result = textBlock?.text || "";
    console.log(`[Claude] 응답 성공: ${result.length}자`);
    return result;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Claude] 에러: ${errMsg}`);
    return null;
  }
}

/**
 * Perplexity 호출 — 팩트 수집 전용
 * Phase 0 레퍼런스 검색, Phase 0.5 URL 탐색, 교차검증에만 사용
 */
async function callPerplexity(
  prompt: string,
  maxTokens: number = 4096,
): Promise<string | null> {
  const perplexity = getPerplexityClient();
  if (!perplexity) return null;

  try {
    const completion = await perplexity.chat.completions.create({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content:
            "반드시 한국어로만 응답하세요. 일본어, 중국어는 절대 사용하지 마세요. " +
            "확실하지 않은 정보는 빈 문자열(\"\")로 반환하세요. JSON 외에 다른 텍스트는 출력하지 마세요.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.1,
    });
    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("[Perplexity] 호출 실패:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * 안전한 JSON 파싱: 3단계 복구
 * 1차: 직접 파싱
 * 2차: 잘린 JSON 복구 (브래킷 닫기)
 * 3차: GPT로 재포맷 (최후 수단)
 */
async function safeParseJSON(
  text: string,
  openai: OpenAI,
  label: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
  const jsonStr = extractJSON(text);

  // 1차: 직접 파싱
  try {
    return JSON.parse(jsonStr);
  } catch {
    // 2차: 잘린 JSON 복구 시도
    console.log(`[${label}] JSON 파싱 실패 → 잘린 JSON 복구 시도`);
    const repaired = tryRepairTruncatedJSON(jsonStr);
    if (repaired) {
      console.log(`[${label}] 잘린 JSON 복구 성공`);
      return repaired;
    }

    // 3차: GPT로 재포맷 (비용 발생)
    console.log(`[${label}] 복구 실패 → GPT 재포맷`);
    try {
      const reformatted = await callGPT(
        openai,
        `다음 텍스트에서 JSON 객체만 추출하여 유효한 JSON으로 변환하십시오. 텍스트 설명이나 마크다운은 제거하고 순수 JSON만 출력하십시오.\n\n${text.substring(0, 12000)}`,
        4096,
        0.1,
      );
      return JSON.parse(extractJSON(reformatted));
    } catch {
      // 최종 실패: 빈 객체 반환 (에러 전파하지 않음)
      console.error(`[${label}] 모든 JSON 파싱 실패 — 빈 결과 반환`);
      return {};
    }
  }
}

// ── Phase 0: 팩트 수집 (Perplexity 전용) ─────────────────────────

/** Phase 0: 레퍼런스 데이터 검색 */
async function searchMusicReference(
  composer: string,
  title: string,
  instrument?: AnalysisInstrument,
): Promise<string | null> {
  const perplexity = getPerplexityClient();
  if (!perplexity) {
    console.log("[Phase 0] PERPLEXITY_API_KEY 미설정 — 건너뜀");
    return null;
  }

  try {
    console.log("[Phase 0] Perplexity 레퍼런스 검색 중...");
    const prompt = createReferenceSearchPrompt(composer, title, instrument);
    const completion = await perplexity.chat.completions.create({
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.1,
    });
    const result = completion.choices[0]?.message?.content || null;
    if (result) console.log(`[Phase 0] 레퍼런스 확보: ${result.length}자`);
    return result;
  } catch (error) {
    console.error("[Phase 0] 실패:", error instanceof Error ? error.message : error);
    return null;
  }
}

// ── 교차검증 (Perplexity 전용) ────────────────────────────────────

/**
 * Perplexity로 특정 사실 검증
 * - confirmed: 확인됨 → 유지
 * - incorrect: 명확히 불일치 → 제거
 * - unverifiable: 확인 불가 → 기존 값 유지 (틀린 게 아님)
 */
async function verifyFactWithPerplexity(
  field: string,
  value: string,
  composer: string,
  title: string,
): Promise<"confirmed" | "incorrect" | "unverifiable"> {
  const prompt = `Verify this musical fact precisely:
Composer: ${composer}
Piece: ${title}
Field: ${field}
Claimed value: "${value}"

Search IMSLP, Grove Music Online, Wikipedia, Henle Verlag.

Reply ONLY with one of these exact strings:
- "CONFIRMED" — authoritative source confirms this exact value
- "INCORRECT" — authoritative source gives a different value
- "UNVERIFIABLE" — authoritative sources do not mention this specifically

Do NOT guess. Base your answer only on what you can confirm from authoritative sources.`;

  const result = await callPerplexity(prompt, 512);
  if (!result) return "unverifiable";

  const upper = result.trim().toUpperCase();
  if (upper.startsWith("CONFIRMED")) return "confirmed";
  if (upper.startsWith("INCORRECT")) return "incorrect";
  return "unverifiable";
}

/**
 * Phase 1 meta 교차검증
 * - 확인됨: 그대로
 * - 불일치 or 확인 불가: 해당 필드를 빈 문자열로 제거 (조용히)
 */
async function crossVerifyMeta(
  meta: SongAnalysis["meta"],
): Promise<SongAnalysis["meta"]> {
  const perplexity = getPerplexityClient();
  if (!perplexity) {
    console.log("[CrossVerify] Perplexity 없음 — 검증 건너뜀");
    return meta;
  }

  const verifiedMeta = { ...meta };

  // 검증 대상: opus, key (composer/title은 입력값이므로 검증 불필요)
  const targets: Array<{ field: keyof typeof meta; value: string }> = [];

  if (meta.opus) targets.push({ field: "opus", value: meta.opus });
  if (meta.key) targets.push({ field: "key", value: meta.key });

  console.log(`[CrossVerify] ${targets.length}개 항목 검증 시작`);

  await Promise.allSettled(
    targets.map(async ({ field, value }) => {
      const result = await verifyFactWithPerplexity(
        field,
        value,
        meta.composer,
        meta.title,
      );

      if (result === "confirmed") {
        console.log(`[CrossVerify] ✅ ${field}: "${value}" 확인됨`);
      } else if (result === "incorrect") {
        // 명확히 틀린 경우만 제거
        console.log(`[CrossVerify] ❌ ${field}: "${value}" 불일치 → 제거`);
        (verifiedMeta as Record<string, string>)[field] = "";
      } else {
        // unverifiable → 확인 불가일 뿐, 틀린 게 아니므로 기존 값 유지
        console.log(`[CrossVerify] ⚠️ ${field}: "${value}" 확인 불가 → 기존 값 유지`);
      }
    }),
  );

  return verifiedMeta;
}

// ── Phase 1~4: GPT 전용 (글쓰기) ──────────────────────────────────

async function runPhase1(
  openai: OpenAI,
  composer: string,
  title: string,
  musicXml?: string,
  instrument?: AnalysisInstrument,
  enrichedReference?: string | null,
): Promise<{ meta: SongAnalysis["meta"]; song_overview: SongOverview }> {
  console.log("[Phase 1] 데이터 검증 + 곡 개요...");

  const prompt = createPhase1Prompt(composer, title, musicXml ?? "", enrichedReference ?? undefined, instrument ?? undefined);
  const text = await callGPT(openai, prompt, 4096, 0.1);
  const parsed = await safeParseJSON(text, openai, "Phase 1");

  const meta: SongAnalysis["meta"] = {
    composer: parsed.meta?.composer || composer,
    title: parsed.meta?.title || title,
    opus: filterNeedsReview(parsed.meta?.opus) || "",
    key: filterNeedsReview(parsed.meta?.key) || "",
    difficulty_level: (
      ["Beginner", "Intermediate", "Advanced", "Virtuoso"].includes(parsed.meta?.difficulty_level)
        ? parsed.meta.difficulty_level
        : "Intermediate"
    ) as DifficultyLevel,
  };

  const song_overview: SongOverview = {
    title_original: parsed.song_overview?.title_original || title,
    title_korean: parsed.song_overview?.title_korean || undefined,
    composition_period: parsed.song_overview?.composition_period || "",
    tempo_marking: parsed.song_overview?.tempo_marking || "",
    genre: parsed.song_overview?.genre || "",
    form: parsed.song_overview?.form || "",
    musical_features: Array.isArray(parsed.song_overview?.musical_features)
      ? parsed.song_overview.musical_features
      : [],
  };

  console.log(`[Phase 1] Done: ${meta.composer} - ${meta.title} (${meta.opus})`);
  return { meta, song_overview };
}

async function runPhase2(
  openai: OpenAI,
  composer: string,
  title: string,
  opus: string,
  instrument?: AnalysisInstrument,
  verifiedMeta?: { composer: string; title: string; opus: string; key: string },
  enrichedReference?: string | null,
): Promise<{
  composer_life: ComposerLife;
  historical_background: HistoricalBackground;
  song_characteristics: SongCharacteristics;
}> {
  console.log("[Phase 2] 인문학적 배경...");

  const prompt = createPhase2Prompt(composer, title, opus, verifiedMeta, enrichedReference || undefined, instrument);
  const text = await callGPT(openai, prompt, 8192, 0.3);
  const parsed = await safeParseJSON(text, openai, "Phase 2");

  const composer_life: ComposerLife = {
    summary: parsed.composer_life?.summary || "",
    timeline: Array.isArray(parsed.composer_life?.timeline) ? parsed.composer_life.timeline : [],
    at_composition: parsed.composer_life?.at_composition || "",
  };

  const historical_background: HistoricalBackground = {
    era_characteristics: parsed.historical_background?.era_characteristics || "",
    contemporary_composers: parsed.historical_background?.contemporary_composers || "",
    musical_movement: parsed.historical_background?.musical_movement || "",
  };

  const song_characteristics: SongCharacteristics = {
    composition_background: parsed.song_characteristics?.composition_background || "",
    form_and_structure: parsed.song_characteristics?.form_and_structure || "",
    technique: parsed.song_characteristics?.technique || "",
    literary_dramatic: parsed.song_characteristics?.literary_dramatic || "",
    conclusion: parsed.song_characteristics?.conclusion || "",
  };

  console.log("[Phase 2] Done");
  return { composer_life, historical_background, song_characteristics };
}

async function runPhase3(
  openai: OpenAI,
  composer: string,
  title: string,
  opus: string,
  instrument?: AnalysisInstrument,
  musicXml?: string,
  enrichedReference?: string | null,
  verifiedMeta?: { composer: string; title: string; opus: string; key: string },
): Promise<{ structure_analysis_v2: StructureAnalysisV2 }> {
  console.log("[Phase 3] 구조/화성 분석...");

  const prompt = createPhase3Prompt(composer, title, opus, instrument, musicXml, enrichedReference ?? undefined, verifiedMeta);
  const text = await callGPT(openai, prompt, 12000, 0.1);
  const parsed = await safeParseJSON(text, openai, "Phase 3");

  // GPT가 다양한 키로 반환할 수 있으므로 여러 경로에서 탐색
  const v2 = parsed.structure_analysis_v2 || parsed;
  const rawSections = Array.isArray(v2.sections)
    ? v2.sections
    : Array.isArray(parsed.sections)
      ? parsed.sections
      : [];

  const rawHarmony = Array.isArray(v2.harmony_table)
    ? v2.harmony_table
    : Array.isArray(parsed.harmony_table)
      ? parsed.harmony_table
      : [];

  const structure_analysis_v2: StructureAnalysisV2 = {
    sections: sanitizeSections(rawSections),
    harmony_table: rawHarmony,
  };

  console.log(`[Phase 3] Done: ${structure_analysis_v2.sections.length} sections, ${structure_analysis_v2.harmony_table.length} harmony rows`);
  return { structure_analysis_v2 };
}

/** Phase 4a: 연습법 (technique_summary + section_guides) + 추천 연주 */
async function runPhase4a(
  openai: OpenAI,
  composer: string,
  title: string,
  opus: string,
  sectionNames: string[],
  instrument?: AnalysisInstrument,
  enrichedReference?: string | null,
): Promise<{
  technique_summary: PracticeMethod["technique_summary"];
  section_guides: PracticeMethod["section_guides"];
  recommended_performances_v2: RecommendedPerformanceV2[];
}> {
  console.log("[Phase 4a] 연습법 + 추천 연주...");

  const prompt = createPhase4aPrompt(composer, title, opus, sectionNames, enrichedReference || undefined, instrument);
  const text = await callGPT(openai, prompt, 8192, 0.3);
  const parsed = await safeParseJSON(text, openai, "Phase 4a");

  const technique_summary = Array.isArray(parsed.technique_summary)
    ? parsed.technique_summary
    : [];
  const section_guides = Array.isArray(parsed.section_guides)
    ? parsed.section_guides
    : [];
  const recommended_performances_v2: RecommendedPerformanceV2[] = Array.isArray(
    parsed.recommended_performances_v2,
  )
    ? parsed.recommended_performances_v2
    : [];

  console.log(`[Phase 4a] Done: ${section_guides.length} guides, ${recommended_performances_v2.length} performances`);
  return { technique_summary, section_guides, recommended_performances_v2 };
}

/** Phase 4b: 4주 루틴 (별도 호출 — 28일 분량 토큰 확보) */
async function runPhase4b(
  openai: OpenAI,
  composer: string,
  title: string,
  opus: string,
  sectionNames: string[],
  instrument?: AnalysisInstrument,
  enrichedReference?: string | null,
): Promise<PracticeMethod["weekly_routine"]> {
  console.log("[Phase 4b] 4주 루틴...");

  const prompt = createPhase4bPrompt(composer, title, opus, sectionNames, enrichedReference || undefined, instrument);
  const text = await callGPT(openai, prompt, 12000, 0.3);
  const parsed = await safeParseJSON(text, openai, "Phase 4b");

  const weekly_routine = Array.isArray(parsed.weekly_routine)
    ? parsed.weekly_routine
    : [];

  const totalDays = weekly_routine.reduce(
    (sum: number, w: { days?: unknown[] }) => sum + (Array.isArray(w.days) ? w.days.length : 0),
    0,
  );
  console.log(`[Phase 4b] Done: ${weekly_routine.length} weeks, ${totalDays} days total`);
  return weekly_routine;
}

/** YouTube URL 검색 (Perplexity) — 추천 연주자별 실제 영상 찾기 */
async function searchYoutubeUrls(
  composer: string,
  title: string,
  performances: RecommendedPerformanceV2[],
): Promise<RecommendedPerformanceV2[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || performances.length === 0) return performances;

  console.log(`[YouTube] ${performances.length}명 연주자 YouTube Data API 검색 중...`);

  const results = await Promise.allSettled(
    performances.map(async (perf) => {
      try {
        const query = `${perf.artist} ${composer} ${title}`;
        const params = new URLSearchParams({
          part: "snippet",
          q: query,
          type: "video",
          maxResults: "1",
          videoCategoryId: "10",
          key: apiKey,
        });

        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
        if (!res.ok) return { artist: perf.artist, url: "" };

        const data = await res.json();
        const videoId = data.items?.[0]?.id?.videoId;

        return {
          artist: perf.artist,
          url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
        };
      } catch {
        return { artist: perf.artist, url: "" };
      }
    }),
  );

  return performances.map((p, i) => {
    const result = results[i];
    const url = result.status === "fulfilled" ? result.value.url : "";
    return { ...p, youtube_url: url || p.youtube_url || "" };
  });
}

// ── V2 파이프라인 ──────────────────────────────────────────────────

async function runV2Pipeline(
  openai: OpenAI,
  composer: string,
  title: string,
  musicXml?: string,
  forceRefresh = false,
  instrument?: AnalysisInstrument,
): Promise<SongAnalysis> {
  // ── Phase 0: 팩트 수집 (학술자료 DB + Perplexity 병렬)
  console.log("[Phase 0] 팩트 수집 시작 (학술자료 DB + 웹 검색 병렬)...");
  const [resourceResult, referenceData] = await Promise.all([
    findComposerResources(composer, title),
    searchMusicReference(composer, title, instrument),
  ]);

  // 학술자료 DB를 1차 출처로, 웹 검색을 보조로 구성
  const enrichedReference = [
    resourceResult.totalRelevantText
      ? `[학술 자료 DB (관리자 검증)]\n${resourceResult.totalRelevantText}`
      : null,
    referenceData
      ? `[웹 검색 요약 (보조)]\n${referenceData}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n========\n\n") || null;

  console.log(`[Phase 0] 학술자료: ${resourceResult.resources.length}건, enrichedReference: ${enrichedReference?.length ?? 0}자`);

  // ── Phase 1: GPT — enrichedReference 기반으로 메타 정리
  const { meta: rawMeta, song_overview } = await runPhase1(
    openai, composer, title, musicXml, instrument, enrichedReference,
  );

  // ── 교차검증: Perplexity로 Phase 1 meta 재검증
  const meta = await crossVerifyMeta(rawMeta);
  const verifiedMeta = {
    composer: meta.composer,
    title: meta.title,
    opus: meta.opus,
    key: meta.key,
  };

  // ── Phase 2 → Phase 3: GPT — 순차 실행 (TPM 30K 제한 대응)
  const phase2Result = await runPhase2(openai, meta.composer, meta.title, meta.opus, instrument, verifiedMeta, enrichedReference);
  const phase3Result = await runPhase3(openai, meta.composer, meta.title, meta.opus, instrument, musicXml, enrichedReference, verifiedMeta);

  // ── Phase 4a → Phase 4b: GPT — 순차 실행 (TPM 제한 대응)
  const sectionNames = phase3Result.structure_analysis_v2.sections.map((s) => s.section);
  const effectiveSections = sectionNames.length > 0 ? sectionNames : ["전체"];

  const phase4aResult = await runPhase4a(openai, meta.composer, meta.title, meta.opus, effectiveSections, instrument, enrichedReference);
  const phase4bResult = await runPhase4b(openai, meta.composer, meta.title, meta.opus, effectiveSections, instrument, enrichedReference);

  // ── YouTube URL 검색 (Perplexity — Phase 4b와 독립적이므로 여기서 실행)
  const performancesWithUrls = await searchYoutubeUrls(
    meta.composer, meta.title, phase4aResult.recommended_performances_v2,
  );

  // ── 하위 호환 필드 자동 생성 (V1 타입 지원)
  const composer_background = phase2Result.composer_life.summary;
  const historical_context = phase2Result.historical_background.era_characteristics;
  const work_background = phase2Result.song_characteristics.composition_background;

  const structure_analysis = phase3Result.structure_analysis_v2.sections.map((s) => ({
    section: s.section,
    measures: s.measures,
    key_tempo: `${s.key_signature} / ${s.time_signature} / ${s.tempo}`,
    character: s.mood,
    description: s.description,
  }));

  const technique_tips = phase4aResult.section_guides.map((g) => ({
    section: g.section,
    problem: "",
    category: undefined as undefined,
    solution: g.guide,
    practice: "",
  }));

  const musical_interpretation = phase2Result.song_characteristics.conclusion;

  const recommended_performances = performancesWithUrls.map((p) => ({
    artist: p.artist,
    year: p.year,
    comment: p.comment,
  }));

  const rareComposers = [
    "alkan", "godowsky", "sorabji", "busoni", "thalberg",
    "medtner", "lyapunov", "moszkowski", "scharwenka",
  ];
  const isRareComposer = rareComposers.some((rc) => composer.toLowerCase().includes(rc));

  const content: SongAnalysisContentV2 = {
    composer_background,
    historical_context,
    work_background,
    structure_analysis,
    technique_tips,
    musical_interpretation,
    recommended_performances,
    song_overview,
    composer_life: phase2Result.composer_life,
    historical_background: phase2Result.historical_background,
    song_characteristics: phase2Result.song_characteristics,
    structure_analysis_v2: phase3Result.structure_analysis_v2,
    practice_method: {
      technique_summary: phase4aResult.technique_summary,
      section_guides: phase4aResult.section_guides,
      weekly_routine: phase4bResult,
    },
    recommended_performances_v2: performancesWithUrls,
  };

  return {
    id: generateId(),
    meta,
    content,
    verification_status: isRareComposer ? "Needs Review" : "Verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    schema_version: 2,
  };
}

// ── V1 파이프라인 (하위 호환, 변경 없음) ──────────────────────────

function parseAndValidateResponse(
  responseText: string,
  composer: string,
  title: string,
): SongAnalysis {
  const jsonStr = extractJSON(responseText);
  const parsed = JSON.parse(jsonStr);

  const rareComposers = [
    "alkan", "godowsky", "sorabji", "busoni", "thalberg",
    "medtner", "lyapunov", "moszkowski", "scharwenka",
  ];
  const isRareComposer = rareComposers.some((rc) => composer.toLowerCase().includes(rc));

  const analysis: SongAnalysis = {
    id: generateId(),
    meta: {
      composer: parsed.meta?.composer || composer,
      title: parsed.meta?.title || title,
      opus: filterNeedsReview(parsed.meta?.opus) || "",
      key: filterNeedsReview(parsed.meta?.key) || "",
      difficulty_level: (
        ["Beginner", "Intermediate", "Advanced", "Virtuoso"].includes(parsed.meta?.difficulty_level)
          ? parsed.meta.difficulty_level
          : "Intermediate"
      ) as DifficultyLevel,
    },
    content: {
      composer_background: parsed.content?.composer_background || "작곡가 정보를 확인할 수 없습니다.",
      historical_context: parsed.content?.historical_context || "시대적 배경 정보를 확인할 수 없습니다.",
      work_background: parsed.content?.work_background || "작품 배경 정보를 확인할 수 없습니다.",
      structure_analysis: Array.isArray(parsed.content?.structure_analysis)
        ? parsed.content.structure_analysis.map((s: Record<string, string>) => ({
            section: s.section || "섹션",
            measures: filterNeedsReview(s.measures),
            key_tempo: filterNeedsReview(s.key_tempo),
            character: filterNeedsReview(s.character),
            description: filterNeedsReview(s.description) || "",
          }))
        : [{ section: "전체", description: "" }],
      technique_tips: Array.isArray(parsed.content?.technique_tips)
        ? parsed.content.technique_tips.map((t: Record<string, string> | string) =>
            typeof t === "string"
              ? { section: "전체", problem: t, category: undefined, solution: "", practice: "" }
              : {
                  section: t.section || "전체",
                  problem: t.problem || "",
                  category: (["Physiological", "Interpretative", "Structural"].includes(t.category)
                    ? t.category
                    : undefined) as "Physiological" | "Interpretative" | "Structural" | undefined,
                  solution: t.solution || "",
                  practice: t.practice || "",
                },
          )
        : [{ section: "전체", problem: "", category: undefined, solution: "", practice: "" }],
      musical_interpretation: parsed.content?.musical_interpretation || "해석 가이드 정보 확인 필요",
      recommended_performances: Array.isArray(parsed.content?.recommended_performances)
        ? parsed.content.recommended_performances
        : [],
    },
    verification_status: (
      isRareComposer ? "Needs Review" : (parsed.verification_status || "Needs Review")
    ) as VerificationStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    schema_version: 1,
  };

  return analysis;
}

async function runV1Pipeline(
  openai: OpenAI,
  composer: string,
  title: string,
  sheetMusicImages?: string[],
  musicXml?: string,
): Promise<SongAnalysis> {
  const hasImages = sheetMusicImages && sheetMusicImages.length > 0;
  const hasMusicXml = musicXml && musicXml.length > 0;

  if (hasMusicXml) {
    console.log(`[V1 MusicXML] ${title} - ${musicXml!.length} chars`);
    const xmlPrompt = createMusicXmlPrompt(composer, title, musicXml!);
    const responseText = await callGPT(openai, xmlPrompt, 16384);
    return parseAndValidateResponse(responseText, composer, title);
  }

  if (isLargeWork(title) && !hasImages) {
    console.log(`[V1 Large Work] ${title} - two-pass analysis`);
    return runV1LargeWorkPipeline(openai, composer, title);
  }

  const prompt = createMusicologistPrompt(composer, title);

  let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  if (hasImages) {
    const imagePromptPrefix = `\n\n[악보 이미지 분석 지침]\n첨부된 악보 이미지를 반드시 참조하여 분석하십시오.`;
    const contentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      { type: "text", text: prompt + imagePromptPrefix },
      ...sheetMusicImages!.map((img): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
        type: "image_url",
        image_url: { url: img, detail: "high" },
      })),
    ];
    messages = [{ role: "user", content: contentParts }];
  } else {
    messages = [{ role: "user", content: prompt }];
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 16384,
    temperature: 0.2,
    top_p: 0.2,
  });

  let responseText = completion.choices[0]?.message?.content || "";

  if (
    hasImages &&
    (responseText.startsWith("I'm sorry") ||
      responseText.startsWith("I can't") ||
      responseText.startsWith("Sorry"))
  ) {
    console.log("[V1 Vision Fallback] Retrying text-only...");
    if (isLargeWork(title)) return runV1LargeWorkPipeline(openai, composer, title);
    const fallbackCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 16384,
      temperature: 0.5,
      top_p: 0.3,
    });
    responseText = fallbackCompletion.choices[0]?.message?.content || "";
  }

  return parseAndValidateResponse(responseText, composer, title);
}

async function runV1LargeWorkPipeline(
  openai: OpenAI,
  composer: string,
  title: string,
): Promise<SongAnalysis> {
  const structurePrompt = createStructureOnlyPrompt(composer, title);
  const structureText = await callGPT(openai, structurePrompt, 16384);
  const structureJson = await safeParseJSON(extractJSON(structureText), openai, "V1 Large structure") || {};
  const structureAnalysis: Array<{
    section: string;
    measures?: string;
    key_tempo?: string;
    character?: string;
    description: string;
  }> = Array.isArray(structureJson.structure_analysis) ? structureJson.structure_analysis : [];

  console.log(`[V1 Large Call 1] ${structureAnalysis.length} sections`);
  const sectionNames = structureAnalysis.map((s) => s.section);

  const detailPrompt = createDetailAnalysisPrompt(composer, title, sectionNames);
  const detailText = await callGPT(openai, detailPrompt, 16384);
  const detailJson = await safeParseJSON(extractJSON(detailText), openai, "V1 Large detail") || {};
  let allTechniqueTips = detailJson.content?.technique_tips || [];

  const coveredSections = new Set(
    allTechniqueTips.map((t: { section: string }) => t.section.replace(/\s*\(.*\)/, "").trim()),
  );
  const missingSections = sectionNames.filter((s) => !coveredSections.has(s));

  if (missingSections.length > 0) {
    console.log(`[V1 Large] Missing ${missingSections.length} sections → extra calls`);
    const BATCH_SIZE = 12;
    for (let i = 0; i < missingSections.length; i += BATCH_SIZE) {
      const batch = missingSections.slice(i, i + BATCH_SIZE);
      const extraPrompt = createExtraTechniquePrompt(
        composer, title, batch,
        Math.floor(i / BATCH_SIZE),
        Math.ceil(missingSections.length / BATCH_SIZE),
      );
      const extraText = await callGPT(openai, extraPrompt, 16384);
      try {
        const extraJson = JSON.parse(extractJSON(extraText));
        if (Array.isArray(extraJson.technique_tips)) {
          allTechniqueTips = [...allTechniqueTips, ...extraJson.technique_tips];
        }
      } catch { /* skip */ }
    }
  }

  const mergedResponse = JSON.stringify({
    meta: detailJson.meta || { composer, title },
    content: {
      composer_background: detailJson.content?.composer_background || "",
      historical_context: detailJson.content?.historical_context || "",
      work_background: detailJson.content?.work_background || "",
      structure_analysis: structureAnalysis,
      technique_tips: allTechniqueTips,
      musical_interpretation: detailJson.content?.musical_interpretation || "",
      recommended_performances: detailJson.content?.recommended_performances || [],
    },
    verification_status: detailJson.verification_status || "Needs Review",
  });

  return parseAndValidateResponse(mergedResponse, composer, title);
}

// ── API 핸들러 ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Rate Limit 체크 (시간당 5회)
    const identifier = getClientIdentifier(request);
    const limit = songAnalysisV2Limiter(identifier);
    if (!limit.success) return rateLimitResponse(limit.resetAt, "곡 분석은 하루에 1회만 가능합니다. 내일 다시 시도해주세요.");

    const body: AnalyzeSongRequest = await request.json();
    let { composer, title, forceRefresh = false, sheetMusicImages, musicXml } = body;
    const { pdfStoragePath, musicxmlStoragePath, useStoredSource, useV2 = true } = body;
    const instrument = ((body as unknown as Record<string, unknown>).instrument as AnalysisInstrument) || "piano";

    // 인증 필수 — user_id 가져오기
    const { createServerClient } = await import("@supabase/ssr");
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." } as AnalyzeSongResponse,
        { status: 401 },
      );
    }
    const authUserId = user.id;

    if (!composer || !title) {
      const response: AnalyzeSongResponse = {
        success: false,
        error: "composer와 title은 필수입니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    let storedPdfPath: string | undefined = pdfStoragePath;
    let storedMusicxmlPath: string | undefined = musicxmlStoragePath;

    if (useStoredSource) {
      forceRefresh = true;
      const existing = await getCachedAnalysis(composer, title);

      if (existing?.musicxml_storage_path) {
        console.log(`[Stored Source] Downloading MusicXML: ${existing.musicxml_storage_path}`);
        try {
          const { data } = await supabaseServer.storage
            .from("sheet-music")
            .download(existing.musicxml_storage_path);
          if (data) {
            musicXml = await data.text();
            console.log(`[Stored Source] MusicXML loaded: ${musicXml.length} chars`);
          }
        } catch (e) {
          console.error("[Stored Source] MusicXML download failed:", e);
        }
        storedPdfPath = existing.pdf_storage_path;
        storedMusicxmlPath = existing.musicxml_storage_path;
      } else if (existing?.pdf_storage_path) {
        console.log(`[Stored Source] Downloading PDF: ${existing.pdf_storage_path}`);
        try {
          const { data } = await supabaseServer.storage
            .from("sheet-music")
            .download(existing.pdf_storage_path);
          if (data) {
            const pdfBuffer = await data.arrayBuffer();
            const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
            const OMR_URL = process.env.OMR_SERVER_URL;

            if (OMR_URL) {
              const formData = new FormData();
              formData.append("file", pdfBlob, "input.pdf");
              try {
                const omrRes = await fetch(`${OMR_URL}/convert-to-musicxml`, {
                  method: "POST",
                  body: formData,
                  signal: AbortSignal.timeout(630000),
                });
                if (omrRes.ok) {
                  const omrResult = await omrRes.json();
                  if (omrResult.musicxml) {
                    musicXml = omrResult.musicxml;
                    console.log(`[Stored Source] OMR MusicXML: ${musicXml!.length} chars`);
                  }
                }
              } catch {
                console.log("[Stored Source] OMR MusicXML failed, trying images");
              }

              if (!musicXml) {
                const imgForm = new FormData();
                imgForm.append("file", pdfBlob, "input.pdf");
                try {
                  const imgRes = await fetch(`${OMR_URL}/convert-to-images`, {
                    method: "POST",
                    body: imgForm,
                  });
                  if (imgRes.ok) {
                    const imgResult = await imgRes.json();
                    sheetMusicImages = imgResult.images;
                  }
                } catch {
                  console.error("[Stored Source] Image conversion also failed");
                }
              }
            }
          }
        } catch (e) {
          console.error("[Stored Source] PDF download failed:", e);
        }
        storedPdfPath = existing.pdf_storage_path;
        storedMusicxmlPath = existing.musicxml_storage_path;
      }
    }

    const hasImages = sheetMusicImages && sheetMusicImages.length > 0;
    const hasMusicXml = musicXml && musicXml.length > 0;

    // 캐시 확인
    if (!forceRefresh && !hasImages && !hasMusicXml) {
      const cachedAnalysis = await getCachedAnalysis(composer, title);
      if (cachedAnalysis) {
        console.log(`[Cache HIT] ${composer} - ${title}`);
        const response: AnalyzeSongResponse = {
          success: true,
          data: cachedAnalysis,
          cached: true,
        };
        return NextResponse.json(response);
      }
    }

    console.log(`[Cache MISS] ${composer} - ${title} - Calling AI (V2=${useV2})...`);

    const openai = getOpenAIClient();
    if (!openai) {
      const response: AnalyzeSongResponse = {
        success: false,
        error: "OPENAI_API_KEY가 설정되지 않았습니다.",
      };
      return NextResponse.json(response, { status: 500 });
    }

    let analysis: SongAnalysis;

    if (useV2) {
      analysis = await runV2Pipeline(
        openai,
        composer,
        title,
        hasMusicXml ? musicXml : undefined,
        forceRefresh,
        instrument,
      );
    } else {
      analysis = await runV1Pipeline(
        openai,
        composer,
        title,
        hasImages ? sheetMusicImages : undefined,
        hasMusicXml ? musicXml : undefined,
      );
    }

    // 저장 경로 보존
    if (storedPdfPath) analysis.pdf_storage_path = storedPdfPath;
    if (storedMusicxmlPath) analysis.musicxml_storage_path = storedMusicxmlPath;
    if (!analysis.pdf_storage_path || !analysis.musicxml_storage_path) {
      const existingForPaths = await getCachedAnalysis(composer, title);
      if (!analysis.pdf_storage_path && existingForPaths?.pdf_storage_path)
        analysis.pdf_storage_path = existingForPaths.pdf_storage_path;
      if (!analysis.musicxml_storage_path && existingForPaths?.musicxml_storage_path)
        analysis.musicxml_storage_path = existingForPaths.musicxml_storage_path;
    }

    await saveCachedAnalysis(analysis, composer, title);
    // 개인 보관함에 추가
    if (analysis.id && authUserId) {
      await addToUserHistory(authUserId, analysis.id);
    }
    console.log(`[Cache SAVED] ${composer} - ${title} (schema_version=${analysis.schema_version})`);

    const response: AnalyzeSongResponse = {
      success: true,
      data: analysis,
      cached: false,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Song analysis API v2 error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Song analysis detail:", errMsg);

    let userMessage = "곡 분석 중 오류가 발생했습니다. 다시 시도해주세요.";
    let statusCode = 500;

    if (errMsg.includes("429") || errMsg.includes("Rate limit")) {
      userMessage = "AI 서버가 바쁩니다. 1-2분 후 다시 시도해주세요.";
      statusCode = 429;
    } else if (errMsg.includes("401") || errMsg.includes("API key")) {
      userMessage = "AI 서비스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.";
      statusCode = 503;
    } else if (errMsg.includes("OpenAI와 Claude 모두 실패")) {
      userMessage = "AI 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.";
      statusCode = 503;
    }

    const response: AnalyzeSongResponse = {
      success: false,
      error: userMessage,
    };
    return NextResponse.json(response, { status: statusCode });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 인증 필수
    const { createServerClient } = await import("@supabase/ssr");
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "id가 필요합니다" }, { status: 400 });
    }
    const result = await deleteCachedAnalysis(id);
    if (result) return NextResponse.json({ success: true });
    return NextResponse.json({ success: false, error: "삭제에 실패했습니다" }, { status: 500 });
  } catch (error) {
    console.error("Delete analysis error:", error);
    return NextResponse.json({ success: false, error: "삭제 실패" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // 인증 필수
    const { createServerClient } = await import("@supabase/ssr");
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id, analysis } = await request.json();
    if (!id || !analysis) {
      return NextResponse.json(
        { success: false, error: "id와 analysis가 필요합니다" },
        { status: 400 },
      );
    }
    const result = await updateAnalysisById(id, analysis);
    if (result) return NextResponse.json({ success: true });
    return NextResponse.json({ success: false, error: "업데이트 실패" }, { status: 500 });
  } catch (error) {
    console.error("Patch analysis error:", error);
    return NextResponse.json({ success: false, error: "업데이트 실패" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // 인증 필수
    const { createServerClient } = await import("@supabase/ssr");
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { getUserAnalysisHistory } = await import("@/lib/song-analysis-db");
    const analyses = await getUserAnalysisHistory(user.id);
    return NextResponse.json({ success: true, data: analyses, count: analyses.length });
  } catch (error) {
    console.error("Get cached analyses error:", error);
    return NextResponse.json({ success: false, error: "캐시 조회 실패" }, { status: 500 });
  }
}
