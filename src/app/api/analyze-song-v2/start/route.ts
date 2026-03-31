/**
 * /api/analyze-song-v2/start
 * 분석 시작 → job_id 즉시 반환 → 백그라운드 실행
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { waitUntil } from "@vercel/functions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

const RequestSchema = z.object({
  composer: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  instrument: z.string().max(50).optional().default("piano"),
  /** V3 파이프라인 사용 — 3이면 V3 */
  analysisVersion: z.literal(3).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 인증
    let userId: string | null = null;
    try {
      const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } },
      );
      const { data: { user } } = await supabaseAuth.auth.getUser();
      userId = user?.id ?? null;
    } catch { /* 비인증 */ }

    // 요청 파싱
    const raw = await req.json();
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "요청 형식 오류" },
        { status: 400 },
      );
    }
    const { composer, title, instrument, analysisVersion } = parsed.data;

    // 캐시 확인 (schema_version >= 2인 결과만)
    const { data: cached } = await db
      .from("song_analyses")
      .select("id, content")
      .ilike("composer", composer.trim())
      .ilike("title", title.trim())
      .limit(1)
      .single();

    if (cached) {
      const cachedVersion = (() => {
        try {
          const c = typeof cached.content === "string" ? JSON.parse(cached.content) : cached.content;
          return c?.schema_version ?? 1;
        } catch { return 1; }
      })();

      const requiredVersion = analysisVersion === 3 ? 3 : 2;
      if (cachedVersion >= requiredVersion) {
        // 히스토리 기록 (테이블 없어도 무시)
        if (userId) {
          try {
            await db
              .from("user_analysis_history")
              .upsert(
                { user_id: userId, song_analysis_id: cached.id },
                { onConflict: "user_id,song_analysis_id" }
              );
          } catch { /* 테이블 미생성 시 무시 */ }
        }
        return NextResponse.json({
          success: true,
          job_id: null,
          result_id: cached.id,
          cached: true,
          message: "이미 분석된 곡입니다.",
        });
      }
    }

    // 진행 중인 job 확인 (중복 방지 — 10분 이내)
    const { data: existingJob } = await db
      .from("analysis_jobs")
      .select("id, status")
      .eq("composer", composer.trim())
      .eq("title", title.trim())
      .eq("status", "processing")
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .limit(1)
      .single();

    if (existingJob) {
      return NextResponse.json({
        success: true,
        job_id: existingJob.id,
        result_id: null,
        cached: false,
        message: "이미 분석이 진행 중입니다.",
      });
    }

    // 새 job 생성
    const composerNorm = composer.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
    const cacheKey = `${composer.trim().toLowerCase().replace(/\s+/g, "_")}__${title.trim().toLowerCase().replace(/\s+/g, "_")}`;

    const { data: job, error: jobError } = await db
      .from("analysis_jobs")
      .insert({
        user_id: userId,
        composer: composer.trim(),
        title: title.trim(),
        instrument,
        status: "processing",
        analysis_version: analysisVersion ?? 2,
        requested_format: analysisVersion === 3 ? "v3" : "legacy",
        composer_normalized: composerNorm,
        canonical_title: title.trim(),
        cache_key: cacheKey,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (jobError || !job) {
      console.error("[Start] job 생성 실패:", jobError);
      return NextResponse.json(
        { success: false, error: "분석 시작에 실패했습니다." },
        { status: 500 },
      );
    }

    console.log(`[Start] job 생성: ${job.id} | ${composer} - ${title}`);

    // 백그라운드 분석 (응답 후에도 실행 계속)
    waitUntil(
      runAnalysisInBackground({
        jobId: job.id,
        userId,
        composer: composer.trim(),
        title: title.trim(),
        instrument,
        analysisVersion,
      })
    );

    return NextResponse.json({
      success: true,
      job_id: job.id,
      result_id: null,
      cached: false,
      message: "분석이 시작되었습니다.",
    });
  } catch (err) {
    console.error("[Start] 오류:", err);
    return NextResponse.json(
      { success: false, error: "분석 시작 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

async function runAnalysisInBackground({
  jobId, userId, composer, title, instrument, analysisVersion,
}: {
  jobId: string;
  userId: string | null;
  composer: string;
  title: string;
  instrument: string;
  analysisVersion?: 3;
}): Promise<void> {
  try {
    console.log(`[Background] 시작: ${jobId} | ${composer} - ${title} | v${analysisVersion ?? 2}`);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://withsempre.com";
    const res = await fetch(`${baseUrl}/api/analyze-song-v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-call": process.env.INTERNAL_CALL_SECRET ?? "",
      },
      body: JSON.stringify({
        composer, title, instrument,
        ...(analysisVersion === 3 ? { analysisVersion: 3 } : {}),
      }),
    });

    const result = await res.json();

    if (!result.success || !result.data) {
      throw new Error(result.error ?? "분석 실패");
    }

    const resultId = result.data.id;

    // 히스토리 기록 (테이블 없어도 무시)
    if (userId && resultId) {
      try {
        await db
          .from("user_analysis_history")
          .upsert(
            { user_id: userId, song_analysis_id: resultId },
            { onConflict: "user_id,song_analysis_id" }
          );
      } catch { /* 무시 */ }
    }

    // job 완료
    const resultSchemaVersion = result.data?.schema_version ?? (analysisVersion ?? 2);
    await db
      .from("analysis_jobs")
      .update({
        status: "done",
        result_id: resultId,
        result_schema_version: resultSchemaVersion,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`[Background] 완료: ${jobId} → ${resultId} | schema_version: ${resultSchemaVersion}`);
  } catch (error) {
    console.error(`[Background] 실패: ${jobId}`, error);
    await db
      .from("analysis_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "알 수 없는 오류",
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
