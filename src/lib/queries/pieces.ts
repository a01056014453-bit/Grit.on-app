import { supabase } from "@/lib/supabase";
import type { Tables, Json } from "@/types/database";

type PieceRow = Tables<"pieces">;
type PieceAnalysisRow = Tables<"piece_analyses">;
type PiecePracticeDataRow = Tables<"piece_practice_data">;

export interface Piece {
  id: string;
  title: string;
  composerShortName: string;
  composerFullName: string;
  composerNationality: string | null;
  opus: string | null;
  key: string | null;
  movement: number | null;
  movementTitle: string | null;
  nickname: string | null;
  analysisStatus: "completed" | "pending" | "failed";
}

export interface PieceAnalysis {
  id: string;
  pieceId: string;
  form: string | null;
  keySignature: string | null;
  timeSignature: string | null;
  totalMeasures: number;
  overallDifficulty: string | null;
  estimatedDuration: number | null;
  sections: Json;
  commonMistakes: string[];
  practiceRecommendations: string[];
}

export interface PiecePracticeData {
  id: string;
  pieceId: string;
  userId: string;
  completionPercentage: number;
  averageAccuracy: number;
  totalPracticeTime: number;
  sessionCount: number;
  lastPracticedAt: string | null;
  measureProgress: Json | null;
}

export async function getAnalyzedPieces(): Promise<Piece[]> {
  const { data, error } = await supabase
    .from("pieces")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(rowToPiece);
}

export async function getPieceById(id: string): Promise<Piece | null> {
  const { data, error } = await supabase
    .from("pieces")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return rowToPiece(data);
}

export async function getPieceAnalysis(
  pieceId: string
): Promise<PieceAnalysis | null> {
  const { data, error } = await supabase
    .from("piece_analyses")
    .select("*")
    .eq("piece_id", pieceId)
    .single();

  if (error) return null;
  return {
    id: data.id,
    pieceId: data.piece_id,
    form: data.form,
    keySignature: data.key_signature,
    timeSignature: data.time_signature,
    totalMeasures: data.total_measures,
    overallDifficulty: data.overall_difficulty,
    estimatedDuration: data.estimated_duration,
    sections: data.sections,
    commonMistakes: data.common_mistakes ?? [],
    practiceRecommendations: data.practice_recommendations ?? [],
  };
}

export async function getUserPracticeData(
  userId: string,
  pieceId: string
): Promise<PiecePracticeData | null> {
  const { data, error } = await supabase
    .from("piece_practice_data")
    .select("*")
    .eq("user_id", userId)
    .eq("piece_id", pieceId)
    .single();

  if (error) return null;
  return {
    id: data.id,
    pieceId: data.piece_id,
    userId: data.user_id,
    completionPercentage: data.completion_percentage ?? 0,
    averageAccuracy: data.average_accuracy ?? 0,
    totalPracticeTime: data.total_practice_time ?? 0,
    sessionCount: data.session_count ?? 0,
    lastPracticedAt: data.last_practiced_at,
    measureProgress: data.measure_progress,
  };
}

function rowToPiece(row: PieceRow): Piece {
  return {
    id: row.id,
    title: row.title,
    composerShortName: row.composer_short_name,
    composerFullName: row.composer_full_name,
    composerNationality: row.composer_nationality,
    opus: row.opus,
    key: row.key,
    movement: row.movement,
    movementTitle: row.movement_title,
    nickname: row.nickname,
    analysisStatus: row.analysis_status ?? "pending",
  };
}
