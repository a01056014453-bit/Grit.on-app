import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

type SchoolRow = Tables<"schools">;
type RoomRow = Tables<"rooms">;
type RoomVideoRow = Tables<"room_videos">;
type DesignatedPieceRow = Tables<"designated_pieces">;
type MembershipRow = Tables<"room_memberships">;

export interface School {
  id: string;
  name: string;
  shortName: string;
  type: "designated" | "free";
  year: number;
  deadline: string | null;
  designatedPieces: DesignatedPiece[];
}

export interface DesignatedPiece {
  id: string;
  schoolId: string;
  composer: string;
  title: string;
  fullName: string;
  category: string | null;
  difficulty: string | null;
}

export interface Room {
  id: string;
  schoolId: string;
  memberCount: number;
  videoCount: number;
  school?: School;
}

export interface RoomVideo {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  pieceTitle: string;
  pieceComposer: string;
  section: string | null;
  duration: number;
  tags: string[];
  uploadedAt: string;
  helpfulCount: number;
  faceBlurred: boolean;
  videoUrl: string | null;
}

export async function getSchools(): Promise<School[]> {
  const { data: schools, error: sErr } = await supabase
    .from("schools")
    .select("*")
    .order("name");

  if (sErr || !schools) return [];

  const { data: pieces } = await supabase
    .from("designated_pieces")
    .select("*");

  const piecesBySchool = (pieces ?? []).reduce((acc, p) => {
    if (!acc[p.school_id]) acc[p.school_id] = [];
    acc[p.school_id].push(pieceRowToDesignated(p));
    return acc;
  }, {} as Record<string, DesignatedPiece[]>);

  return schools.map((s) => ({
    id: s.id,
    name: s.name,
    shortName: s.short_name,
    type: s.type as "designated" | "free",
    year: s.year,
    deadline: s.deadline,
    designatedPieces: piecesBySchool[s.id] ?? [],
  }));
}

export async function getSchoolById(id: string): Promise<School | null> {
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const { data: pieces } = await supabase
    .from("designated_pieces")
    .select("*")
    .eq("school_id", id);

  return {
    id: data.id,
    name: data.name,
    shortName: data.short_name,
    type: data.type as "designated" | "free",
    year: data.year,
    deadline: data.deadline,
    designatedPieces: (pieces ?? []).map(pieceRowToDesignated),
  };
}

export async function getRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, schools(*)")
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((r: any) => ({
    id: r.id,
    schoolId: r.school_id,
    memberCount: r.member_count ?? 0,
    videoCount: r.video_count ?? 0,
    school: r.schools
      ? {
          id: r.schools.id,
          name: r.schools.name,
          shortName: r.schools.short_name,
          type: r.schools.type,
          year: r.schools.year,
          deadline: r.schools.deadline,
          designatedPieces: [],
        }
      : undefined,
  }));
}

export async function getRoomById(id: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, schools(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    schoolId: data.school_id,
    memberCount: data.member_count ?? 0,
    videoCount: data.video_count ?? 0,
  };
}

export async function getRoomVideos(roomId: string): Promise<RoomVideo[]> {
  const { data, error } = await supabase
    .from("room_videos")
    .select("*")
    .eq("room_id", roomId)
    .order("uploaded_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((v) => ({
    id: v.id,
    roomId: v.room_id,
    userId: v.user_id,
    userName: v.user_name ?? "익명",
    pieceTitle: v.piece_title,
    pieceComposer: v.piece_composer,
    section: v.section,
    duration: v.duration ?? 0,
    tags: v.tags ?? [],
    uploadedAt: v.uploaded_at ?? "",
    helpfulCount: v.helpful_count ?? 0,
    faceBlurred: v.face_blurred ?? false,
    videoUrl: v.video_url,
  }));
}

export async function getUserMembership(
  userId: string,
  roomId: string
): Promise<MembershipRow | null> {
  const { data, error } = await supabase
    .from("room_memberships")
    .select("*")
    .eq("user_id", userId)
    .eq("room_id", roomId)
    .single();

  if (error) return null;
  return data;
}

export async function joinRoom(
  userId: string,
  roomId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("room_memberships")
    .insert({ user_id: userId, room_id: roomId });

  if (error) {
    console.error("[joinRoom]", error.message);
    return false;
  }
  return true;
}

function pieceRowToDesignated(row: DesignatedPieceRow): DesignatedPiece {
  return {
    id: row.id,
    schoolId: row.school_id,
    composer: row.composer,
    title: row.title,
    fullName: row.full_name,
    category: row.category,
    difficulty: row.difficulty,
  };
}
