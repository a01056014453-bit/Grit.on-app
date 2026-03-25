import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { sendSlackNotification, feedbackSlaMessage } from "@/lib/slack";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

/**
 * GET /api/cron/check-sla
 * Vercel Cron으로 매시간 실행
 * 수락 마감 임박한 피드백 요청 → Slack 알림 + 선생님 푸시
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // 수락 마감 2시간 이내인 SENT 상태 요청 조회
    const { data: urgentRequests } = await db
      .from("feedback_requests")
      .select("id, teacher_id, accept_deadline, piece, composer")
      .eq("status", "SENT")
      .lte("accept_deadline", twoHoursLater.toISOString())
      .gte("accept_deadline", now.toISOString());

    if (!urgentRequests || urgentRequests.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 선생님 이름 조회 + 알림 발송
    for (const req of urgentRequests) {
      const { data: teacher } = await db
        .from("teachers")
        .select("name, user_id")
        .eq("id", req.teacher_id)
        .single();

      if (!teacher) continue;

      const hoursLeft = Math.ceil(
        (new Date(req.accept_deadline).getTime() - now.getTime()) / (1000 * 60 * 60),
      );

      // Slack 알림
      await sendSlackNotification("general", feedbackSlaMessage(req.id, teacher.name, hoursLeft));

      // 선생님에게 푸시 알림
      if (teacher.user_id) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://withsempre.com"}/api/push/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cronSecret}`,
          },
          body: JSON.stringify({
            userId: teacher.user_id,
            title: "피드백 수락 마감 임박",
            body: `${req.composer} - ${req.piece} 요청이 ${hoursLeft}시간 후 만료됩니다.`,
            url: `/inbox/${req.id}`,
          }),
        }).catch(() => {});
      }
    }

    // 만료된 SENT 요청 자동 처리
    const { data: expiredRequests } = await db
      .from("feedback_requests")
      .select("id")
      .eq("status", "SENT")
      .lt("accept_deadline", now.toISOString());

    if (expiredRequests && expiredRequests.length > 0) {
      for (const req of expiredRequests) {
        await db
          .from("feedback_requests")
          .update({ status: "EXPIRED", updated_at: now.toISOString() })
          .eq("id", req.id);
      }
    }

    return NextResponse.json({
      success: true,
      urgent: urgentRequests.length,
      expired: expiredRequests?.length ?? 0,
    });
  } catch (err) {
    console.error("[cron/check-sla]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
