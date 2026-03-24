import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/feedback/expire-check
 * Vercel Cron (5분 간격)으로 호출되어 SLA 만료된 피드백 요청을 자동 처리
 *
 * - SENT 상태 + accept_deadline 초과 → EXPIRED + refunded
 * - ACCEPTED 상태 + submit_deadline 초과 → EXPIRED + refunded
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 인증
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const now = new Date().toISOString();
    let expiredSentCount = 0;
    let expiredAcceptedCount = 0;

    // 1. SENT 상태 + accept_deadline 초과
    const { data: expiredSent, error: sentError } = await supabaseServer
      .from("feedback_requests")
      .update({
        status: "EXPIRED",
        payment_status: "refunded",
        updated_at: now,
      })
      .eq("status", "SENT")
      .lt("accept_deadline", now)
      .select("id, student_id");

    if (sentError) {
      console.error("[expire-check] SENT 만료 처리 오류:", sentError.message);
    } else {
      expiredSentCount = expiredSent?.length ?? 0;
    }

    // 2. ACCEPTED 상태 + submit_deadline 초과
    const { data: expiredAccepted, error: acceptedError } = await supabaseServer
      .from("feedback_requests")
      .update({
        status: "EXPIRED",
        payment_status: "refunded",
        updated_at: now,
      })
      .eq("status", "ACCEPTED")
      .lt("submit_deadline", now)
      .select("id, student_id, teacher_id");

    if (acceptedError) {
      console.error("[expire-check] ACCEPTED 만료 처리 오류:", acceptedError.message);
    } else {
      expiredAcceptedCount = expiredAccepted?.length ?? 0;
    }

    // 3. 푸시 알림 발송 (비동기, 실패해도 무시)
    const pushPromises: Promise<void>[] = [];

    for (const req of expiredSent ?? []) {
      pushPromises.push(
        sendExpirePush(req.student_id, "피드백 요청이 만료되었습니다. 다른 선생님에게 요청해보세요.", req.id),
      );
    }

    for (const req of expiredAccepted ?? []) {
      pushPromises.push(
        sendExpirePush(req.student_id, "선생님이 기한 내 피드백을 제출하지 않아 요청이 만료되었습니다.", req.id),
      );
    }

    await Promise.allSettled(pushPromises);

    return NextResponse.json({
      success: true,
      expired: {
        sent: expiredSentCount,
        accepted: expiredAcceptedCount,
      },
    });
  } catch (err) {
    console.error("[expire-check] error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

async function sendExpirePush(userId: string, body: string, requestId: string): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    await fetch(`${baseUrl}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: "피드백 요청 만료",
        body,
        url: `/feedback/${requestId}`,
      }),
    });
  } catch {
    // 푸시 실패는 무시
  }
}
