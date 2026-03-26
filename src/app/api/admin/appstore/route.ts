import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isConfigured, getAppDownloads, getAppInfo } from "@/lib/appstore-connect";

function getAdminIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  );
}

async function checkAdmin(request: NextRequest): Promise<boolean> {
  try {
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    return !!user && getAdminIds().has(user.id);
  } catch {
    return false;
  }
}

/** GET /api/admin/appstore — App Store Connect 데이터 */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  if (!isConfigured()) {
    return NextResponse.json({
      configured: false,
      message: "App Store Connect API 키가 설정되지 않았습니다. (APP_STORE_ISSUER_ID, APP_STORE_KEY_ID, APP_STORE_PRIVATE_KEY)",
      downloads: null,
      appInfo: null,
    });
  }

  try {
    const [downloads, appInfo] = await Promise.all([
      getAppDownloads(),
      getAppInfo(),
    ]);

    // 둘 다 실패하면 configured: false 반환
    if (!downloads && !appInfo) {
      return NextResponse.json({
        configured: false,
        error: "App Store Connect API 호출에 실패했습니다",
        downloads: null,
        appInfo: null,
      });
    }

    return NextResponse.json({
      configured: true,
      downloads,
      appInfo,
    });
  } catch (err) {
    console.error("[admin/appstore] 서버 오류:", err);
    // 실패 시 절대 configured: true 반환하지 않음
    return NextResponse.json({
      configured: false,
      error: "App Store Connect API 호출에 실패했습니다",
      downloads: null,
      appInfo: null,
    });
  }
}
