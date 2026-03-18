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

  // Admin 라우트 보호: 인증 + 허가된 유저만 접근
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/onboarding/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const adminIds = getAdminUserIds();
    if (adminIds.size > 0 && !adminIds.has(user.id)) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return supabaseResponse;
}
