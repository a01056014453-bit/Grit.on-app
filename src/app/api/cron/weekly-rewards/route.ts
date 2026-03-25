import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/cron/weekly-rewards
 * Vercel Cron (매주 월요일 00:10 KST / UTC 15:10)
 *
 * 직전 주(월~일) 합산 순연습시간 TOP 3에게 크레딧 보상
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "인증 필요" }, { status: 401 });
    }

    // 직전 주 월~일 날짜 범위 (KST)
    const now = new Date();
    now.setHours(now.getHours() + 9);
    const todayDay = now.getDay(); // 0=일, 1=월
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - todayDay);
    const lastMonday = new Date(lastSunday);
    lastMonday.setDate(lastSunday.getDate() - 6);

    const startDate = lastMonday.toISOString().slice(0, 10);
    const endDate = lastSunday.toISOString().slice(0, 10);

    // ISO 주차 계산
    const jan1 = new Date(lastMonday.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((lastMonday.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7,
    );
    const weekKey = `${lastMonday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

    // 주간 합산 TOP 3 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: weeklyRanking } = await (supabaseServer as any).rpc("get_weekly_ranking", {
      p_start_date: startDate,
      p_end_date: endDate,
    }).select("*").limit(3);

    // RPC가 없으면 직접 쿼리
    let top3 = weeklyRanking;
    if (!top3) {
      const { data } = await supabaseServer
        .from("daily_rankings")
        .select("user_id")
        .gte("date", startDate)
        .lte("date", endDate)
        .gte("net_practice_time", 1800);

      if (data) {
        // user_id별 합산
        const totals = new Map<string, number>();
        for (const row of data) {
          totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + 1);
        }
        top3 = Array.from(totals.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([user_id]) => ({ user_id }));
      }
    }

    const rewards = ["weekly_rank_1", "weekly_rank_2", "weekly_rank_3"];
    let granted = 0;

    for (let i = 0; i < (top3?.length ?? 0); i++) {
      const userId = top3![i].user_id;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabaseServer as any)
        .from("profiles")
        .select("subscription_plan")
        .eq("id", userId)
        .single();

      const isPro = profile?.subscription_plan === "pro";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabaseServer as any).rpc("grant_reward", {
        p_user_id: userId,
        p_reward_id: rewards[i],
        p_period_key: weekKey,
        p_is_pro: isPro,
      });

      if (result.data?.success) granted++;
    }

    return NextResponse.json({
      success: true,
      week: weekKey,
      range: { startDate, endDate },
      granted,
    });
  } catch (err) {
    console.error("[weekly-rewards] error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
