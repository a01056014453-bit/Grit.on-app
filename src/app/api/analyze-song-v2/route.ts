/**
 * analyze-song-v2/route.ts — 전면 개편
 *
 * V2 파이프라인 (기존):
 *   Phase 0: Perplexity + 학술논문 + IMSLP Vision 병렬
 *   Phase 2: 2-A(사고) + 2-B(생성) 분리
 *   Phase 3: description 4문장, harmony_table 조건부
 *   Phase 4b: 섹션 데이터 객체 주입
 *
 * V3 파이프라인 (신규 — analysisVersion: 3):
 *   Phase 0: 동일 (Perplexity + IMSLP Vision 재사용)
 *   Phase A: Meta/Facts — 작품 식별 + work_type + verified_facts
 *   Phase B: Coaching — summary + demands + challenges + pitfalls + plan
 *   Phase C: Guides + Recordings — movement/collection guides + 추천 음반
 *
 * 어드민(ADMIN_USER_IDS) rate limit 무제한 + 캐시 무시
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
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
import {
  createV3MetaPrompt,
  createV3CoachingPrompt,
  createV3GuidesPrompt,
  inferWorkTypeHint,
} from "@/lib/analysis-prompts-v3";
import {
  buildV3SourceBundle,
  buildCoachingSourceBlock,
  buildGuidesSourceBlock,
  type V3SourceBundle,
} from "@/lib/phase0-v3";
import { searchAcademicSources } from "@/lib/phase0-academic";
import { getScoreFactsFromIMSLP, getImslpRichBlock } from "@/lib/imslp-vision-pipeline";
import { getCachedAnalysis, saveCachedAnalysis, addToUserHistory } from "@/lib/song-analysis-db";
import { validateAnalysisOutput, validateAnalysisOutputV3 } from "@/lib/analysis-validation";
import { checkRateLimit } from "@/lib/rate-limiters";
import { getClientIdentifier, rateLimitResponse } from "@/lib/api-utils";
import { supabaseServer } from "@/lib/supabase-server";
import type { SongAnalysis, AnalyzeSongResponse } from "@/types/song-analysis";
import type {
  SongAnalysisV3,
  AnalysisContentV3,
  CanonicalWorkRef,
  VerifiedFact,
  WorkType,
  TechnicalDemand,
  MusicalChallenge,
  Pitfall,
  PracticePlan,
  WorkSummary,
  RecommendedRecording,
  MovementGuide,
  CollectionPieceGuide,
} from "@/types/song-analysis";

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
  /** V3 파이프라인 사용 — 3이면 V3, 미지정이면 기존 V2 */
  analysisVersion: z.literal(3).optional(),
});

/** 어드민 user ID — ADMIN_USER_IDS 환경변수와 동일 체계 */
function getAdminIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  );
}

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

/** gpt-4o-mini — 사고 단계 등 비용 절감용 (gpt-4o 대비 ~15배 저렴) */
async function callGPTMini(
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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

// ════════════════════════════════════════════════════════
// Claude 호출 헬퍼
// ════════════════════════════════════════════════════════

function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const CLAUDE_SYSTEM_PROMPT = `당신은 클래식 음악 연습 코치이자 음악학 박사입니다.

🚨 출력 규칙:
- 반드시 유효한 JSON만 출력하십시오. JSON 외 텍스트, 마크다운, 설명 절대 금지.
- 모든 텍스트는 한국어로 작성하십시오. 음악 용어·고유명사만 원어 병기 가능.
- 확인되지 않은 마디 번호, 화성, 연도를 추측하지 마십시오.
- "베토벤은 고전과 낭만을 잇는 다리" 같은 백과사전 문장 금지.
- "팔 무게를 사용하세요", "프레이즈를 살려서" 같은 범용 조언 금지.
- "손목 이완", "성부 간 밸런스", "다이내믹 조절" 같은 어떤 곡에나 적용되는 일반 조언 금지.
- 이 곡의 어떤 구간에서 어떤 음형/패턴 때문에 어려운지 특정하여 서술하십시오.
- 반복 금지. 모든 항목의 내용이 서로 달라야 합니다.`;

/** Claude 호출 → JSON 파싱 */
async function callClaudeJson(
  userPrompt: string,
  maxTokens: number,
  temperature: number,
  phase: string,
): Promise<Record<string, unknown>> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    temperature,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = res.content.find((b) => b.type === "text");
  const raw = textBlock?.type === "text" ? textBlock.text : "";
  if (!raw) {
    throw new Error(`[${phase}] Claude 응답 비어있음`);
  }

  try {
    // JSON 블록 추출 (마크다운 코드블록 또는 순수 JSON)
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    console.error(`[${phase}] Claude JSON 파싱 실패:`, raw.slice(0, 300));
    throw new Error(`[${phase}] Claude JSON 파싱 실패`);
  }
}

/** Perplexity로 분석 쿼리 → 자유 텍스트 결과 */
async function callPerplexityAnalysis(
  prompt: string,
  maxTokens = 4000,
): Promise<string> {
  const client = getPerplexityClient();
  if (!client) return "";
  try {
    const res = await client.chat.completions.create({
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    });
    return res.choices[0]?.message?.content ?? "";
  } catch (e) {
    console.error("[Perplexity Analysis] 호출 실패:", e instanceof Error ? e.message : e);
    return "";
  }
}

/** Perplexity 분석 → JSON 파싱. 실패 시 GPT로 JSON 수리 */
async function callPerplexityJson(
  prompt: string,
  maxTokens: number,
  phase: string,
): Promise<Record<string, unknown>> {
  const raw = await callPerplexityAnalysis(
    `${V3_SYSTEM_PROMPT}\n\n${prompt}`,
    maxTokens,
  );
  if (!raw) throw new Error(`[${phase}] Perplexity 응답 비어있음`);

  // JSON 파싱 시도
  try {
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    // JSON 파싱 실패 → GPT로 수리만
    console.warn(`[${phase}] Perplexity JSON 파싱 실패, GPT 수리 시도`);
    try {
      const openai = getOpenAI();
      const fix = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Fix the following text into valid JSON. Return ONLY the JSON object, nothing else." },
          { role: "user", content: raw.slice(0, 15000) },
        ],
        max_tokens: maxTokens,
        temperature: 0,
        response_format: { type: "json_object" },
      });
      const fixed = fix.choices[0]?.message?.content ?? "";
      return JSON.parse(fixed) as Record<string, unknown>;
    } catch (e2) {
      console.error(`[${phase}] GPT JSON 수리도 실패:`, e2);
      throw new Error(`[${phase}] JSON 파싱 실패`);
    }
  }
}

// ════════════════════════════════════════════════════════
// V3 전용: structured output 헬퍼 (Legacy GPT — V2용)
// ════════════════════════════════════════════════════════

const V3_SYSTEM_PROMPT = `당신은 클래식 음악 연습 코치이자 음악학 박사입니다.

🚨 출력 규칙:
- 반드시 유효한 JSON만 출력하십시오. JSON 외 텍스트, 마크다운, 설명 절대 금지.
- 모든 텍스트는 한국어로 작성하십시오. 음악 용어·고유명사만 원어 병기 가능.
- 확인되지 않은 마디 번호, 화성, 연도를 추측하지 마십시오.
- 난이도(difficulty)나 난이도 라벨은 생성하지 마십시오.

🚨 품질 규칙 — 위반 시 분석 실패:
- "손목 경직", "손목 이완", "성부 간 밸런스", "다이내믹 조절", "감정적 깊이" 같은 범용 표현 절대 금지.
- "팔 무게를 사용하세요", "프레이즈를 살려서", "감정을 담아서" 같은 어떤 곡에도 적용되는 조언 금지.
- 모든 항목은 이 곡의 특정 소품/악장의 특정 구간에서 나타나는 고유한 문제를 다뤄야 함.
- 반복 금지. 모든 항목의 내용이 서로 달라야 합니다.
- 모음곡/소품집이면 반드시 모든 소품을 빠짐없이 다루십시오. 일부만 다루면 실패.

🚨 전문가 분석 결과가 제공되면:
- 전문가 분석의 구체적 내용(특정 소품, 특정 음형, 특정 패시지)을 반드시 반영하십시오.
- 전문가 분석을 무시하고 자체적으로 범용 내용을 생성하지 마십시오.
- 전문가 분석에 없는 빈 자리를 "손목 이완" 같은 범용 조언으로 채우지 마십시오.`;

/** V3 전용 GPT 호출 — response_format: json_object + system prompt */
async function callGPTJson(
  openai: OpenAI,
  userPrompt: string,
  maxTokens: number,
  temperature: number,
  phase: string,
): Promise<Record<string, unknown>> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: V3_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature,
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content;
  if (!raw) {
    throw new Error(`[${phase}] GPT 응답 비어있음`);
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // response_format: json_object이므로 파싱 실패는 극히 드묾
    console.error(`[${phase}] JSON 파싱 실패 (structured output에서):`, raw.slice(0, 200));
    throw new Error(`[${phase}] JSON 파싱 실패`);
  }
}

// ════════════════════════════════════════════════════════
// Legacy: safeParseJSON (V1/V2 전용)
// ════════════════════════════════════════════════════════

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
// GET 핸들러 — 분석 목록 조회 (어드민용, service role)
// ════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // 어드민 인증 확인
    let isAdmin = false;
    try {
      const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
      );
      const { data: { user } } = await supabaseAuth.auth.getUser();
      isAdmin = !!(user?.id && getAdminIds().has(user.id));
    } catch (err) {
      console.error("[analyze-song-v2 GET] 어드민 인증 실패:", err);
    }

    if (!isAdmin) {
      return NextResponse.json({ success: false, data: [], error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseServer as any)
      .from("song_analyses")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[analyze-song-v2 GET] DB 조회 실패:", error.message);
      return NextResponse.json({ success: false, data: [], error: error.message });
    }

    // content에서 SongAnalysis 복원
    const analyses = (data ?? []).map((row: any) => {
      const content = row.content as Record<string, unknown>;
      if (content && content.meta && content.content) {
        const restored = content as unknown as SongAnalysis;
        restored.id = row.id;
        restored.created_at = row.created_at || restored.created_at;
        restored.updated_at = row.updated_at || restored.updated_at;
        if (!restored.schema_version) {
          const c = restored.content as unknown as Record<string, unknown>;
          restored.schema_version = (c && ("song_overview" in c || "composer_life" in c)) ? 2 : 1;
        }
        return restored;
      }
      return {
        id: row.id,
        meta: { composer: row.composer, title: row.title, opus: row.opus || "", key: row.key || "", difficulty_level: row.difficulty_level || "Intermediate" },
        content: content as unknown as SongAnalysis["content"],
        verification_status: row.verification_status || "Needs Review",
        created_at: row.created_at,
        updated_at: row.updated_at,
        schema_version: 1,
      } as SongAnalysis;
    });

    return NextResponse.json({ success: true, data: analyses });
  } catch (err) {
    console.error("[analyze-song-v2 GET] 서버 오류:", err);
    return NextResponse.json({ success: false, data: [], error: "서버 오류" });
  }
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
      (envCronSecret.length >= 16 && cronAuth === `Bearer ${envCronSecret}`);

    if (isInternalCall) {
      console.log("[INTERNAL] 내부 호출 rate limit 우회");
    }

    const isAdmin = isInternalCall || (authUserId ? getAdminIds().has(authUserId) : false);
    const proUser = isAdmin || await isProUser(authUserId);

    // ── Rate Limit (어드민 무제한, Pro 하루5회, Free 하루1회, 로컬 dev 무제한) ──
    const isDev = process.env.NODE_ENV === "development";
    if (!isAdmin && !isDev) {
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
      console.log(`[Admin] ${authUserId} — rate limit 무제한`);
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
    const { composer, title, instrument, forceRefresh, analysisVersion } = parsed.data;
    const useV3 = analysisVersion === 3;
    console.log(`[Analyze] parsed | composer=${composer} | title=${title} | analysisVersion=${analysisVersion ?? "undefined"} | useV3=${useV3} | internal=${isInternalCall} | admin=${isAdmin}`);

    // ── 캐시 확인 ──
    // 어드민: 항상 재분석 / Pro: forceRefresh 허용 / Free: 캐시 강제
    // V3 요청 시 CURRENT_SCHEMA_VERSION을 3으로 설정하여 V2 캐시를 stale 처리
    const CURRENT_SCHEMA_VERSION = useV3 ? 3 : 2;
    const effectiveForceRefresh = isAdmin ? true : (proUser ? forceRefresh : false);
    if (!effectiveForceRefresh) {
      const cached = await getCachedAnalysis(composer, title);
      if (cached) {
        // V3는 schema_version: 3 (required), legacy는 optional
        const cachedVersion = "schema_version" in cached
          ? (cached.schema_version as number ?? 1)
          : 1;
        if (cachedVersion < CURRENT_SCHEMA_VERSION) {
          console.log(`[Cache STALE] ${composer} - ${title} | schema_version: ${cachedVersion} → 재분석`);
        } else {
          console.log(`[Cache HIT] ${composer} - ${title} | schema_version: ${cachedVersion}`);
          return NextResponse.json({ success: true, data: cached, cached: true });
        }
      }
    }

    console.log(`[Analysis START] ${composer} - ${title} (${instrument}) | admin: ${isAdmin}`);

    const openai = getOpenAI();

    // ══════════════════════════════════════════════════════
    // Phase 0: academic + vision 공통 + Perplexity V3/V2 분기
    // ══════════════════════════════════════════════════════

    console.log("[Phase 0] 시작");

    const [academicResult, visionResult] = await Promise.allSettled([
      searchAcademicSources(composer, title).catch((e) => {
        console.warn("[Academic] 실패:", e);
        return { papers: [], has_academic_source: false, primary_paper: null, academic_prompt_injection: "" };
      }),
      getScoreFactsFromIMSLP(composer, title, process.env.OPENAI_API_KEY!).catch((e) => {
        console.warn("[Vision] 실패:", e);
        return { facts: null, lockedFactsBlock: "", imslpUrl: null };
      }),
    ]);

    const academic = academicResult.status === "fulfilled" ? academicResult.value : { academic_prompt_injection: "", papers: [] };
    const vision = visionResult.status === "fulfilled" ? visionResult.value : { facts: null, lockedFactsBlock: "", imslpUrl: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const academicInjection = (academic as any).academic_prompt_injection ?? "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paperCount = (academic as any).papers?.length ?? 0;

    // V3: 구조화된 소스 번들 (Perplexity 3쿼리 + composer_resources DB)
    let v3Bundle: V3SourceBundle | null = null;
    let referenceData = "";
    let referenceDataCompact = "";

    if (useV3) {
      v3Bundle = await buildV3SourceBundle({
        composer, title, instrument,
        perplexityApiKey: process.env.PERPLEXITY_API_KEY ?? "",
        openaiApiKey: process.env.OPENAI_API_KEY ?? "",
        academicInjection,
        hasPapers: paperCount > 0,
      });
      referenceData = v3Bundle.perplexity.raw;
      referenceDataCompact = referenceData.slice(0, 8000);
      console.log(`[Phase 0] V3 번들 완료 — curated:${v3Bundle.curated.resourceCount}건 | 논문:${paperCount}개 | Vision:${vision.facts ? "성공" : "없음"}`);
    } else {
      // V2: 기존 단일 Perplexity 쿼리
      const perplexityResult = await (async () => {
        const prompt = createReferenceSearchPrompt(composer, title, instrument);
        return await callPerplexity(prompt) ?? "";
      })().catch(() => "");
      referenceData = perplexityResult;
      referenceDataCompact = referenceData.slice(0, 8000);
      console.log(`[Phase 0] V2 완료 — 논문:${paperCount}개 | Vision:${vision.facts ? "성공" : "없음"}`);
    }

    // ══════════════════════════════════════════════════════
    // V3 파이프라인 분기
    // ══════════════════════════════════════════════════════

    if (useV3) {
      const v3Result = await runV3Pipeline({
        composer, title, instrument,
        bundle: v3Bundle!,
        referenceData,
        vision,
        openai, isAdmin,
        authUserId,
        startTime,
      });

      if (!v3Result.success) {
        return NextResponse.json(
          { success: false, error: v3Result.error } as AnalyzeSongResponse,
          { status: 500 }
        );
      }

      // V3 품질 검증 — 실패 시 저장 금지
      const v3Analysis = v3Result.data!;
      const v3Validation = validateAnalysisOutputV3({ content: v3Analysis.content });
      if (!v3Validation.valid) {
        console.error("[V3 Validation] 검증 실패:", v3Validation.errors.join(", "));
        return NextResponse.json(
          { success: false, error: `V3 품질 검증 실패: ${v3Validation.errors[0]}` },
          { status: 422 }
        );
      }
      if (v3Validation.warnings.length > 0) {
        console.log("[V3 Validation] 경고:", v3Validation.warnings.join(", "));
      }

      // V3 결과 저장 — SongAnalysis 호환 형태로 래핑하여 기존 DB에 저장
      const v3ForDb: SongAnalysis = {
        id: v3Analysis.id,
        meta: {
          composer: v3Analysis.meta.work.composer_display,
          title: v3Analysis.meta.work.canonical_title,
          opus: v3Analysis.meta.work.opus_catalogue ?? "",
          key: v3Analysis.meta.work.key ?? "",
          difficulty_level: "Intermediate",  // V3는 difficulty 미생성 — DB 호환용 기본값
        },
        content: v3Analysis as unknown as SongAnalysis["content"],
        verification_status: v3Analysis.verification_status,
        created_at: v3Analysis.created_at,
        updated_at: v3Analysis.updated_at,
        schema_version: 3,
      };

      await saveCachedAnalysis(v3ForDb, composer, title).catch((e) =>
        console.error("[DB] V3 저장 실패:", e)
      );

      // saveCachedAnalysis가 v3ForDb.id를 DB의 실제 UUID로 교체함 → v3Analysis에도 반영
      v3Analysis.id = v3ForDb.id;
      console.log(`[V3] saved with DB id: ${v3ForDb.id}`);

      if (authUserId && v3ForDb.id && !isAdmin) {
        await addToUserHistory(authUserId, v3ForDb.id).catch((e) =>
          console.error("[DB] V3 히스토리 저장 실패:", e)
        );
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[V3 Analysis DONE] ${composer} - ${title} | ${elapsed}s | admin: ${isAdmin} | id: ${v3ForDb.id}`);

      return NextResponse.json({ success: true, data: v3Analysis, cached: false });
    }

    // ══════════════════════════════════════════════════════
    // Phase 1: 곡 개요 (기존 V2 파이프라인)
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
    // Phase 2-A는 사고 단계 — gpt-4o-mini로 비용 절감 (품질 차이 미미)
    const phase2AThinking = await callGPTMini(phase2APrompt, 2000, 0.7);
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
      instrument, lockedFactsBlock, referenceDataCompact,
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
      sectionNames, referenceDataCompact, instrument
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
      sectionsForRoutine, referenceDataCompact, instrument
    );
    const phase4bRaw = await callGPT(openai, phase4bPrompt, 8000, 0.3);
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

    // ── 품질 검증 ──
    const validation = validateAnalysisOutput(analysis);
    if (validation.errors.length > 0) {
      console.warn("[Analysis Validation] 에러:", validation.errors.join(", "));
    }
    if (validation.warnings.length > 0) {
      console.log("[Analysis Validation] 경고:", validation.warnings.join(", "));
    }

    // ── DB 저장 ──
    await saveCachedAnalysis(analysis, composer, title).catch((e) =>
      console.error("[DB] 저장 실패:", e)
    );

    // 유저 보관함에 기록 (어드민/Cron 분석은 제외 — 자동 분석이 사용자 보관함에 추가되는 것 방지)
    if (authUserId && analysis.id && !isAdmin) {
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

// ════════════════════════════════════════════════════════
// V3 파이프라인
// ════════════════════════════════════════════════════════

interface V3PipelineInput {
  composer: string;
  title: string;
  instrument: string;
  bundle: V3SourceBundle;
  referenceData: string;
  vision: {
    facts: { locked: { overall_key: string | null; movements: unknown[] }; confidence: string } | null;
    lockedFactsBlock: string;
    imslpUrl: string | null;
  };
  openai: OpenAI;
  isAdmin: boolean;
  authUserId: string | null;
  startTime: number;
}

interface V3PipelineResult {
  success: boolean;
  data?: SongAnalysisV3;
  error?: string;
}

async function runV3Pipeline(input: V3PipelineInput): Promise<V3PipelineResult> {
  const {
    composer, title, instrument,
    bundle, referenceData,
    vision,
    openai,
  } = input;

  try {
    // ── Vision locked block (Phase 0에서 재사용) ──
    const visionForLocked = vision.facts ? {
      overall_key: vision.facts.locked.overall_key,
      movements: vision.facts.locked.movements as Array<{
        number: number; tempo_marking: string | null;
        key: string | null; time_signature: string | null;
      }>,
      confidence: vision.facts.confidence,
    } : null;
    const visionLockedBlock = buildLockedFactsBlock(composer, title, "", "", visionForLocked);

    // ══════════════════════════════════════════════════════
    // IMSLP 확장 메타데이터 (V3 전용)
    // ══════════════════════════════════════════════════════

    console.log("[V3] IMSLP 리치 메타데이터 조회 시작");
    const { block: imslpRichBlock } = await getImslpRichBlock(composer, title);
    if (imslpRichBlock) {
      console.log(`[V3] IMSLP 리치 메타데이터 확보: ${imslpRichBlock.length}자`);
    } else {
      console.log("[V3] IMSLP 리치 메타데이터 없음 → Perplexity 데이터만 사용");
    }

    // ══════════════════════════════════════════════════════
    // Phase A: Meta / Facts (Claude)
    // ══════════════════════════════════════════════════════

    console.log("[V3 Phase A] Meta/Facts 시작 (Claude)");
    const phaseARefData = imslpRichBlock
      ? `${referenceData}\n\n${imslpRichBlock}`
      : referenceData;
    const phaseAPrompt = createV3MetaPrompt(
      composer, title, instrument, phaseARefData, visionLockedBlock
    );
    const phaseA = await callPerplexityJson(phaseAPrompt, 3000, "V3-A");

    // DEBUG: Phase A 원문 확인
    console.log("[V3 Phase A RAW]", JSON.stringify(phaseA, null, 2).slice(0, 2000));

    // work 추출 + 안전한 기본값
    const rawWork = (phaseA.work ?? {}) as Record<string, unknown>;
    const work: CanonicalWorkRef = {
      composer_display: String(rawWork.composer_display ?? composer),
      composer_normalized: String(rawWork.composer_normalized ?? composer.toLowerCase().split(" ").pop() ?? composer.toLowerCase()),
      canonical_title: String(rawWork.canonical_title ?? title),
      subtitle: rawWork.subtitle ? String(rawWork.subtitle) : undefined,
      opus_catalogue: rawWork.opus_catalogue ? String(rawWork.opus_catalogue) : undefined,
      work_number: typeof rawWork.work_number === "number" ? rawWork.work_number : undefined,
      key: String(rawWork.key || vision.facts?.locked?.overall_key || ""),
      source_work_id: rawWork.source_work_id ? String(rawWork.source_work_id) : undefined,
    };

    const workType: WorkType = (
      ["single_movement_piece", "multi_movement_sonata", "suite_or_collection", "variation_set", "unknown"]
        .includes(String(phaseA.work_type))
        ? String(phaseA.work_type)
        : inferWorkTypeHint(title, referenceData)
    ) as WorkType;

    const verifiedFacts: VerifiedFact[] = Array.isArray(phaseA.verified_facts)
      ? (phaseA.verified_facts as Record<string, unknown>[]).map((f) => ({
          label: String(f.label ?? ""),
          value: String(f.value ?? ""),
          source: (["IMSLP", "MusicXML", "Manual", "Model-Inferred"].includes(String(f.source)) ? String(f.source) : "Model-Inferred") as VerifiedFact["source"],
          confidence: (["high", "medium", "low"].includes(String(f.confidence)) ? String(f.confidence) : "low") as VerifiedFact["confidence"],
        }))
      : [];

    if (!work.canonical_title || !workType) {
      throw new Error("[V3-A] 필수 필드 누락: canonical_title 또는 work_type");
    }

    // work 객체에서 자명한 사실을 verified_facts에 자동 보충
    const existingLabels = new Set(verifiedFacts.map((f) => f.label));
    if (work.key && !existingLabels.has("조성")) {
      verifiedFacts.push({ label: "조성", value: work.key, source: "Model-Inferred", confidence: "medium" });
    }
    if (work.opus_catalogue && !existingLabels.has("작품번호")) {
      verifiedFacts.push({ label: "작품번호", value: work.opus_catalogue, source: "Model-Inferred", confidence: "medium" });
    }

    console.log(`[V3 Phase A] 완료 — work_type: ${workType}, facts: ${verifiedFacts.length}개`);

    // ══════════════════════════════════════════════════════
    // Phase B: Coaching Core (structured output)
    // ══════════════════════════════════════════════════════

    const verifiedFactsJson = JSON.stringify(verifiedFacts, null, 2);

    const coachingSourceBlock = buildCoachingSourceBlock(bundle);
    console.log(`[V3 Phase B] Coaching 시작 (Perplexity→Claude) — curated:${bundle.curated.hasCuratedData} | academic:${bundle.academic.hasPapers} | technical:${bundle.perplexity.technical.length}자`);

    // Step 1: Perplexity가 곡 특화 분석을 직접 수행
    const perplexityCoachingPrompt = `You are a world-class classical music performance coach and musicologist.

Composer: ${work.composer_display}
Title: ${work.canonical_title} ${work.opus_catalogue ?? ""}
Instrument: ${instrument}
Work type: ${workType}

Analyze this specific work in extreme detail for a ${instrument} student preparing to perform it.

CRITICAL RULES:
- Every point MUST be specific to THIS piece, THIS passage, THIS musical moment.
- NEVER write generic advice like "relax your wrist", "balance the voices", "control dynamics".
- If this is a multi-movement work or collection (like Kreisleriana), analyze EACH movement/piece SEPARATELY with its unique challenges.

Provide:

1. TECHNICAL DEMANDS (at least 5):
For each, specify: which exact passage/section, what the specific notes/patterns/textures are, why it's hard (biomechanically), and the root cause.
Example: "In No.2, the rapid thirds in B♭ major require legato but sudden sfz interrupts break the flow — the root cause is that the hand must simultaneously sustain horizontal legato motion while delivering vertical accent force."

2. MUSICAL CHALLENGES (at least 4):
What interpretive decisions must be made? Reference specific performers and their approaches with concrete details.

3. COMMON PITFALLS (at least 4):
What specific mistakes do students make in THIS piece? Not generic mistakes — mistakes specific to this piece's unique passages.

4. PRACTICE PLAN (4-6 phases):
Each task must target a specific section/passage with concrete instructions. No "play through the whole piece" or "basic technique warmup".

5. SUMMARY:
One-liner identity of this work. Context a student needs before practicing. Structural overview. Composer's artistic intent.

${coachingSourceBlock ? `\nReference materials:\n${coachingSourceBlock}` : ""}
${imslpRichBlock ? `\nVerified IMSLP metadata (USE THIS — these are confirmed facts):\n${imslpRichBlock}` : ""}

Be extremely specific. Write in Korean. Music terminology can use original language.`;

    // Perplexity가 분석 + JSON 생성을 한 번에 수행
    const phaseBPrompt = createV3CoachingPrompt(
      work.composer_display,
      work.canonical_title,
      work.opus_catalogue ?? "",
      instrument,
      workType,
      verifiedFactsJson,
      coachingSourceBlock,
    );
    const phaseBFullPrompt = `${perplexityCoachingPrompt}

위 분석을 바탕으로 아래 JSON 형식으로 출력하십시오:

${phaseBPrompt}`;

    const phaseB = await callPerplexityJson(phaseBFullPrompt, 16000, "V3-B");

    // 필수 필드 추출 + 검증
    const rawSummary = phaseB.summary as Record<string, unknown> | undefined;
    if (!rawSummary || !rawSummary.one_liner) {
      throw new Error("[V3-B] 필수 필드 누락: summary.one_liner");
    }
    const summary: WorkSummary = {
      one_liner: String(rawSummary.one_liner),
      context_for_practice: String(rawSummary.context_for_practice ?? ""),
      structural_overview: String(rawSummary.structural_overview ?? ""),
      artistic_intent: String(rawSummary.artistic_intent ?? ""),
    };

    const technicalDemands: TechnicalDemand[] = Array.isArray(phaseB.technical_demands)
      ? (phaseB.technical_demands as Record<string, unknown>[]).map((d) => ({
          category: String(d.category ?? "other") as TechnicalDemand["category"],
          title: String(d.title ?? ""),
          description: String(d.description ?? ""),
          why_hard: d.why_hard ? String(d.why_hard) : undefined,
          root_cause: d.root_cause ? String(d.root_cause) : undefined,
          common_mistake: d.common_mistake ? String(d.common_mistake) : undefined,
          location: d.location ? String(d.location) : undefined,
          severity: (["critical", "major", "moderate"].includes(String(d.severity)) ? String(d.severity) : "moderate") as TechnicalDemand["severity"],
        }))
      : [];

    const musicalChallenges: MusicalChallenge[] = Array.isArray(phaseB.musical_challenges)
      ? (phaseB.musical_challenges as Record<string, unknown>[]).map((ch) => ({
          title: String(ch.title ?? ""),
          description: String(ch.description ?? ""),
          location: ch.location ? String(ch.location) : undefined,
          reference_interpretation: ch.reference_interpretation ? String(ch.reference_interpretation) : undefined,
        }))
      : [];

    const pitfalls: Pitfall[] = Array.isArray(phaseB.pitfalls)
      ? (phaseB.pitfalls as Record<string, unknown>[]).map((p) => ({
          title: String(p.title ?? ""),
          mistake: String(p.mistake ?? ""),
          cause: String(p.cause ?? ""),
          fix: String(p.fix ?? ""),
          location: p.location ? String(p.location) : undefined,
        }))
      : [];

    const rawPlan = phaseB.practice_plan as Record<string, unknown> | undefined;
    if (!rawPlan || !Array.isArray(rawPlan.phases) || rawPlan.phases.length === 0) {
      throw new Error("[V3-B] 필수 필드 누락: practice_plan.phases");
    }
    const practicePlan: PracticePlan = {
      estimated_duration: String(rawPlan.estimated_duration ?? "4-6주"),
      recommended_order: rawPlan.recommended_order ? String(rawPlan.recommended_order) : undefined,
      phases: (rawPlan.phases as Record<string, unknown>[]).map((ph) => ({
        phase: Number(ph.phase ?? 0),
        title: String(ph.title ?? ""),
        goal: String(ph.goal ?? ""),
        duration: String(ph.duration ?? ""),
        tasks: Array.isArray(ph.tasks)
          ? (ph.tasks as Record<string, unknown>[]).map((t) => ({
              instruction: String(t.instruction ?? ""),
              target: t.target ? String(t.target) : undefined,
              minutes: typeof t.minutes === "number" ? t.minutes : undefined,
              related_demand: t.related_demand ? String(t.related_demand) as TechnicalDemand["category"] : undefined,
            }))
          : [],
      })),
    };

    console.log(`[V3 Phase B] 완료 — demands: ${technicalDemands.length}, challenges: ${musicalChallenges.length}, pitfalls: ${pitfalls.length}, phases: ${practicePlan.phases.length}`);

    // ══════════════════════════════════════════════════════
    // Phase C: Guides + Recordings (structured output)
    // ══════════════════════════════════════════════════════

    const guidesSourceBlock = buildGuidesSourceBlock(bundle);
    console.log("[V3 Phase C] Guides+Recordings 시작 (Perplexity→Claude)");

    // Step 1: Perplexity가 가이드+음반 분석 수행
    const guideType = workType === "multi_movement_sonata" ? "each movement" :
      (workType === "suite_or_collection" || workType === "variation_set") ? "each piece/variation" :
      "the work as a whole";

    const perplexityGuidesPrompt = `You are a classical music expert and recording historian.

Composer: ${work.composer_display}
Title: ${work.canonical_title} ${work.opus_catalogue ?? ""}
Instrument: ${instrument}
Work type: ${workType}

Provide detailed analysis of ${guideType}:

1. For ${guideType}, describe:
- Key, form, character (unique personality of THIS movement/piece)
- Specific technical challenges unique to THIS movement/piece (not repeated from other movements)
- Musical challenges and interpretive decisions
- Common mistakes specific to THIS movement/piece
- How it connects to the next movement/piece (if applicable)

2. RECOMMENDED RECORDINGS (5-7):
- Include at least 1 Korean performer
- Mix historical and modern recordings
- For each: artist name, year, label, WHY this recording matters for THIS specific work
- What to listen for in each recording (specific musical moments)

${guidesSourceBlock ? `\nReference materials:\n${guidesSourceBlock}` : ""}
${imslpRichBlock ? `\nVerified IMSLP metadata (USE THIS):\n${imslpRichBlock}` : ""}

Be specific. Every description must be unique to that movement/piece — no copy-paste between movements. Write in Korean. Music terms can use original language.`;

    // Perplexity가 분석 + JSON 생성을 한 번에 수행
    const phaseCPrompt = createV3GuidesPrompt(
      work.composer_display,
      work.canonical_title,
      work.opus_catalogue ?? "",
      instrument,
      workType,
      verifiedFactsJson,
      guidesSourceBlock,
    );
    const phaseCFullPrompt = `${perplexityGuidesPrompt}

위 분석을 바탕으로 아래 JSON 형식으로 출력하십시오:

${phaseCPrompt}`;

    const phaseC = await callPerplexityJson(phaseCFullPrompt, 16000, "V3-C");

    let movementGuides: MovementGuide[] | undefined;
    let collectionGuides: CollectionPieceGuide[] | undefined;

    if (workType === "multi_movement_sonata" && Array.isArray(phaseC.movement_guides)) {
      movementGuides = phaseC.movement_guides as MovementGuide[];
    }
    if ((workType === "suite_or_collection" || workType === "variation_set") && Array.isArray(phaseC.collection_guides)) {
      collectionGuides = phaseC.collection_guides as CollectionPieceGuide[];
    }

    // Recordings + YouTube
    let recordings: RecommendedRecording[] = Array.isArray(phaseC.recommended_recordings)
      ? (phaseC.recommended_recordings as Record<string, unknown>[]).map((r) => ({
          artist: String(r.artist ?? ""),
          year: r.year ? String(r.year) : undefined,
          label: r.label ? String(r.label) : undefined,
          why: String(r.why ?? ""),
          youtube_url: r.youtube_url ? String(r.youtube_url) : undefined,
          listen_for: r.listen_for ? String(r.listen_for) : undefined,
        }))
      : [];

    // YouTube URL 채우기
    const recordingsForYt = recordings.map((r) => ({ artist: r.artist, youtube_url: r.youtube_url }));
    const ytResults = await searchYoutubeUrls(work.composer_display, work.canonical_title, recordingsForYt);
    recordings = recordings.map((r, i) => ({
      ...r,
      youtube_url: (ytResults[i] as { youtube_url?: string })?.youtube_url || r.youtube_url,
    }));

    console.log(`[V3 Phase C] 완료 — movements: ${movementGuides?.length ?? 0}, collection: ${collectionGuides?.length ?? 0}, recordings: ${recordings.length}`);

    // ══════════════════════════════════════════════════════
    // V3 결과 조립 — difficulty 없음
    // ══════════════════════════════════════════════════════

    const hasScore = !!(vision.facts && vision.facts.confidence !== "low" && vision.facts.locked.movements.length > 0);

    const v3Content: AnalysisContentV3 = {
      work_type: workType,
      verified_facts: verifiedFacts,
      summary,
      technical_demands: technicalDemands,
      musical_challenges: musicalChallenges,
      practice_plan: practicePlan,
      pitfalls,
      recommended_recordings: recordings,
      movement_guides: movementGuides,
      collection_guides: collectionGuides,
    };

    const v3Analysis: SongAnalysisV3 = {
      id: `analysis_v3_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      schema_version: 3,
      meta: { work },
      content: v3Content,
      verification_status: hasScore ? "Verified" : "Needs Review",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return { success: true, data: v3Analysis };

  } catch (err) {
    console.error("[V3 Pipeline] 오류:", err);
    return {
      success: false,
      error: `V3 파이프라인 오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
    };
  }
}
