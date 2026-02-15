import { supabase } from "./supabase";
import { getUserId } from "./user-id";
import { getUnsyncedSessions, markSessionSynced } from "./db";

async function ensureProfile(): Promise<void> {
  const userId = getUserId();
  if (!userId) return;

  let nickname = "익명";
  let instrument = "piano";
  try {
    const saved = localStorage.getItem("grit-on-profile");
    if (saved) {
      const profile = JSON.parse(saved);
      if (profile.nickname) nickname = profile.nickname;
      if (profile.instrument) instrument = profile.instrument;
    }
  } catch {}

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (!data) {
    await supabase.from("profiles").insert({
      id: userId,
      nickname,
      instrument: instrument as "piano" | "violin" | "cello" | "flute" | "clarinet" | "guitar" | "vocal",
    });
  }
}

export async function syncPracticeSessions(): Promise<void> {
  try {
    const userId = getUserId();
    if (!userId) return;

    await ensureProfile();

    const unsynced = await getUnsyncedSessions();
    if (unsynced.length === 0) {
      await updateDailyRanking();
      return;
    }

    for (const session of unsynced) {
      const { error } = await supabase.from("practice_sessions").insert({
        user_id: userId,
        piece_id: session.pieceId || null,
        piece_name: session.pieceName,
        composer: session.composer || null,
        start_time: new Date(session.startTime).toISOString(),
        end_time: new Date(session.endTime).toISOString(),
        total_time: session.totalTime,
        practice_time: session.practiceTime,
        practice_type: (session.practiceType as "partial" | "routine" | "runthrough") || null,
        label: session.label || null,
        measure_start: session.measureRange?.start || null,
        measure_end: session.measureRange?.end || null,
        todo_note: session.todoNote || null,
        synced: true,
      });

      if (!error && session.id !== undefined) {
        await markSessionSynced(session.id);
      }
    }

    await updateDailyRanking();
  } catch (err) {
    console.error("Failed to sync practice sessions:", err);
  }
}

async function updateDailyRanking(): Promise<void> {
  try {
    const userId = getUserId();
    if (!userId) return;

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("practice_sessions")
      .select("practice_time, piece_name")
      .eq("user_id", userId)
      .gte("start_time", `${today}T00:00:00`)
      .lte("start_time", `${today}T23:59:59.999`);

    if (error) throw error;

    const totalPracticeTime = (data || []).reduce((sum, s) => sum + s.practice_time, 0);
    const lastSong = data && data.length > 0 ? data[data.length - 1].piece_name : null;

    const rankingData = {
      net_practice_time: totalPracticeTime,
      current_song: lastSong,
      is_practicing: false,
      grit_score: Math.min(100, Math.round(totalPracticeTime / 36)),
    };

    const { data: existing } = await supabase
      .from("daily_rankings")
      .select("id")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("daily_rankings")
        .update(rankingData)
        .eq("id", existing.id);
    } else {
      await supabase.from("daily_rankings").insert({
        user_id: userId,
        date: today,
        ...rankingData,
      });
    }
  } catch (err) {
    console.error("Failed to update daily ranking:", err);
  }
}
