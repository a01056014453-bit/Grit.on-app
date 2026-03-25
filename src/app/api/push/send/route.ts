import { NextRequest, NextResponse } from "next/server";
import webPush from "web-push";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails("mailto:support@withsempre.com", VAPID_PUBLIC, VAPID_PRIVATE);
}

/**
 * POST /api/push/send
 * 특정 유저에게 웹 푸시 발송 (서버 내부용)
 */
export async function POST(request: NextRequest) {
  try {
    // 내부 호출만 허용: 인증된 유저이거나 서버 내부 호출(CRON_SECRET)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isInternalCall = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isInternalCall) {
      // 인증된 유저 확인
      const { createServerClient } = await import("@supabase/ssr");
      const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll() {},
          },
        },
      );
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
      }
    }

    const { userId, teacherId, title, body, url } = await request.json();

    // teacherId가 주어지면 user_id 조회
    let targetUserId = userId;
    if (!targetUserId && teacherId) {
      const { data: teacher } = await db
        .from("teachers")
        .select("user_id")
        .eq("id", teacherId)
        .single();
      targetUserId = teacher?.user_id;
    }

    if (!targetUserId || !title) {
      return NextResponse.json({ error: "userId 또는 teacherId, title 필수" }, { status: 400 });
    }

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      console.warn("[push/send] VAPID keys not configured");
      return NextResponse.json({ success: false, error: "VAPID 미설정" });
    }

    // 유저의 구독 정보 조회
    const { data: sub } = await db
      .from("push_subscriptions")
      .select("endpoint, keys")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json({ success: false, error: "구독 없음" });
    }

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: sub.keys,
    };

    const payload = JSON.stringify({ title, body, url });

    await webPush.sendNotification(pushSubscription, payload);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    // 410 Gone = 구독 만료, 삭제
    if (statusCode === 410) {
      try {
        const { userId } = await request.clone().json();
        await db.from("push_subscriptions").delete().eq("user_id", userId);
      } catch {}
    }
    console.error("[push/send]", err);
    return NextResponse.json({ success: false, error: "발송 실패" });
  }
}
