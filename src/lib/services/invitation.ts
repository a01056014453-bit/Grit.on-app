import { randomBytes } from "crypto";
import { supabaseServer } from "@/lib/supabase-server";
import type { Invitation, CreateInvitationInput, InvitationDetail } from "@/types/invitation";

const INVITE_EXPIRY_DAYS = 7;

// invitations, teacher_students 테이블이 생성된 타입에 없으므로 any 캐스팅
const db = supabaseServer as any;

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function mapRow(row: Record<string, unknown>): Invitation {
  return {
    id: row.id as string,
    teacherId: row.teacher_id as string,
    studentName: (row.student_name as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    category: (row.category as string) ?? undefined,
    token: row.token as string,
    status: row.status as Invitation["status"],
    expiresAt: row.expires_at as string,
    acceptedAt: (row.accepted_at as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── 초대 생성 ───

export async function createInvitation(
  teacherId: string,
  input: CreateInvitationInput,
  baseUrl: string,
): Promise<{ invitation?: Invitation; inviteUrl?: string; error?: string }> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const { data, error } = await db
    .from("invitations")
    .insert({
      teacher_id: teacherId,
      student_name: input.studentName || null,
      category: input.category || null,
      token,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[createInvitation]", error.message);
    return { error: "초대 생성에 실패했습니다." };
  }

  const inviteUrl = `${baseUrl}/invite/${token}`;
  return { invitation: mapRow(data), inviteUrl };
}

// ─── 초대 목록 조회 ───

export async function getInvitationsByTeacher(teacherId: string): Promise<Invitation[]> {
  // 만료 처리: pending이면서 expires_at이 지난 초대를 expired로 변경
  await db
    .from("invitations")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("teacher_id", teacherId)
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());

  const { data, error } = await db
    .from("invitations")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getInvitationsByTeacher]", error.message);
    return [];
  }

  return (data ?? []).map(mapRow);
}

// ─── 초대 취소 ───

export async function cancelInvitation(
  invitationId: string,
  teacherId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: inv } = await db
    .from("invitations")
    .select("status")
    .eq("id", invitationId)
    .eq("teacher_id", teacherId)
    .single();

  if (!inv) return { success: false, error: "초대를 찾을 수 없습니다." };
  if (inv.status !== "pending") return { success: false, error: "대기 중인 초대만 취소할 수 있습니다." };

  const { error } = await db
    .from("invitations")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", invitationId);

  if (error) return { success: false, error: "초대 취소에 실패했습니다." };
  return { success: true };
}

// ─── 토큰으로 초대 조회 (공개) ───

export async function getInvitationByToken(token: string): Promise<InvitationDetail | null> {
  const { data: inv } = await db
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (!inv) return null;

  // 만료 확인
  if (inv.status === "pending" && new Date(inv.expires_at) < new Date()) {
    await db
      .from("invitations")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", inv.id);
    const updated = { ...inv, status: "expired" };
    return addTeacherInfo(mapRow(updated));
  }

  return addTeacherInfo(mapRow(inv));
}

async function addTeacherInfo(invitation: Invitation): Promise<InvitationDetail> {
  const { data: teacher } = await db
    .from("teachers")
    .select("name, specialty")
    .eq("id", invitation.teacherId)
    .single();

  return {
    ...invitation,
    teacherName: teacher?.name ?? "선생님",
    teacherSpecialty: teacher?.specialty ?? [],
  };
}

// ─── 초대 수락 ───

export async function acceptInvitation(
  token: string,
  studentUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: inv } = await db
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (!inv) return { success: false, error: "존재하지 않는 초대입니다." };
  if (inv.status === "accepted") return { success: false, error: "이미 수락된 초대입니다." };
  if (inv.status === "canceled") return { success: false, error: "취소된 초대입니다." };
  if (inv.status === "expired" || new Date(inv.expires_at) < new Date()) {
    return { success: false, error: "만료된 초대입니다." };
  }

  // 이미 연결된 학생인지 확인
  const { data: existingLink } = await db
    .from("teacher_students")
    .select("id")
    .eq("teacher_id", inv.teacher_id)
    .eq("student_id", studentUserId)
    .maybeSingle();

  if (existingLink) {
    // 이미 연결돼 있으면 초대만 accepted로 변경
    await db
      .from("invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", inv.id);
    return { success: true };
  }

  // 학생 프로필 조회
  const { data: profile } = await db
    .from("profiles")
    .select("nickname, instrument")
    .eq("id", studentUserId)
    .single();

  const now = new Date().toISOString();

  // 트랜잭션: invitation 업데이트 + teacher_students 생성
  const { error: invError } = await db
    .from("invitations")
    .update({ status: "accepted", accepted_at: now, updated_at: now })
    .eq("id", inv.id);

  if (invError) {
    console.error("[acceptInvitation] invitation update failed:", invError.message);
    return { success: false, error: "초대 수락에 실패했습니다." };
  }

  const { error: linkError } = await db
    .from("teacher_students")
    .insert({
      teacher_id: inv.teacher_id,
      student_id: studentUserId,
      nickname: profile?.nickname ?? inv.student_name ?? "학생",
      instrument: profile?.instrument ?? "피아노",
      type: inv.category ?? "취미",
      category: inv.category ?? null,
      weekly_practice_minutes: 0,
      current_pieces: [],
      total_lessons: 0,
      completed_lessons: 0,
      joined_at: now,
    });

  if (linkError) {
    console.error("[acceptInvitation] teacher_students insert failed:", linkError.message);
    // 롤백: invitation을 다시 pending으로
    await db
      .from("invitations")
      .update({ status: "pending", accepted_at: null, updated_at: now })
      .eq("id", inv.id);
    return { success: false, error: "학생 등록에 실패했습니다." };
  }

  return { success: true };
}
