/**
 * analyze-song-v2/route.ts — 전면 개편
 *
 * Phase 0: Perplexity + 학술논문 + IMSLP Vision 병렬
 * Phase 2: 2-A(사고) + 2-B(생성) 분리
 * Phase 3: description 4문장, harmony_table 조건부
 * Phase 4b: 섹션 데이터 객체 주입
 * 어드민(ADMIN_EMAILS) rate limit 무제한 + 캐시 무시
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";
import { z } from "zod";
import {
  createReferenceSearchPrompt,
  createPhase1Prompt,
  createPhase2APrompt,
  createPhase2BPrompt,
  createPhase3Prompt,
  createPhase4aPrompt,
  createPhase4bPrompt,
  buildLockedFactsBlock,
  buildSectionsForRoutine,
  getInstrumentAgent,
  KOREAN_OUTPUT_RULE,
  type SectionForRoutine,
} from "@/lib/analysis-prompts";
import { searchAcademicSources } from "@/lib/phase0-academic";
import { getScoreFactsFromIMSLP } from "@/lib/imslp-vision-pipeline";
import { getCachedAnalysis, saveCachedAnalysis, addToUserHistory } from "@/lib/song-analysis-db";
import { checkRateLimit } from "@/lib/rate-limiters";
import { getClientIdentifier, rateLimitResponse } from "@/lib/api-utils";
import { supabaseServer } from "@/lib/supabase-server";
import type { SongAnalysis, AnalyzeSongResponse } from "@/types/song-analysis";

// ════════════════════════════════════════════════════════
// 설정
// ════════════════════════════════════════════════════════

export const maxDuration = 300;

// ── Zod 요청 스키마 ──
const AnalyzeSongRequestSchema = z.object({
  composer: z.string().min(1, "작곡가는 필수입니다.").max(100),
  title: z.string().min(1, "곡 제목은 필수입니다.").max(200),
  instrument: z.string().max(50).optional().default("piano"),
  forceRefresh: z.boolean().optional().default(false),
});

const ADMIN_EMAILS = new Set([
  "jisoo@withsempre.com",
  "a01056014453@gmail.com",
]);

type AnalysisInstrument = string;

/** Pro 사용자 확인 (profiles.subscription_tier) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isProUser(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data } = await (supabaseServer as any)
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();
    return data?.subscription_tier === "pro";
  } catch { return false; }
}

// ════════════════════════════════════════════════════════
// GPT / Perplexity 호출 헬퍼
// ════════════════════════════════════════════════════════

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getPerplexityClient(): OpenAI | null {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key, baseURL: "https://api.perplexity.ai" });
}

async function callGPT(
  openai: OpenAI,
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature,
  });
  return res.choices[0]?.message?.content ?? "";
}

async function callPerplexity(prompt: string, maxTokens = 3000): Promise<string | null> {
  const client = getPerplexityClient();
  if (!client) return null;
  try {
    const res = await client.chat.completions.create({
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    });
    return res.choices[0]?.message?.content ?? null;
  } catch (e) {
    console.error("[Perplexity] 호출 실패:", e);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeParseJSON(text: string, openai: OpenAI, phase: string): Promise<any> {
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fallback */ }
    }
    console.warn(`[${phase}] JSON 파싱 실패, GPT 재시도`);
    try {
      const fix = await callGPT(openai, `Fix this JSON and return ONLY valid JSON:\n${text.slice(0, 3000)}`, 2000, 0);
      const clean2 = fix.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(clean2);
    } catch {
      return {};
    }
  }
}

// ════════════════════════════════════════════════════════
// 교차검증
// ════════════════════════════════════════════════════════

async function crossVerifyMeta(
  meta: { composer: string; title: string; opus: string; key: string }
): Promise<{ composer: string; title: string; opus: string; key: string }> {
  const client = getPerplexityClient();
  if (!client) return meta;

  const verified = { ...meta };
  const targets: Array<{ field: "opus" | "key"; value: string }> = [];
  if (meta.opus) targets.push({ field: "opus", value: meta.opus });
  if (meta.key) targets.push({ field: "key", value: meta.key });

  await Promise.allSettled(
    targets.map(async ({ field, value }) => {
      const result = await callPerplexity(
        `Verify: ${meta.composer} "${meta.title}" ${field}="${value}". Reply CONFIRMED, INCORRECT, or UNVERIFIABLE only.`,
        512
      );
      if (result?.trim().toUpperCase().startsWith("INCORRECT")) {
        verified[field] = "";
      }
    })
  );

  return verified;
}

// ════════════════════════════════════════════════════════
// YouTube 검색
// ════════════════════════════════════════════════════════

async function searchYoutubeUrls(
  composer: string,
  title: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  performances: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || performances.length === 0) return performances;

  const results = await Promise.allSettled(
    performances.map(async (perf: { artist: string; youtube_url?: string }) => {
      if (perf.youtube_url && perf.youtube_url.startsWith("http")) return perf;
      try {
        const q = `${perf.artist} ${composer} ${title}`;
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=1&key=${apiKey}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return { ...perf, youtube_url: "" };
        const data = await res.json();
        const vid = data.items?.[0]?.id?.videoId;
        return { ...perf, youtube_url: vid ? `https://www.youtube.com/watch?v=${vid}` : "" };
      } catch { return { ...perf, youtube_url: "" }; }
    })
  );

  return performances.map((p, i) => {
    const r = results[i];
    return r.status === "fulfilled" ? r.value : { ...p, youtube_url: "" };
  });
}

// ════════════════════════════════════════════════════════
// POST 핸들러
// ════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ── 인증 ──
    let authUserId: string | null = null;
    let authEmail: string | null = null;
    try {
      const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
      );
      const { data: { user } } = await supabaseAuth.auth.getUser();
      authUserId = user?.id ?? null;
      authEmail = user?.email ?? null;
    } catch { /* 비인증 허용 */ }

    // 내부 호출 인증 (cron, start/route.ts 전용) — rate limit 완전 우회
    // 환경변수 미설정이면 내부 호출 불가 (빈 문자열 비교 방지)
    const envInternalSecret = process.env.INTERNAL_CALL_SECRET ?? "";
    const envCronSecret = process.env.CRON_SECRET ?? "";

    const internalSecret = request.headers.get("x-internal-call") ?? "";
    const cronAuth = request.headers.get("authorization") ?? "";

    const isInternalCall =
      (envInternalSecret.length >= 16 && internalSecret === envInternalSecret) ||
      (envCronSecret.length >= 1 && cronAuth === `Bearer ${envCronSecret}`);

    if (isInternalCall) {
      console.log("[INTERNAL] 내부 호출 rate limit 우회");
    }

    const isAdmin = isInternalCall || (authEmail ? ADMIN_EMAILS.has(authEmail.toLowerCase()) : false);
    const proUser = isAdmin || await isProUser(authUserId);

    // ── Rate Limit (어드민 무제한, Pro 하루5회, Free 하루1회) ──
    if (!isAdmin) {
      const identifier = getClientIdentifier(request);
      const tier = proUser ? "pro" : "free";
      const allowed = checkRateLimit(identifier, tier);
      if (!allowed) {
        const msg = proUser
          ? "Pro 플랜 일일 한도(5회)를 초과했습니다."
          : "곡 분석은 하루에 1회만 가능합니다. 내일 다시 시도해주세요.";
        return NextResponse.json({ success: false, error: msg } as AnalyzeSongResponse, { status: 429 });
      }
    } else {
      console.log(`[Admin] ${authEmail} — rate limit 무제한`);
    }

    // ── 요청 파싱 + Zod 검증 ──
    const rawBody = await request.json();
    const parsed = AnalyzeSongRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "요청 형식이 잘못되었습니다." } as AnalyzeSongResponse,
        { status: 400 }
      );
    }
    const { composer, title, instrument, forceRefresh } = parsed.data;

    // ── 캐시 확인 ──
    // 어드민: 항상 재분석 / Pro: forceRefresh 허용 / Free: 캐시 강제
    // schema_version < 2 인 캐시는 구 파이프라인 결과 → 무조건 재분석
    const CURRENT_SCHEMA_VERSION = 2;
    const effectiveForceRefresh = isAdmin ? true : (proUser ? forceRefresh : false);
    if (!effectiveForceRefresh) {
      const cached = await getCachedAnalysis(composer, title);
      if (cached) {
        const cachedVersion = (cached as { schema_version?: number }).schema_version ?? 1;
        if (cachedVersion < CURRENT_SCHEMA_VERSION) {
          console.log(`[Cache STALE] ${composer} - ${title} | schema_version: ${cachedVersion} → 재분석`);
        } else {
          console.log(`[Cache HIT] ${composer} - ${title} | schema_version: ${cachedVersion}`);
          return NextResponse.json({ success: true, data: cached, cached: true } as AnalyzeSongResponse);
        }
      }
    }

    console.log(`[Analysis START] ${composer} - ${title} (${instrument}) | admin: ${isAdmin}`);

    const openai = getOpenAI();

    // ══════════════════════════════════════════════════════
    // Phase 0: 3개 병렬
    // ══════════════════════════════════════════════════════

    console.log("[Phase 0] 병렬 시작");

    const [perplexityResult, academicResult, visionResult] = await Promise.allSettled([
      // Perplexity
      (async () => {
        const prompt = createReferenceSearchPrompt(composer, title, instrument);
        return await callPerplexity(prompt) ?? "";
      })(),
      // 학술 논문
      searchAcademicSources(composer, title).catch((e) => {
        console.warn("[Academic] 실패:", e);
        return { papers: [], has_academic_source: false, primary_paper: null, academic_prompt_injection: "" };
      }),
      // IMSLP Vision
      getScoreFactsFromIMSLP(composer, title, process.env.OPENAI_API_KEY!).catch((e) => {
        console.warn("[Vision] 실패:", e);
        return { facts: null, lockedFactsBlock: "", imslpUrl: null };
      }),
    ]);

    const referenceData = perplexityResult.status === "fulfilled" ? perplexityResult.value : "";
    const academic = academicResult.status === "fulfilled" ? academicResult.value : { academic_prompt_injection: "", papers: [] };
    const vision = visionResult.status === "fulfilled" ? visionResult.value : { facts: null, lockedFactsBlock: "", imslpUrl: null };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const academicInjection = (academic as any).academic_prompt_injection ?? "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paperCount = (academic as any).papers?.length ?? 0;

    console.log(`[Phase 0] 완료 — 논문: ${paperCount}개 | Vision: ${vision.facts ? "성공" : "없음"}`);

    // ══════════════════════════════════════════════════════
    // Phase 1: 곡 개요
    // ══════════════════════════════════════════════════════

    const visionForLocked = vision.facts ? {
      overall_key: vision.facts.locked.overall_key,
      movements: vision.facts.locked.movements,
      confidence: vision.facts.confidence,
    } : null;
    const initialLockedFacts = buildLockedFactsBlock(composer, title, "", "", visionForLocked);

    console.log("[Phase 1] 곡 개요 시작");
    const phase1Prompt = createPhase1Prompt(composer, title, initialLockedFacts, referenceData, instrument);
    const phase1Raw = await callGPT(openai, phase1Prompt, 2000, 0.1);
    const phase1 = await safeParseJSON(phase1Raw, openai, "Phase 1");

    const meta = phase1.meta ?? {};
    let confirmedComposer = meta.composer ?? composer;
    let confirmedTitle = meta.title ?? title;
    let confirmedOpus = meta.opus ?? "";
    let confirmedKey = meta.key ?? "";

    // Vision 조성 우선
    if (vision.facts?.locked?.overall_key) {
      confirmedKey = vision.facts.locked.overall_key;
      console.log(`[LOCKED] Vision 조성: ${confirmedKey}`);
    }

    // ── 교차검증 ──
    const verified = await crossVerifyMeta({
      composer: confirmedComposer,
      title: confirmedTitle,
      opus: confirmedOpus,
      key: confirmedKey,
    });
    confirmedOpus = verified.opus || confirmedOpus;
    if (!vision.facts?.locked?.overall_key) {
      confirmedKey = verified.key || confirmedKey;
    }

    const lockedFactsBlock = buildLockedFactsBlock(
      confirmedComposer, confirmedTitle, confirmedOpus, confirmedKey,
      visionForLocked
    );

    // verified_recordings 추출
    let verifiedRecordings: Array<{ artist: string; year: number; label?: string }> = [];
    try {
      const recMatch = referenceData.match(/"verified_recordings"\s*:\s*(\[[\s\S]*?\])/);
      if (recMatch) verifiedRecordings = JSON.parse(recMatch[1]);
    } catch { /* 무시 */ }

    // ══════════════════════════════════════════════════════
    // Phase 2: 2-A + 2-B
    // ══════════════════════════════════════════════════════

    console.log("[Phase 2-A] 사고 단계 시작");
    const phase2APrompt = createPhase2APrompt(
      confirmedComposer, confirmedTitle, confirmedOpus, instrument,
      lockedFactsBlock, referenceData, academicInjection
    );
    const phase2AThinking = await callGPT(openai, phase2APrompt, 2000, 0.7);
    console.log("[Phase 2-A] 완료");

    console.log("[Phase 2-B] 콘텐츠 생성 시작");
    const phase2BPrompt = createPhase2BPrompt(
      confirmedComposer, confirmedTitle, confirmedOpus, instrument,
      lockedFactsBlock, phase2AThinking, getInstrumentAgent(instrument)
    );
    const phase2BRaw = await callGPT(openai, phase2BPrompt, 4000, 0.3);
    const phase2 = await safeParseJSON(phase2BRaw, openai, "Phase 2-B");
    console.log("[Phase 2-B] 완료");

    // ══════════════════════════════════════════════════════
    // Phase 3: 구조/화성
    // ══════════════════════════════════════════════════════

    const hasScore = !!(vision.facts && vision.facts.confidence !== "low" && vision.facts.locked.movements.length > 0);

    console.log("[Phase 3] 구조/화성 시작");
    const phase3Prompt = createPhase3Prompt(
      confirmedComposer, confirmedTitle, confirmedOpus,
      instrument, lockedFactsBlock, referenceData,
      { composer: confirmedComposer, title: confirmedTitle, opus: confirmedOpus, key: confirmedKey }
    );
    const phase3Raw = await callGPT(openai, phase3Prompt, 6000, 0.1);
    const phase3 = await safeParseJSON(phase3Raw, openai, "Phase 3");

    const structV2 = phase3.structure_analysis_v2 ?? phase3;
    const sections: Array<{
      section: string; measures: string; key_signature: string;
      time_signature: string; tempo: string; mood: string; description: string;
    }> = Array.isArray(structV2.sections) ? structV2.sections : [];

    console.log(`[Phase 3] 완료: ${sections.length} sections`);

    // ══════════════════════════════════════════════════════
    // Phase 4a: 연습법
    // ══════════════════════════════════════════════════════

    const sectionNames = sections.map((s) => s.section);

    console.log("[Phase 4a] 연습법 시작");
    const phase4aPrompt = createPhase4aPrompt(
      confirmedComposer, confirmedTitle, confirmedOpus,
      sectionNames, referenceData, instrument
    );
    const phase4aRaw = await callGPT(openai, phase4aPrompt, 4000, 0.3);
    const phase4a = await safeParseJSON(phase4aRaw, openai, "Phase 4a");
    console.log("[Phase 4a] 완료");

    // ══════════════════════════════════════════════════════
    // Phase 4b: 4주 루틴
    // ══════════════════════════════════════════════════════

    const sectionsForRoutine: SectionForRoutine[] = buildSectionsForRoutine(sections);

    console.log("[Phase 4b] 4주 루틴 시작");
    const phase4bPrompt = createPhase4bPrompt(
      confirmedComposer, confirmedTitle, confirmedOpus,
      sectionsForRoutine, referenceData, instrument
    );
    const phase4bRaw = await callGPT(openai, phase4bPrompt, 6000, 0.3);
    const phase4b = await safeParseJSON(phase4bRaw, openai, "Phase 4b");
    console.log("[Phase 4b] 완료");

    // ══════════════════════════════════════════════════════
    // YouTube + 결과 조립
    // ══════════════════════════════════════════════════════

    let performances = Array.isArray(phase4a.recommended_performances_v2) ? phase4a.recommended_performances_v2 : [];
    performances = await searchYoutubeUrls(confirmedComposer, confirmedTitle, performances);

    const analysis: SongAnalysis = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      meta: {
        composer: confirmedComposer,
        title: confirmedTitle,
        opus: confirmedOpus,
        key: confirmedKey,
        difficulty_level: meta.difficulty_level ?? "Intermediate",
      },
      content: {
        // V2
        song_overview: phase1.song_overview ?? {},
        composer_life: phase2.composer_life ?? {},
        historical_background: phase2.historical_background ?? {},
        song_characteristics: phase2.song_characteristics ?? {},
        structure_analysis_v2: {
          movements: structV2.movements ?? [],
          sections,
          harmony_table: structV2.harmony_table ?? [],
        },
        practice_method: {
          technique_summary: phase4a.technique_summary ?? [],
          section_guides: phase4a.section_guides ?? [],
          weekly_routine: phase4b.weekly_routine ?? [],
        },
        recommended_performances_v2: performances,
        // V1 호환
        composer_background: phase2.composer_life?.summary ?? "",
        historical_context: phase2.historical_background?.era_characteristics ?? "",
        work_background: phase2.song_characteristics?.composition_background ?? "",
        structure_analysis: sections.map((s) => ({
          section: s.section, measures: s.measures ?? "",
          key_tempo: `${s.key_signature} | ${s.tempo}`,
          character: s.mood, description: s.description,
        })),
        technique_tips: [],
        musical_interpretation: phase2.song_characteristics?.literary_dramatic ?? "",
        recommended_performances: performances.map((p: { artist: string; year: string; comment: string }) => ({
          artist: p.artist, year: p.year, comment: p.comment,
        })),
      },
      verification_status: hasScore ? "Verified" : "Needs Review",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      schema_version: 2,
    };

    // ── DB 저장 ──
    await saveCachedAnalysis(analysis, composer, title).catch((e) =>
      console.error("[DB] 저장 실패:", e)
    );

    // 유저 보관함에 기록
    if (authUserId && analysis.id) {
      await addToUserHistory(authUserId, analysis.id).catch((e) =>
        console.error("[DB] 히스토리 저장 실패:", e)
      );
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Analysis DONE] ${confirmedComposer} - ${confirmedTitle} | ${elapsed}s | admin: ${isAdmin} | papers: ${paperCount}`);

    return NextResponse.json({ success: true, data: analysis, cached: false } as AnalyzeSongResponse);

  } catch (err) {
    console.error("[analyze-song-v2] 오류:", err);
    const message = err instanceof Error ? err.message : "알 수 없는 오류";

    if (message.includes("429") || message.includes("rate")) {
      return NextResponse.json({ success: false, error: "AI 서버가 바쁩니다. 1-2분 후 다시 시도해주세요." } as AnalyzeSongResponse, { status: 429 });
    }

    return NextResponse.json({ success: false, error: "곡 분석 중 오류가 발생했습니다." } as AnalyzeSongResponse, { status: 500 });
  }
}
