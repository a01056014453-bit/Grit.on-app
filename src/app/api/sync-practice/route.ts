import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

interface SyncSession {
  pieceId?: string;
  pieceName: string;
  composer?: string;
  startTime: string;
  endTime: string;
  totalTime: number;
  practiceTime: number;
  practiceType?: string;
  label?: string;
  measureRange?: { start: number; end: number };
  todoNote?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId: string = body.userId;
    const sessions: SyncSession[] = body.sessions ?? [];
    const nickname: string = body.nickname ?? "익명";
    const instrument: string = body.instrument ?? "piano";

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 프로필 확인/생성
    const { data: existingProfile } = await supabaseServer
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!existingProfile) {
      await supabaseServer.from("profiles").insert({
        id: userId,
        nickname,
        instrument: instrument as
          | "piano"
          | "violin"
          | "cello"
          | "flute"
          | "clarinet"
          | "guitar"
          | "vocal",
      });
    }

    // 세션 동기화
    const syncedIds: number[] = [];
    for (const session of sessions) {
      const { error } = await supabaseServer
        .from("practice_sessions")
        .insert({
          user_id: userId,
          piece_id: session.pieceId || null,
          piece_name: session.pieceName,
          composer: session.composer || null,
          start_time: new Date(session.startTime).toISOString(),
          end_time: new Date(session.endTime).toISOString(),
          total_time: session.totalTime,
          practice_time: session.practiceTime,
          practice_type:
            (session.practiceType as
              | "partial"
              | "routine"
              | "runthrough") || null,
          label: session.label || null,
          measure_start: session.measureRange?.start || null,
          measure_end: session.measureRange?.end || null,
          todo_note: session.todoNote || null,
          synced: true,
        });

      if (!error) {
        syncedIds.push(syncedIds.length);
      }
    }

    // 일일 랭킹 업데이트
    const today = new Date().toISOString().split("T")[0];
    const { data: todaySessions } = await supabaseServer
      .from("practice_sessions")
      .select("practice_time, piece_name")
      .eq("user_id", userId)
      .gte("start_time", `${today}T00:00:00`)
      .lte("start_time", `${today}T23:59:59.999`);

    const totalPracticeTime = (todaySessions || []).reduce(
      (sum, s) => sum + s.practice_time,
      0
    );
    const lastSong =
      todaySessions && todaySessions.length > 0
        ? todaySessions[todaySessions.length - 1].piece_name
        : null;

    const rankingData = {
      net_practice_time: totalPracticeTime,
      current_song: lastSong,
      is_practicing: false,
      grit_score: Math.min(100, Math.round(totalPracticeTime / 36)),
    };

    const { data: existingRanking } = await supabaseServer
      .from("daily_rankings")
      .select("id")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    if (existingRanking) {
      await supabaseServer
        .from("daily_rankings")
        .update(rankingData)
        .eq("id", existingRanking.id);
    } else {
      await supabaseServer.from("daily_rankings").insert({
        user_id: userId,
        date: today,
        ...rankingData,
      });
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncedIds.length,
    });
  } catch (error) {
    console.error("[sync-practice] 서버 오류:", error);
    return NextResponse.json(
      { error: "동기화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
