import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

export const maxDuration = 60;

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * POST /api/rooms/upload-video
 * 입시룸 영상 업로드 — Storage 저장 + room_videos INSERT + counts 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    // 인증
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const roomId = formData.get("roomId") as string;
    const pieceComposer = formData.get("pieceComposer") as string || "";
    const pieceTitle = formData.get("pieceTitle") as string || "";
    const section = formData.get("section") as string || "";
    const pieceId = formData.get("pieceId") as string || null;
    const userName = formData.get("userName") as string || "연습생";

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }
    if (!roomId) {
      return NextResponse.json({ error: "룸 ID가 필요합니다." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "영상 파일만 업로드 가능합니다." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "50MB 이하 영상만 업로드 가능합니다." }, { status: 413 });
    }

    // 1. Storage 업로드
    const ext = file.name.split(".").pop() || "mp4";
    const timestamp = Date.now();
    const path = `${roomId}/${user.id}_${timestamp}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseServer.storage
      .from("room-videos")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("[rooms/upload] Storage error:", uploadError.message);
      return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
    }

    const { data: urlData } = supabaseServer.storage
      .from("room-videos")
      .getPublicUrl(path);
    const videoUrl = urlData.publicUrl;

    // 2. room_videos INSERT
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseServer as any;

    const { error: insertError } = await db
      .from("room_videos")
      .insert({
        room_id: roomId,
        user_id: user.id,
        piece_id: pieceId,
        piece_composer: pieceComposer,
        piece_title: pieceTitle,
        section,
        video_url: videoUrl,
        user_name: userName,
        duration: 0,
        helpful_count: 0,
        face_blurred: false,
        tags: [],
      });

    if (insertError) {
      console.error("[rooms/upload] Insert error:", insertError.message);
      return NextResponse.json({ error: "영상 정보 저장에 실패했습니다." }, { status: 500 });
    }

    // 3. rooms.video_count 증가
    const { data: room } = await db
      .from("rooms")
      .select("video_count")
      .eq("id", roomId)
      .single();

    if (room) {
      await db
        .from("rooms")
        .update({ video_count: (room.video_count || 0) + 1 })
        .eq("id", roomId);
    }

    // 4. room_memberships 업데이트 (자동 가입 + uploaded 업데이트)
    const { data: membership } = await db
      .from("room_memberships")
      .select("id, uploaded_piece_ids")
      .eq("user_id", user.id)
      .eq("room_id", roomId)
      .single();

    if (membership && pieceId) {
      const existingIds = membership.uploaded_piece_ids || [];
      if (!existingIds.includes(pieceId)) {
        await db
          .from("room_memberships")
          .update({ uploaded_piece_ids: [...existingIds, pieceId] })
          .eq("id", membership.id);
      }
    } else if (!membership) {
      await db
        .from("room_memberships")
        .insert({
          user_id: user.id,
          room_id: roomId,
          uploaded_piece_ids: pieceId ? [pieceId] : [],
        });

      // member_count 증가
      if (room) {
        await db
          .from("rooms")
          .update({ member_count: (room.member_count || 0) + 1 })
          .eq("id", roomId);
      }
    }

    return NextResponse.json({ success: true, videoUrl });
  } catch (err) {
    console.error("[rooms/upload] error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
