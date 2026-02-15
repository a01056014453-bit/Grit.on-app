import { NextRequest, NextResponse } from "next/server";

const OMR_SERVER_URL = process.env.OMR_SERVER_URL;

export async function POST(request: NextRequest) {
  try {
    if (!OMR_SERVER_URL) {
      return NextResponse.json(
        { success: false, error: "OMR_SERVER_URL이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const format = request.nextUrl.searchParams.get("format");
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "PDF 파일이 필요합니다." },
        { status: 400 }
      );
    }

    // ── MusicXML 변환 (Audiveris OMR) ──
    if (format === "musicxml") {
      const serverFormData = new FormData();
      serverFormData.append("file", file);

      const response = await fetch(`${OMR_SERVER_URL}/convert-to-musicxml`, {
        method: "POST",
        body: serverFormData,
        signal: AbortSignal.timeout(620000), // 서버 600초 + 여유 20초
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            success: false,
            error: errorData.error || `MusicXML 변환 서버 오류 (${response.status})`,
          },
          { status: response.status }
        );
      }

      const data = await response.json();

      return NextResponse.json({
        success: true,
        musicxml: data.musicxml,
        filename: data.filename,
      });
    }

    // ── 이미지 변환 (기본) ──
    const serverFormData = new FormData();
    serverFormData.append("file", file);
    serverFormData.append("dpi", "200");
    serverFormData.append("max_pages", "20");

    const response = await fetch(`${OMR_SERVER_URL}/convert-to-images`, {
      method: "POST",
      body: serverFormData,
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `변환 서버 오류 (${response.status})`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      images: data.images,
      page_count: data.page_count,
      filename: data.filename,
    });
  } catch (error) {
    console.error("PDF conversion error:", error);

    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json(
        { success: false, error: "PDF 변환 시간 초과" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `PDF 변환 중 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      },
      { status: 500 }
    );
  }
}

/** 서버 상태 확인 */
export async function GET() {
  if (!OMR_SERVER_URL) {
    return NextResponse.json({
      available: false,
      reason: "OMR_SERVER_URL 미설정",
    });
  }

  try {
    const res = await fetch(`${OMR_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json({
      available: true,
      ...data,
    });
  } catch {
    return NextResponse.json({
      available: false,
      reason: "변환 서버 연결 실패",
    });
  }
}
