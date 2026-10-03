import { updateSession } from "@/lib/supabase-middleware";
import { NextResponse, type NextRequest } from "next/server";
import { isDeferredReleaseRoute } from "@/lib/release-scope";

export async function middleware(request: NextRequest) {
  if (isDeferredReleaseRoute(request.nextUrl.pathname)) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '아직 제공하지 않는 기능입니다.' }, { status: 404 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    // API, _next, 정적 파일 등은 제외
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|json)$).*)",
  ],
};
