import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";
import { getRequestUserId } from "@/lib/api-auth";

// 업로드 종류 → Storage 버킷. room은 requestId 자리에 roomId를 받는다.
const BUCKET_BY_TYPE = {
  student: "feedback-videos",
  demo: "demo-videos",
  room: "room-videos",
} as const;

const bodySchema = z.object({
  // 저장 경로의 첫 세그먼트로 쓰이므로 경로 구분자를 허용하지 않는다
  requestId: z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/),
  type: z.enum(["student", "demo", "room"]),
  fileName: z.string().min(1).max(255),
  contentType: z.string().optional(),
});

/**
 * POST /api/feedback/upload-url
 * Supabase Storage에 직접 업로드할 수 있는 signed URL 생성
 * 서버를 거치지 않으므로 Vercel body 크기 제한 무관
 * (용량 상한은 서버에서 강제할 수 없다 — 버킷의 file size limit이 실제 상한)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
    }
    const { requestId, type, fileName } = parsed.data;

    const bucket = BUCKET_BY_TYPE[type];
    const ext = (fileName.split(".").pop() || "mp4").replace(/[^A-Za-z0-9]/g, "") || "mp4";
    const path = `${requestId}/${userId}_${Date.now()}.${ext}`;

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
