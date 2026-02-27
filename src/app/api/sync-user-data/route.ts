import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { Json } from "@/types/database";

/**
 * POST: localStorage 데이터를 서버에 저장 (push)
 * Body: { userId, items: [{ key, value }] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId: string = body.userId;
    const items: Array<{ key: string; value: Json }> = body.items ?? [];

    if (!userId || items.length === 0) {
      return NextResponse.json(
        { error: "userId와 items가 필요합니다." },
        { status: 400 }
      );
    }

    // upsert (ON CONFLICT → UPDATE)
    const rows = items.map((item) => ({
      user_id: userId,
      data_key: item.key,
      data_value: item.value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseServer
      .from("user_data_sync")
      .upsert(rows, { onConflict: "user_id,data_key" });

    if (error) {
      console.error("[sync-user-data] upsert 오류:", error);
      return NextResponse.json(
        { error: "데이터 저장 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error("[sync-user-data] POST 오류:", error);
    return NextResponse.json(
      { error: "동기화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET: 서버에서 사용자 데이터 가져오기 (pull)
 * Query: ?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("user_data_sync")
      .select("data_key, data_value, updated_at")
      .eq("user_id", userId);

    if (error) {
      console.error("[sync-user-data] GET 오류:", error);
      return NextResponse.json(
        { error: "데이터 조회 실패" },
        { status: 500 }
      );
    }

    const items = (data || []).map((row) => ({
      key: row.data_key,
      value: row.data_value,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("[sync-user-data] GET 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
