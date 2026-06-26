import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const BUCKET = "recordings";
const SYNC_FOLDER = "sync";

/** Storage 경로: recordings/sync/{userId}.json */
function syncPath(userId: string): string {
  return `${SYNC_FOLDER}/${userId}.json`;
}

/**
 * POST: localStorage 데이터를 Storage에 저장 (push)
 * Body: { userId, data: Record<string, unknown> }
 *
 * data는 키-값 객체. 기존 데이터와 병합(merge)하여 저장.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId: string = body.userId;
    const incoming: Record<string, unknown> = body.data ?? {};

    if (!userId || Object.keys(incoming).length === 0) {
      return NextResponse.json(
        { error: "userId와 data가 필요합니다." },
        { status: 400 }
      );
    }

    const path = syncPath(userId);

    // 기존 데이터 로드 (있으면 병합)
    let existing: Record<string, unknown> = {};
    const { data: blob } = await supabaseServer.storage
      .from(BUCKET)
      .download(path);

    if (blob) {
      try {
        existing = JSON.parse(await blob.text());
      } catch { /* 파싱 실패 시 빈 객체 */ }
    }

    // 병합: incoming이 existing을 덮어씀
    const merged = { ...existing, ...incoming, _updatedAt: new Date().toISOString() };
    const jsonStr = JSON.stringify(merged);
    const file = new Blob([jsonStr], { type: "application/json" });

    const { error } = await supabaseServer.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: "application/json" });

    if (error) {
      console.error("[sync-user-data] upload 오류:", error);
      return NextResponse.json(
        { error: "데이터 저장 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, keys: Object.keys(incoming).length });
  } catch (error) {
    console.error("[sync-user-data] POST 오류:", error);
    return NextResponse.json(
      { error: "동기화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET: Storage에서 사용자 데이터 가져오기 (pull)
 * Query: ?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    const path = syncPath(userId);

    const { data: blob, error: downloadError } = await supabaseServer.storage
      .from(BUCKET)
      .download(path);

    if (downloadError) {
      if (downloadError.message !== "Object not found") {
        console.error("[sync-user-data] Storage 오류:", downloadError.message);
      }
      return NextResponse.json({ success: true, data: {} });
    }
    if (!blob) {
      return NextResponse.json({ success: true, data: {} });
    }

    const text = await blob.text();
    const data = JSON.parse(text);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[sync-user-data] GET 오류:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
