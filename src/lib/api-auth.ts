import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "./supabase-server";

/** API route에서 요청 사용자의 ID를 추출 (cookie → Bearer token 순) */
export async function getRequestUserId(request: NextRequest): Promise<string | null> {
  // 1. Cookie 기반 인증
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
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user) return user.id;
  } catch {}

  // 2. Bearer token 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabaseServer.auth.getUser(token);
      if (user) return user.id;
    } catch {}
  }

  return null;
}

/** 사용자가 선생님인지 확인 후 teacher row의 id를 반환 */
export async function getTeacherIdForUser(userId: string): Promise<string | null> {
  const { data } = await supabaseServer
    .from("teachers")
    .select("id")
    .eq("user_id", userId)
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}
