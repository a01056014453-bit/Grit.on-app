import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 환경변수에서 Admin 유저 ID 목록 로드 (쉼표 구분) */
function getAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return new Set(raw.split(",").map((id) => id.trim()).filter(Boolean));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (중요: getUser()를 호출해야 세션이 갱신됨)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin 라우트 보호
  // 1단계 (미들웨어): 인증 확인 — 비로그인 시 AdminGuard 로그인 폼으로 위임
  // 2단계 (AdminGuard): 어드민 권한 검증 — 이메일/비밀번호 로그인 지원
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin")) {
    if (!user) {
      // 비로그인: AdminGuard에서 이메일/비밀번호 로그인 폼 표시
      // (미들웨어에서 리다이렉트하지 않음 — SSO 외 로그인 지원을 위해)
      return supabaseResponse;
    }
    // 로그인 됨: 어드민 ID 검증
    const adminIds = getAdminUserIds();
    if (adminIds.size > 0 && !adminIds.has(user.id)) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return supabaseResponse;
}
