import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/credits/balance
 * 크레딧 잔액 + 구독 플랜 조회
 */
export async function GET(request: NextRequest) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseServer as any)
      .from("profiles")
      .select("credit_balance, subscription_plan, total_credit_purchases")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      balance: data?.credit_balance ?? 0,
      plan: data?.subscription_plan ?? "free",
      totalPurchases: data?.total_credit_purchases ?? 0,
    });
  } catch (err) {
    console.error("[credits/balance] error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
