import { createClient } from "@/lib/supabase-browser";
import { getUserId } from "@/lib/user-id";

const BUCKET = "recordings";

/**
 * 오디오 Blob을 Supabase Storage에 업로드하고 공개 URL 반환
 */
export async function uploadAudioBlob(
  blob: Blob,
  sessionStartTime: string
): Promise<string | null> {
  try {
    const userId = getUserId();
    if (!userId) return null;

    const supabase = createClient();
    const timestamp = new Date(sessionStartTime).getTime();
    const ext = blob.type.includes("webm") ? "webm" : "mp4";
    const filePath = `${userId}/${timestamp}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, {
        contentType: blob.type || "audio/webm",
        upsert: true,
      });

    if (error) {
      console.error("Audio upload error:", error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Failed to upload audio:", err);
    return null;
  }
}

/**
 * Supabase practice_sessions 테이블에 audio_url 업데이트
 */
export async function updateSessionAudioUrl(
  userId: string,
  startTime: string,
  audioUrl: string
): Promise<void> {
  try {
    const res = await fetch("/api/update-audio-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, startTime, audioUrl }),
    });
    if (!res.ok) {
      console.error("Failed to update audio URL:", res.status);
    }
  } catch (err) {
    console.error("Failed to update audio URL:", err);
  }
}

/**
 * 특정 날짜의 audio_url이 있는 세션들을 Supabase에서 가져오기
 * startTime → audioUrl 매핑 반환
 */
export async function fetchAudioUrlsForDate(
  dateStr: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const userId = getUserId();
    if (!userId) return result;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("practice_sessions")
      .select("start_time, audio_url")
      .eq("user_id", userId)
      .not("audio_url", "is", null)
      .gte("start_time", `${dateStr}T00:00:00`)
      .lte("start_time", `${dateStr}T23:59:59.999`);

    if (error || !data) return result;

    for (const row of data) {
      if (row.audio_url) {
        result.set(row.start_time, row.audio_url);
      }
    }
  } catch (err) {
    console.error("Failed to fetch audio URLs:", err);
  }
  return result;
}
