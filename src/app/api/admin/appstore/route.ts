import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isConfigured,
  getAppDownloads,
  getAppInfo,
  type AppInfo,
  type DownloadMetrics,
} from "@/lib/appstore-connect";

type AppStoreResponse =
  | { configured: true; downloads: DownloadMetrics | null; appInfo: AppInfo | null }
  | { configured: false; error?: string; message?: string; downloads: null; appInfo: null };

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
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError) {
      console.error("[admin/appstore] Supabase 인증 오류:", authError.message);
      return false;
    }
    if (!user) {
      console.error("[admin/appstore] 비인증 접근");
      return false;
    }
    if (!getAdminIds().has(user.id)) {
      console.error("[admin/appstore] 관리자 아닌 사용자:", user.id);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[admin/appstore] 인증 확인 네트워크 오류:", err);
    return false;
  }
}

/** GET /api/admin/appstore — App Store Connect 데이터 */
export async function GET(request: NextRequest): Promise<NextResponse<AppStoreResponse>> {
  if (!(await checkAdmin(request))) {
    return NextResponse.json(
      { configured: false, error: "관리자 권한이 필요합니다", downloads: null, appInfo: null },
      { status: 403 },
    );
  }

  if (!isConfigured()) {
    console.error("[admin/appstore] 환경변수 누락 — ISSUER:", !!process.env.APPSTORE_ISSUER_ID, "KEY:", !!process.env.APPSTORE_KEY_ID, "PK:", !!process.env.APPSTORE_PRIVATE_KEY);
    return NextResponse.json({
      configured: false,
      message: "APPSTORE_ISSUER_ID, APPSTORE_KEY_ID, APPSTORE_PRIVATE_KEY 환경변수를 설정하세요",
      downloads: null,
      appInfo: null,
    });
  }

  try {
    const [downloads, appInfo] = await Promise.all([
      getAppDownloads(),
      getAppInfo(),
    ]);

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
    return NextResponse.json({
      configured: false,
      error: "App Store Connect API 호출에 실패했습니다",
      downloads: null,
      appInfo: null,
    });
  }
}
