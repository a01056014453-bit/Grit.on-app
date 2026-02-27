import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { userId, startTime, audioUrl } = await request.json();

    if (!userId || !startTime || !audioUrl) {
      return NextResponse.json(
        { error: "userId, startTime, audioUrl이 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("practice_sessions")
      .update({ audio_url: audioUrl })
      .eq("user_id", userId)
      .eq("start_time", new Date(startTime).toISOString());

    if (error) {
      console.error("[update-audio-url] DB 오류:", error.message);
      return NextResponse.json(
        { error: "audio_url 업데이트 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[update-audio-url] 서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
