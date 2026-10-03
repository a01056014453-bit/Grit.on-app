import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";
import { getRequestUserId } from "@/lib/api-auth";

const bodySchema = z.object({
  roomId: z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/),
  videoUrl: z.string().url(),
  pieceComposer: z.string().max(200).default(""),
  pieceTitle: z.string().max(200).default(""),
  section: z.string().max(200).default(""),
  pieceId: z.string().max(100).nullish(),
  userName: z.string().max(50).default("연습생"),
});

/**
 * POST /api/rooms/upload-video
 * 입시룸 영상 등록 — room_videos INSERT + counts 업데이트
 * 파일 자체는 클라이언트가 /api/feedback/upload-url(type: "room")의 signed URL로
 * Storage에 직접 올린다 (Vercel 함수 body 한도 ~4.5MB 때문에 서버 경유 불가).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const { roomId, videoUrl, pieceComposer, pieceTitle, section, userName } = parsed.data;
    const pieceId = parsed.data.pieceId ?? null;

    // upload-url이 발급하는 경로는 `{roomId}/{userId}_...` — 본인이 이 룸에 올린 파일만 등록 가능
    const { data: prefixData } = supabaseServer.storage
      .from("room-videos")
      .getPublicUrl(`${roomId}/${userId}_`);
    if (!videoUrl.startsWith(prefixData.publicUrl)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 1. room_videos INSERT
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseServer as any;

    const { error: insertError } = await db
      .from("room_videos")
      .insert({
        room_id: roomId,
        user_id: userId,
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

    // 2. rooms.video_count 증가
    const { data: room } = await db
      .from("rooms")
      .select("video_count, member_count")
      .eq("id", roomId)
      .single();

    if (room) {
      await db
        .from("rooms")
        .update({ video_count: (room.video_count || 0) + 1 })
        .eq("id", roomId);
    }

    // 3. room_memberships 업데이트 (자동 가입 + uploaded 업데이트)
    const { data: membership } = await db
      .from("room_memberships")
      .select("id, uploaded_piece_ids")
      .eq("user_id", userId)
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
          user_id: userId,
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
