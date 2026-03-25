import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/cron/daily-rewards
 * Vercel Cron (매일 00:05 KST / UTC 15:05)
 *
 * 1. 전날 일일 랭킹 1위에게 배지 지급 (크레딧 0)
 * 2. 배지 2개 모인 유저에게 크레딧 1 자동 교환
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "인증 필요" }, { status: 401 });
    }

    // 전날 날짜 (KST)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() + 9); // UTC → KST
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);

    // 1. 전날 일일 랭킹 1위 조회
    const { data: rankings } = await supabaseServer
      .from("daily_rankings")
      .select("user_id, net_practice_time")
      .eq("date", dateStr)
      .gte("net_practice_time", 1800) // 최소 30분
      .order("net_practice_time", { ascending: false })
      .limit(1);

    let badgeGranted = 0;
    let exchangeGranted = 0;

    if (rankings && rankings.length > 0) {
      const winnerId = rankings[0].user_id;

      // Pro 여부 확인
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabaseServer as any)
        .from("profiles")
        .select("subscription_plan")
        .eq("id", winnerId)
        .single();

      const isPro = profile?.subscription_plan === "pro";

      // 배지 지급 (크레딧 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const badgeResult = await (supabaseServer as any).rpc("grant_reward", {
        p_user_id: winnerId,
        p_reward_id: "daily_rank_1_badge",
        p_period_key: dateStr,
        p_is_pro: isPro,
      });

      if (badgeResult.data?.success) {
        badgeGranted = 1;

        // 배지 2개 모였는지 확인
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabaseServer as any)
          .from("reward_grants")
          .select("id", { count: "exact" })
          .eq("user_id", winnerId)
          .eq("reward_id", "daily_rank_1_badge");

        const badgeCount = count ?? 0;

        // 2개마다 크레딧 1 교환
        if (badgeCount > 0 && badgeCount % 2 === 0) {
          const exchangeKey = `exchange-${badgeCount}-at-${dateStr}`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const exchangeResult = await (supabaseServer as any).rpc("grant_reward", {
            p_user_id: winnerId,
            p_reward_id: "daily_badge_exchange",
            p_period_key: exchangeKey,
            p_is_pro: isPro,
          });

          if (exchangeResult.data?.success) {
            exchangeGranted = 1;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      badgeGranted,
      exchangeGranted,
    });
  } catch (err) {
    console.error("[daily-rewards] error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
