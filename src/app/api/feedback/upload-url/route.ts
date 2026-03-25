import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * POST /api/feedback/upload-url
 * Supabase Storage에 직접 업로드할 수 있는 signed URL 생성
 * 서버를 거치지 않으므로 Vercel body 크기 제한 무관
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

    const { requestId, type, fileName, contentType } = await request.json();

    if (!requestId || !type || !fileName) {
      return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
    }

    const bucket = type === "student" ? "feedback-videos" : "demo-videos";
    const ext = fileName.split(".").pop() || "mp4";
    const path = `${requestId}/${user.id}_${Date.now()}.${ext}`;

    // signed URL 생성 (5분간 유효)
    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) {
      console.error("[upload-url] signed URL 생성 실패:", error.message);
      return NextResponse.json({ error: "업로드 URL 생성 실패" }, { status: 500 });
    }

    // 공개 URL도 미리 생성
    const { data: publicUrlData } = supabaseServer.storage
      .from(bucket)
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error("[upload-url] error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
