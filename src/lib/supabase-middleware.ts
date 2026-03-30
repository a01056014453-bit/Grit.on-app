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

  // Admin 라우트 보호: AdminGuard 컴포넌트에서 처리 (이메일/비밀번호 로그인 지원)
  // 미들웨어에서는 인증되지 않은 비어드민만 차단
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin")) {
    if (user) {
      // 로그인은 되어 있지만 어드민이 아닌 경우만 차단
      const adminIds = getAdminUserIds();
      if (adminIds.size > 0 && !adminIds.has(user.id)) {
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
      }
    }
    // 로그인 안 된 경우: AdminGuard에서 로그인 폼 표시 (리다이렉트 안 함)
  }

  return supabaseResponse;
}
