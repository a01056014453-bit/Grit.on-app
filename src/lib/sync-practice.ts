import { getUserId } from "./user-id";
import { getUnsyncedSessions, markSessionSynced } from "./db";
import { uploadAudioBlob, updateSessionAudioUrl } from "./audio-storage";

export async function syncPracticeSessions(): Promise<void> {
  try {
    const userId = getUserId();
    if (!userId) return;

    const unsynced = await getUnsyncedSessions();

    // 프로필 정보 가져오기 (두 키 모두 확인)
    let nickname = "연습생";
    let instrument = "piano";
    try {
      const saved = localStorage.getItem("grit-on-profile");
      const sempreSaved = localStorage.getItem("sempre-user-profile");
      const profile = saved ? JSON.parse(saved) : sempreSaved ? JSON.parse(sempreSaved) : null;
      if (profile) {
        if (profile.nickname) nickname = profile.nickname;
        if (profile.instrument) instrument = profile.instrument;
        // instruments 배열인 경우 (sempre-user-profile 형식)
        if (!profile.instrument && profile.instruments?.length > 0) {
          const instMap: Record<string, string> = { "피아노": "piano", "바이올린": "violin", "첼로": "cello", "비올라": "violin", "플루트": "flute", "클라리넷": "clarinet", "기타": "guitar" };
          instrument = instMap[profile.instruments[0]] || "piano";
        }
      }
    } catch (err) {
      console.warn("[sync-practice] Failed to parse profile:", err);
    }

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

    // 동기화 성공한 세션들 마킹 + 오디오 업로드
    if (result.success) {
      for (const session of unsynced) {
        if (session.id !== undefined) {
          await markSessionSynced(session.id);
        }

        // 오디오 Blob이 있으면 Storage에 업로드
        if (session.audioBlob) {
          try {
            const startTimeStr = new Date(session.startTime).toISOString();
            const audioUrl = await uploadAudioBlob(session.audioBlob, startTimeStr);
            if (audioUrl) {
              await updateSessionAudioUrl(userId, startTimeStr, audioUrl);
            }
          } catch (err) {
            console.error("Failed to upload audio for session:", err);
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to sync practice sessions:", err);
  }
}
