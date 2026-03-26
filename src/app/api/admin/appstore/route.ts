import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isConfigured, getAppDownloads, getAppInfo } from "@/lib/appstore-connect";

function getAdminIds(): Set<string> {
  return new Set((process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean));
}

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return !!user && getAdminIds().has(user.id);
}

/** GET /api/admin/appstore — App Store Connect 데이터 */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isConfigured()) {
    return NextResponse.json({
      configured: false,
      message: "App Store Connect API 키가 설정되지 않았습니다.",
      downloads: null,
      appInfo: null,
    });
  }

  try {
    const [downloads, appInfo] = await Promise.all([
      getAppDownloads().catch(() => null),
      getAppInfo().catch(() => null),
    ]);

    return NextResponse.json({
      configured: true,
      downloads,
      appInfo,
    });
  } catch (err) {
    console.error("[admin/appstore] error:", err);
    return NextResponse.json({
      configured: true,
      error: "App Store Connect API 호출 실패",
      downloads: null,
      appInfo: null,
    });
  }
}
