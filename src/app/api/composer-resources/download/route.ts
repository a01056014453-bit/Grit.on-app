import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const BUCKET_NAME = "composer-resources";

/** GET: PDF signed URL 반환 (1시간 유효) */
export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get("path");
    if (!path) {
      return NextResponse.json(
        { error: "path 파라미터 필요" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "URL 생성 실패" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, url: data.signedUrl });
  } catch (error) {
    return NextResponse.json(
      { error: `오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    );
  }
}
