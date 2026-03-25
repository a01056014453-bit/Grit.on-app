import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

/** 접근 허용 테이블 (개인정보 미포함 또는 본인 데이터만) */
const ALLOWED_TABLES = new Set([
  "teacher_reviews",
  "reward_definitions",
  "reward_grants",
  "rooms",
  "schools",
  "room_memberships",
  "song_analyses",
  "composers",
  "designated_pieces",
]);

/**
 * GET /api/db/query
 * 인증 필수 + 테이블 허용목록 기반 읽기 전용 쿼리 API
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
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
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const filter = searchParams.get("filter");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!table) {
      return NextResponse.json(
        { error: "테이블명이 필요합니다." },
        { status: 400 },
      );
    }

    // 테이블 허용목록 검증
    if (!ALLOWED_TABLES.has(table)) {
      return NextResponse.json(
        { error: "접근할 수 없는 테이블입니다." },
        { status: 403 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabaseServer as any)
      .from(table)
      .select("*")
      .limit(limit);

    // 필터 파싱: "column.operator.value"
    if (filter) {
      const parts = filter.split(".");
      if (parts.length >= 3) {
        const column = parts[0];
        const operator = parts[1];
        const value = parts.slice(2).join(".");

        if (operator === "eq") {
          query = query.eq(column, value);
        } else if (operator === "neq") {
          query = query.neq(column, value);
        } else if (operator === "gt") {
          query = query.gt(column, value);
        } else if (operator === "lt") {
          query = query.lt(column, value);
        }
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[db/query] error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
