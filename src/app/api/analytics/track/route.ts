import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

/** POST /api/analytics/track — 사용자 이벤트 기록 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, userId, properties, timestamp, userAgent, platform, standalone } = body;

    if (!event) {
      return NextResponse.json({ error: "event 필수" }, { status: 400 });
    }

    await db.from("user_events").insert({
      event,
      user_id: userId || null,
      properties: properties || null,
      user_agent: userAgent || null,
      platform: platform || null,
      is_standalone: standalone ?? false,
      created_at: timestamp || new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[analytics/track]", err);
    return NextResponse.json({ success: false });
  }
}
