import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const BUCKET_NAME = "sheet-music";

/** 버킷 없으면 자동 생성 */
async function ensureBucket() {
  const { data: buckets } = await supabaseServer.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET_NAME)) {
    await supabaseServer.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 20 * 1024 * 1024,
    });
  }
}

function normalizePath(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_.\-]/g, "");
}

/** POST: PDF / MusicXML 파일을 Supabase Storage에 업로드 */
export async function POST(request: NextRequest) {
  try {
    await ensureBucket();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const composer = formData.get("composer") as string | null;
    const title = formData.get("title") as string | null;
    const fileType = formData.get("fileType") as string | null; // "pdf" | "musicxml"

    if (!file || !composer || !title) {
      return NextResponse.json(
        { success: false, error: "file, composer, title 필요" },
        { status: 400 }
      );
    }

    const ext = fileType === "musicxml" ? "musicxml" : "pdf";
    const storagePath = `${normalizePath(composer)}/${normalizePath(title)}/source.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType:
          file.type ||
          (ext === "pdf" ? "application/pdf" : "application/xml"),
        upsert: true,
      });

    if (error) {
      console.error("[Storage Upload] Error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, path: storagePath });
  } catch (error) {
    console.error("[Storage Upload] Exception:", error);
    return NextResponse.json(
      {
        success: false,
        error: `업로드 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      },
      { status: 500 }
    );
  }
}

/** GET: 저장된 파일의 signed URL 반환 (1시간 유효) */
export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get("path");
    if (!path) {
      return NextResponse.json(
        { success: false, error: "path 파라미터 필요" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600);

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message || "URL 생성 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: data.signedUrl });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/** DELETE: Storage 파일 다운로드 (서버 내부용) */
export async function downloadFromStorage(
  path: string
): Promise<Buffer | null> {
  try {
    const { data, error } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error || !data) return null;

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}
