import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

function getAdminIds(): Set<string> {
  return new Set((process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean));
}

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return !!user && getAdminIds().has(user.id);
}

/** GET /api/admin/analytics — 이벤트 분석 데이터 (service role) */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // 이벤트별 카운트 (최근 30일)
  const { data: allEvents } = await db
    .from("user_events")
    .select("event, platform, is_standalone, created_at, user_id")
    .gte("created_at", thirtyDaysAgo);

  const events = allEvents ?? [];

  // 이벤트별 카운트
  const eventCounts: Record<string, number> = {};
  for (const e of events) {
    eventCounts[e.event] = (eventCounts[e.event] ?? 0) + 1;
  }

  // DAU 추이 (최근 30일)
  const dauMap: Record<string, Set<string>> = {};
  for (const e of events) {
    const date = (e.created_at as string).split("T")[0];
    if (!dauMap[date]) dauMap[date] = new Set();
    if (e.user_id) dauMap[date].add(e.user_id);
  }

  const dauTrend = Object.entries(dauMap)
    .map(([date, users]) => ({ date, users: users.size }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 디바이스 분석
  const deviceBreakdown: Record<string, number> = { iOS: 0, Android: 0, Desktop: 0, Unknown: 0 };
  for (const e of events) {
    const platform = (e.platform ?? "").toLowerCase();
    if (platform.includes("ios") || platform.includes("iphone") || platform.includes("ipad")) {
      deviceBreakdown.iOS += 1;
    } else if (platform.includes("android")) {
      deviceBreakdown.Android += 1;
    } else if (platform.includes("windows") || platform.includes("mac") || platform.includes("linux")) {
      deviceBreakdown.Desktop += 1;
    } else {
      deviceBreakdown.Unknown += 1;
    }
  }

  // PWA 설치 수
  const pwaInstallCount = events.filter((e: any) => e.is_standalone === true).length;

  return NextResponse.json({
    eventCounts,
    dauTrend,
    deviceBreakdown,
    pwaInstallCount,
  });
}
