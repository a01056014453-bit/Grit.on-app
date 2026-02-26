import { supabase } from "@/lib/supabase";
import type { Tables, Json } from "@/types/database";
import type {
  RecordingListItem,
  RecordingDetail,
  FocusArea,
  TempoAnalysis,
  DynamicsAnalysis,
  RhythmAnalysis,
} from "@/types";

type RecordingRow = Tables<"recordings">;

export async function getRecordings(userId: string): Promise<RecordingListItem[]> {
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getRecordings]", error.message);
    return [];
  }

  return (data ?? []).map(rowToListItem);
}

export async function getRecordingById(
  recordingId: string
): Promise<RecordingDetail | null> {
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .eq("id", recordingId)
    .single();

  if (error) {
    console.error("[getRecordingById]", error.message);
    return null;
  }

  return rowToDetail(data);
}

export function getRecordingsStats(recordings: RecordingListItem[]) {
  if (recordings.length === 0) {
    return { totalRecordings: 0, averageScore: 0, totalDuration: "0:00" };
  }
  const totalDurationSec = recordings.reduce((s, r) => s + r.duration, 0);
  const avgScore = Math.round(
    recordings.reduce((s, r) => s + r.score, 0) / recordings.length
  );
  const hours = Math.floor(totalDurationSec / 3600);
  const mins = Math.floor((totalDurationSec % 3600) / 60);
  return {
    totalRecordings: recordings.length,
    averageScore: avgScore,
    totalDuration: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
  };
}

function rowToListItem(row: RecordingRow): RecordingListItem {
  const focusAreas = Array.isArray(row.focus_areas)
    ? (row.focus_areas as Json[]).length
    : 0;

  return {
    id: row.id,
    pieceTitle: row.piece_title,
    duration: row.duration,
    score: row.score ?? 0,
    date: row.date,
    focusAreas,
    improvement: row.improvement ?? "",
  };
}

function rowToDetail(row: RecordingRow): RecordingDetail {
  const focusAreas = Array.isArray(row.focus_areas)
    ? (row.focus_areas as unknown as FocusArea[])
    : [];

  const tempo: TempoAnalysis = row.tempo
    ? (row.tempo as unknown as TempoAnalysis)
    : { average: 0, target: 0, stability: 0 };

  const dynamics: DynamicsAnalysis = row.dynamics
    ? (row.dynamics as unknown as DynamicsAnalysis)
    : { range: "", consistency: 0 };

  const rhythm: RhythmAnalysis = row.rhythm
    ? (row.rhythm as unknown as RhythmAnalysis)
    : { accuracy: 0, notes: "" };

  const waveform = Array.isArray(row.waveform)
    ? (row.waveform as unknown as number[])
    : [];

  return {
    id: row.id,
    pieceTitle: row.piece_title,
    duration: row.duration,
    score: row.score ?? 0,
    date: row.date,
    improvement: row.improvement ?? "",
    focusAreas,
    tempo,
    dynamics,
    rhythm,
    waveform,
  };
}
