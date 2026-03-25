import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

// Vercel serverless 설정: 최대 60초, body 크기 무제한 (App Router는 streaming)
export const maxDuration = 60;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * POST /api/feedback/upload-video
 * 피드백 영상 업로드 (학생 연습 영상 또는 선생님 시연 영상)
 *
 * FormData:
 * - file: 영상 파일
 * - requestId: 피드백 요청 ID
 * - type: "student" | "demo"
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
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
      },
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requestId = formData.get("requestId") as string | null;
    const type = formData.get("type") as "student" | "demo" | null;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 없습니다." },
        { status: 400 },
      );
    }

    if (!requestId) {
      return NextResponse.json(
        { error: "요청 ID가 필요합니다." },
        { status: 400 },
      );
    }

    if (!type || !["student", "demo"].includes(type)) {
      return NextResponse.json(
        { error: "올바른 업로드 타입이 필요합니다." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "영상 파일만 업로드 가능합니다. (MP4, WebM, MOV)" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "50MB 이하 영상만 업로드 가능합니다." },
        { status: 413 },
      );
    }

    const bucket =
      type === "student" ? "feedback-videos" : "demo-videos";
    const ext = file.name.split(".").pop() || "mp4";
    const timestamp = Date.now();
    const path = `${requestId}/${user.id}_${timestamp}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseServer.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[feedback/upload-video] upload error:", uploadError.message);
      return NextResponse.json(
        { error: "업로드에 실패했습니다. 다시 시도해주세요." },
        { status: 500 },
      );
    }

    const { data: urlData } = supabaseServer.storage
      .from(bucket)
      .getPublicUrl(path);

    const url = urlData.publicUrl;

    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error("[feedback/upload-video] error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
