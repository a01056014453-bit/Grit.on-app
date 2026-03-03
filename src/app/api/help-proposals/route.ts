import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// help_requests/help_proposals 테이블이 database.ts 타입에 아직 없으므로 untyped 사용
// DB 마이그레이션 후 npx supabase gen types 로 재생성 필요
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

/** POST /api/help-proposals — 해결 제안 제출 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requestId,
      expertId,
      comments,
      demoVideoUrl,
      demoVideoLength,
      practiceCard,
    } = body;

    // 입력 검증
    if (!requestId || !expertId) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (!comments || !Array.isArray(comments) || comments.length < 2) {
      return NextResponse.json(
        { error: "마디별 코멘트가 최소 2개 필요합니다." },
        { status: 400 }
      );
    }

    // 요청 상태 확인
    const { data: helpRequest, error: reqError } = await db
      .from("help_requests")
      .select("status, max_proposals, student_id")
      .eq("id", requestId)
      .single();

    if (reqError || !helpRequest) {
      return NextResponse.json(
        { error: "해결 요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (helpRequest.status !== "open") {
      return NextResponse.json(
        { error: "이 요청은 더 이상 제안을 받지 않습니다." },
        { status: 400 }
      );
    }

    // 본인 요청에 제안 불가
    if (helpRequest.student_id === expertId) {
      return NextResponse.json(
        { error: "본인의 요청에는 제안할 수 없습니다." },
        { status: 400 }
      );
    }

    // 중복 제안 방지
    const { data: existing } = await db
      .from("help_proposals")
      .select("id")
      .eq("request_id", requestId)
      .eq("expert_id", expertId)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "이미 이 요청에 제안을 제출하셨습니다." },
        { status: 400 }
      );
    }

    // 현재 제안 수 확인
    const { count: currentCount } = await db
      .from("help_proposals")
      .select("*", { count: "exact", head: true })
      .eq("request_id", requestId);

    if ((currentCount ?? 0) >= helpRequest.max_proposals) {
      return NextResponse.json(
        { error: "최대 제안 수에 도달했습니다." },
        { status: 400 }
      );
    }

    // 제안 생성
    const { data, error } = await db
      .from("help_proposals")
      .insert({
        request_id: requestId,
        expert_id: expertId,
        comments,
        demo_video_url: demoVideoUrl ?? null,
        demo_video_length: demoVideoLength ?? null,
        practice_card: practiceCard ?? {},
      })
      .select()
      .single();

    if (error) {
      console.error("[help-proposals POST]", error);
      return NextResponse.json(
        { error: "제안 제출에 실패했습니다." },
        { status: 500 }
      );
    }

    // max_proposals에 도달하면 자동으로 reviewing 상태로 전환
    const newCount = (currentCount ?? 0) + 1;
    if (newCount >= helpRequest.max_proposals) {
      await db
        .from("help_requests")
        .update({ status: "reviewing" })
        .eq("id", requestId);
    }

    return NextResponse.json({ proposal: data }, { status: 201 });
  } catch (error) {
    console.error("[help-proposals POST] 서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
