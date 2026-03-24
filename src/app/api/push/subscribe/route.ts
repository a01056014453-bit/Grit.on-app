import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

/**
 * POST /api/push/subscribe
 * 웹 푸시 구독 정보를 저장
 */
export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: "인증 필요" }, { status: 401 });
    }

    const { subscription } = await request.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "subscription 필요" }, { status: 400 });
    }

    // upsert: 같은 유저의 기존 구독 업데이트
    await db
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[push/subscribe]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
