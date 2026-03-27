/**
 * /api/analyze-song-v2/status
 * GET ?job_id=xxx → 분석 진행 상태 확인
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const jobId = req.nextUrl.searchParams.get("job_id");

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "job_id가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const { data: job, error } = await db
      .from("analysis_jobs")
      .select("id, status, result_id, error_message, composer, title, created_at")
      .eq("id", jobId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { success: false, error: "job을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      job_id: job.id,
      status: job.status,
      result_id: job.result_id,
      error_message: job.error_message,
      composer: job.composer,
      title: job.title,
      elapsed_seconds: Math.floor(
        (Date.now() - new Date(job.created_at).getTime()) / 1000
      ),
    });
  } catch (err) {
    console.error("[Status] 오류:", err);
    return NextResponse.json(
      { success: false, error: "상태 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
