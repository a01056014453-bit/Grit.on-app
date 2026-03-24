import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * POST /api/credits/charge
 * 크레딧 충전 (PG 결제 완료 후 호출)
 *
 * Body: { amount: number, paymentKey?: string, orderId?: string }
 *
 * TODO: 토스페이먼츠 결제 검증 로직 추가
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

    const body = await request.json();
    const { amount } = body as { amount: number; paymentKey?: string; orderId?: string };

    if (!amount || amount < 1 || amount > 100) {
      return NextResponse.json(
        { error: "1~100 크레딧만 충전 가능합니다." },
        { status: 400 },
      );
    }

    // TODO: 토스페이먼츠 결제 검증
    // const paymentResult = await verifyTossPayment(paymentKey, orderId, amount * 1000);
    // if (!paymentResult.success) return ...

    // 잔액 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabaseServer as any)
      .from("profiles")
      .select("credit_balance, total_credit_purchases")
      .eq("id", user.id)
      .single();

    const currentBalance = profile?.credit_balance ?? 0;
    const newBalance = currentBalance + amount;
    const newPurchases = (profile?.total_credit_purchases ?? 0) + 1;

    // 잔액 갱신
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseServer as any)
      .from("profiles")
      .update({
        credit_balance: newBalance,
        total_credit_purchases: newPurchases,
      })
      .eq("id", user.id);

    // 트랜잭션 기록
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseServer as any)
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount,
        type: "charge",
        description: `${amount}크레딧 충전`,
        balance_after: newBalance,
      });

    return NextResponse.json({
      success: true,
      balance: newBalance,
    });
  } catch (err) {
    console.error("[credits/charge] error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
