import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * POST /api/profile
 * 프로필 생성/수정 (서버 사이드, service_role로 RLS 우회)
 * 쿠키 기반 인증으로 본인 확인
 */
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
    const {
      nickname, name, instrument, level, email, auth_provider,
      profile_image, agreed_terms, agreed_privacy, agreed_marketing, agreed_at,
    } = body;

    if (!nickname || typeof nickname !== "string" || nickname.trim().length < 2) {
      return NextResponse.json(
        { error: "닉네임은 2자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 2. 닉네임 중복 체크 (서버 사이드 — 동시 요청 방지)
    const { count: duplicateCount } = await supabaseServer
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("nickname", nickname.trim())
      .neq("id", user.id);

    if ((duplicateCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임입니다." },
        { status: 409 }
      );
    }

    // 3. service_role로 프로필 upsert (RLS 우회)
    const upsertData: Record<string, unknown> = {
      id: user.id,
      nickname: nickname.trim(),
      name: name ?? nickname.trim(),
      instrument: instrument ?? "piano",
      level: level ?? null,
      email: email ?? user.email ?? null,
      auth_provider: auth_provider ?? user.app_metadata?.provider ?? null,
    };

    // 선택적 필드 (컬럼이 없을 수 있으므로 있을 때만 추가)
    if (profile_image !== undefined) upsertData.profile_image = profile_image;
    if (agreed_terms !== undefined) upsertData.agreed_terms = agreed_terms;
    if (agreed_privacy !== undefined) upsertData.agreed_privacy = agreed_privacy;
    if (agreed_marketing !== undefined) upsertData.agreed_marketing = agreed_marketing;
    if (agreed_at !== undefined) upsertData.agreed_at = agreed_at;

    const { data, error } = await (supabaseServer as any)
      .from("profiles")
      .upsert(upsertData)
      .select()
      .single();

    if (error) {
      console.error("[profile] upsert 실패:", error.message);
      return NextResponse.json(
        { error: "프로필 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err) {
    console.error("[profile] 서버 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile
 * 현재 인증된 유저의 프로필 조회
 */
export async function GET(request: NextRequest) {
  try {
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

    const { data, error } = await supabaseServer
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("[profile] 서버 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
