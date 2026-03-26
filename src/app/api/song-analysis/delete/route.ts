import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { removeFromUserHistory } from "@/lib/song-analysis-db";

/**
 * POST /api/song-analysis/delete
 * 개인 보관함에서만 제거 (공유 캐시는 유지)
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
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
    }

    // 개인 보관함에서만 제거 (공유 캐시는 유지)
    const result = await removeFromUserHistory(user.id, id);

    if (!result) {
      return NextResponse.json({ error: "보관함에서 제거에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
