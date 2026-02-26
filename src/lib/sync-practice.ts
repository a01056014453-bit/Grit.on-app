import { getUserId } from "./user-id";
import { getUnsyncedSessions, markSessionSynced } from "./db";

export async function syncPracticeSessions(): Promise<void> {
  try {
    const userId = getUserId();
    if (!userId) return;

    const unsynced = await getUnsyncedSessions();

    // 프로필 정보 가져오기
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

    const sessions = unsynced.map((session) => ({
      pieceId: session.pieceId || undefined,
      pieceName: session.pieceName,
      composer: session.composer || undefined,
      startTime: new Date(session.startTime).toISOString(),
      endTime: new Date(session.endTime).toISOString(),
      totalTime: session.totalTime,
      practiceTime: session.practiceTime,
      practiceType: session.practiceType || undefined,
      label: session.label || undefined,
      measureRange: session.measureRange || undefined,
      todoNote: session.todoNote || undefined,
    }));

    const res = await fetch("/api/sync-practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        sessions,
        nickname,
        instrument,
      }),
    });

    if (!res.ok) {
      throw new Error(`동기화 실패: ${res.status}`);
    }

    const result = await res.json();

    // 동기화 성공한 세션들 마킹
    if (result.success) {
      for (const session of unsynced) {
        if (session.id !== undefined) {
          await markSessionSynced(session.id);
        }
      }
    }
  } catch (err) {
    console.error("Failed to sync practice sessions:", err);
  }
}
