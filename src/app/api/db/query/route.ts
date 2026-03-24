import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/db/query
 * 범용 읽기 전용 쿼리 API
 *
 * Query params:
 * - table: 테이블명
 * - filter: PostgREST 형식 필터 (예: request_id.eq.abc123)
 * - limit: 결과 수 제한 (기본 50)
 */
export async function GET(request: NextRequest) {
  try {
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
