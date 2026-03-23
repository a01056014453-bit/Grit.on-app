import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * POST /api/auth/check-duplicate
 * 이메일로 기존 가입 여부 확인 (auth.users + profiles 모두 검사)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, currentUserId } = await request.json();

    if (!email) {
      return NextResponse.json({ duplicate: false });
    }

    // 1. profiles 테이블에서 같은 이메일, 다른 유저 확인
    const { data: profileMatch } = await (supabaseServer as any)
      .from("profiles")
      .select("id, auth_provider, nickname")
      .eq("email", email)
      .neq("id", currentUserId)
      .limit(1)
      .maybeSingle();

    if (profileMatch) {
      return NextResponse.json({
        duplicate: true,
        provider: profileMatch.auth_provider || "unknown",
        nickname: profileMatch.nickname,
      });
    }

    // 2. Supabase auth.users에서 같은 이메일, 다른 유저 확인
    const { data: { users }, error } = await supabaseServer.auth.admin.listUsers({
      perPage: 100,
    });

    if (!error && users) {
      const match = users.find(
        (u) => u.email === email && u.id !== currentUserId,
      );

      if (match) {
        const provider = match.app_metadata?.provider || "unknown";
        return NextResponse.json({
          duplicate: true,
          provider,
        });
      }
    }

    return NextResponse.json({ duplicate: false });
  } catch (err) {
    console.error("[check-duplicate]", err);
    return NextResponse.json({ duplicate: false });
  }
}
