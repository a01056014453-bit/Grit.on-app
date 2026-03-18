import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * POST /api/db/mutate
 * 인증된 유저의 DB 쓰기 작업을 서버에서 처리 (RLS 우회)
 *
 * Body: {
 *   table: string,
 *   operation: "insert" | "upsert" | "update" | "delete",
 *   data?: Record<string, unknown>,
 *   filters?: Record<string, unknown>,  // eq 조건들
 *   returnData?: boolean
 * }
 */

// 허용된 테이블 + 유저 ID 컬럼 매핑
const TABLE_USER_COLUMN: Record<string, string> = {
  profiles: "id",
  drill_cards: "user_id",
  songs: "user_id",
  feedback_requests: "student_id",
  feedbacks: "__skip__", // request_id 기반, 별도 검증
  room_memberships: "user_id",
  help_requests: "student_id",
  help_proposals: "expert_id",
  teachers: "user_id",
  practice_todos: "user_id",
};

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { table, operation, data, filters, returnData } = body as {
      table: string;
      operation: "insert" | "upsert" | "update" | "delete";
      data?: Record<string, unknown>;
      filters?: Record<string, unknown>;
      returnData?: boolean;
    };

    // 2. 테이블 검증
    if (!table || !(table in TABLE_USER_COLUMN)) {
      return NextResponse.json(
        { error: `허용되지 않은 테이블: ${table}` },
        { status: 400 }
      );
    }

    if (!operation || !["insert", "upsert", "update", "delete"].includes(operation)) {
      return NextResponse.json(
        { error: `잘못된 operation: ${operation}` },
        { status: 400 }
      );
    }

    // 3. 유저 ID 강제 주입 (INSERT/UPSERT)
    const userColumn = TABLE_USER_COLUMN[table];
    let safeData = data ? { ...data } : {};

    if (operation === "insert" || operation === "upsert") {
      if (userColumn === "id") {
        safeData.id = user.id;
      } else if (userColumn !== "__skip__") {
        safeData[userColumn] = user.id;
      }
    }

    // 3-1. profiles 테이블 닉네임 중복 체크
    if (table === "profiles" && safeData.nickname && (operation === "insert" || operation === "upsert" || operation === "update")) {
      const { count } = await supabaseServer
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("nickname", safeData.nickname as string)
        .neq("id", user.id);

      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { error: "이미 사용 중인 닉네임입니다." },
          { status: 409 }
        );
      }
    }

    // 4. 실행 (동적 테이블명이므로 타입 캐스팅 필요)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseServer as any;
    let result: { data: unknown; error: { message: string } | null };

    if (operation === "insert") {
      const q = db.from(table).insert(safeData);
      result = returnData
        ? await q.select().single()
        : await q;
    } else if (operation === "upsert") {
      const q = db.from(table).upsert(safeData);
      result = returnData
        ? await q.select().single()
        : await q;
    } else if (operation === "update") {
      if (!filters || Object.keys(filters).length === 0) {
        return NextResponse.json(
          { error: "update에는 filters가 필요합니다." },
          { status: 400 }
        );
      }
      let q = db.from(table).update(safeData);
      for (const [key, value] of Object.entries(filters)) {
        q = q.eq(key, value as string);
      }
      result = returnData
        ? await q.select().single()
        : await q;
    } else {
      // delete
      if (!filters || Object.keys(filters).length === 0) {
        return NextResponse.json(
          { error: "delete에는 filters가 필요합니다." },
          { status: 400 }
        );
      }
      let q = db.from(table).delete();
      for (const [key, value] of Object.entries(filters)) {
        q = q.eq(key, value as string);
      }
      result = await q;
    }

    if (result.error) {
      console.error(`[db/mutate] ${operation} ${table}:`, result.error.message);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data ?? null,
    });
  } catch (err) {
    console.error("[db/mutate] 서버 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
