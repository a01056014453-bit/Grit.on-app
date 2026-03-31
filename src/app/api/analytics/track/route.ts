import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { EventType } from "@/lib/analytics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

/** POST /api/analytics/track — 사용자 이벤트 기록 (service role) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, userId, properties, timestamp, userAgent, platform, standalone } = body;

    // 유효성 검사: event 타입 확인
    if (!event || typeof event !== "string") {
      return NextResponse.json(
        { error: "유효하지 않은 이벤트 타입입니다." },
        { status: 400 },
      );
    }

    const { error } = await db.from("user_events").insert({
      event,
      user_id: userId || null,
      properties: properties || null,
      user_agent: userAgent || null,
      platform: platform || null,
      is_standalone: standalone ?? false,
      created_at: timestamp || new Date().toISOString(),
    });

    if (error) {
      console.error("[analytics/track] DB 저장 실패:", error.message);
      return NextResponse.json({ success: false, error: "이벤트 저장에 실패했습니다." });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[analytics/track] 서버 오류:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." });
  }
}
