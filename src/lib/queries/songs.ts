import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";
import type { Song } from "@/types";

type SongRow = Tables<"songs">;

export async function getUserSongs(userId: string): Promise<Song[]> {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("user_id", userId)
    .order("last_practiced_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[getUserSongs]", error.message);
    return [];
  }
  return (data ?? []).map(songRowToSong);
}

export async function addSong(
  userId: string,
  song: { title: string; composer?: string; opus?: string; duration?: string }
): Promise<Song | null> {
  const { data, error } = await supabase
    .from("songs")
    .insert({
      user_id: userId,
      title: song.title,
      composer: song.composer ?? null,
      opus: song.opus ?? null,
      duration: song.duration ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[addSong]", error.message);
    return null;
  }
  return songRowToSong(data);
}

export async function deleteSong(songId: string): Promise<boolean> {
  const { error } = await supabase.from("songs").delete().eq("id", songId);
  if (error) {
    console.error("[deleteSong]", error.message);
    return false;
  }
  return true;
}

function songRowToSong(row: SongRow): Song {
  const lastPracticed = row.last_practiced_at
    ? formatRelativeDate(row.last_practiced_at)
    : "미연습";

  return {
    id: row.id,
    title: row.composer ? `${row.composer} ${row.title}` : row.title,
    duration: row.duration ?? "",
    lastPracticed,
  };
}

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}달 전`;
}
