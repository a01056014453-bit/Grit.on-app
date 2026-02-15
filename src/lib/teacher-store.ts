// localStorage-based store for teacher mode (+ Supabase sync)
import {
  TeacherVerification,
  TeacherVerificationStatus,
  TeacherDocument,
  ManagedStudent,
  TeacherProfile,
  TeacherDashboardStats,
  AIReview,
  TeacherProfileData,
} from "@/types";
import { getFeedbackRequestsForTeacher } from "./feedback-store";
import { supabase } from "./supabase";

const PROFILE_KEY = "grit-on-profile";
const VERIFICATION_KEY = "grit-on-teacher-verification";
const VERIFICATIONS_LIST_KEY = "grit-on-teacher-verifications-list";
const STUDENTS_KEY = "grit-on-teacher-students";
const TEACHER_PROFILE_DATA_KEY = "grit-on-teacher-profile-data";

// ─── Teacher Profile (extends existing profile) ───

export function getTeacherProfile(): TeacherProfile {
  if (typeof window === "undefined") {
    return { isTeacher: false, teacherMode: false };
  }
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      const profile = JSON.parse(saved);
      return {
        isTeacher: profile.isTeacher || false,
        teacherMode: profile.teacherMode || false,
        teacherProfileId: profile.teacherProfileId,
      };
    }
  } catch {}
  return { isTeacher: false, teacherMode: false };
}

export function updateTeacherProfile(updates: Partial<TeacherProfile>): void {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    const current = saved ? JSON.parse(saved) : {};
    const updated = { ...current, ...updates };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  } catch {}
}

export function toggleTeacherMode(): boolean {
  const profile = getTeacherProfile();
  if (!profile.isTeacher) return false;
  const newMode = !profile.teacherMode;
  updateTeacherProfile({ teacherMode: newMode });
  return newMode;
}

// ─── Verification ───

const DEFAULT_VERIFICATION: TeacherVerification = {
  id: "",
  applicantName: "",
  specialty: [],
  status: "none",
  documents: [],
};

// ─── Current user's verification ───

export function getVerification(): TeacherVerification {
  if (typeof window === "undefined") return DEFAULT_VERIFICATION;
  try {
    const saved = localStorage.getItem(VERIFICATION_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_VERIFICATION;
}

export function saveVerification(verification: TeacherVerification): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VERIFICATION_KEY, JSON.stringify(verification));
}

function getApplicantName(): string {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      const profile = JSON.parse(saved);
      return profile.nickname || "사용자";
    }
  } catch {}
  return "사용자";
}

function getApplicantInstrument(): string {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      const profile = JSON.parse(saved);
      return profile.instrument || "피아노";
    }
  } catch {}
  return "피아노";
}

export function submitVerification(documents: TeacherDocument[], aiReview?: AIReview): TeacherVerification {
  const id = `v-${Date.now()}`;
  const verification: TeacherVerification = {
    id,
    applicantName: getApplicantName(),
    specialty: [getApplicantInstrument()],
    status: "pending",
    documents,
    appliedAt: new Date().toISOString(),
    aiReview,
  };
  saveVerification(verification);
  // Also add to admin-visible list
  addToVerificationsList(verification);
  // Supabase에도 저장 (기기 간 공유)
  submitVerificationToSupabase(verification).catch(() => {});
  return verification;
}

async function submitVerificationToSupabase(v: TeacherVerification): Promise<void> {
  await supabase.from("teachers").upsert({
    id: v.id,
    name: v.applicantName,
    specialty: v.specialty,
    verified: false,
    career: JSON.parse(JSON.stringify({
      verification: {
        status: v.status,
        documents: v.documents.map((d) => ({ id: d.id, type: d.type, fileName: d.fileName, uploadedAt: d.uploadedAt })),
        aiReview: v.aiReview ?? null,
        appliedAt: v.appliedAt,
      },
    })),
  });
}

export function approveVerification(): void {
  const verification = getVerification();
  verification.status = "approved";
  verification.reviewedAt = new Date().toISOString();
  saveVerification(verification);
  // Sync to list
  updateVerificationInList(verification.id, { status: "approved", reviewedAt: verification.reviewedAt });
  // Update profile
  updateTeacherProfile({ isTeacher: true, teacherProfileId: "t8" });
}

export function rejectVerification(reason: string): void {
  const verification = getVerification();
  verification.status = "rejected";
  verification.reviewedAt = new Date().toISOString();
  verification.rejectReason = reason;
  saveVerification(verification);
  // Sync to list
  updateVerificationInList(verification.id, { status: "rejected", reviewedAt: verification.reviewedAt, rejectReason: reason });
}

// ─── All verifications list (for admin) ───

export function getAllVerifications(): TeacherVerification[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(VERIFICATIONS_LIST_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveAllVerifications(list: TeacherVerification[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VERIFICATIONS_LIST_KEY, JSON.stringify(list));
}

function addToVerificationsList(v: TeacherVerification): void {
  const list = getAllVerifications();
  // Replace if same id exists
  const idx = list.findIndex((item) => item.id === v.id);
  if (idx >= 0) {
    list[idx] = v;
  } else {
    list.unshift(v);
  }
  saveAllVerifications(list);
}

function updateVerificationInList(id: string, updates: Partial<TeacherVerification>): void {
  const list = getAllVerifications();
  const idx = list.findIndex((item) => item.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updates };
    saveAllVerifications(list);
  }
}

export function approveVerificationById(id: string): void {
  const list = getAllVerifications();
  const idx = list.findIndex((item) => item.id === id);
  if (idx >= 0) {
    list[idx].status = "approved";
    list[idx].reviewedAt = new Date().toISOString();
    saveAllVerifications(list);
  }

  // If this is the current user's verification, sync
  const current = getVerification();
  if (current.id === id) {
    current.status = "approved";
    current.reviewedAt = new Date().toISOString();
    saveVerification(current);
    updateTeacherProfile({ isTeacher: true, teacherProfileId: "t8" });
  }

  // Supabase 동기화
  approveVerificationInSupabase(id).catch(() => {});
}

export function rejectVerificationById(id: string, reason: string): void {
  const list = getAllVerifications();
  const idx = list.findIndex((item) => item.id === id);
  if (idx >= 0) {
    list[idx].status = "rejected";
    list[idx].reviewedAt = new Date().toISOString();
    list[idx].rejectReason = reason;
    saveAllVerifications(list);
  }

  // If this is the current user's verification, sync
  const current = getVerification();
  if (current.id === id) {
    current.status = "rejected";
    current.reviewedAt = new Date().toISOString();
    current.rejectReason = reason;
    saveVerification(current);
  }

  // Supabase 동기화
  rejectVerificationInSupabase(id, reason).catch(() => {});
}

// ─── Supabase 연동 (기기 간 공유) ───

export async function getAllVerificationsFromSupabase(): Promise<TeacherVerification[]> {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .filter((row) => {
      const career = row.career as Record<string, unknown> | null;
      return career && typeof career === "object" && "verification" in career;
    })
    .map((row) => {
      const career = row.career as { verification: Record<string, unknown> };
      const v = career.verification;
      return {
        id: row.id,
        applicantName: row.name,
        specialty: row.specialty ?? [],
        status: (row.verified ? "approved" : (v.status as string) || "pending") as TeacherVerificationStatus,
        documents: (v.documents as TeacherDocument[]) ?? [],
        appliedAt: v.appliedAt as string | undefined,
        reviewedAt: v.reviewedAt as string | undefined,
        rejectReason: v.rejectReason as string | undefined,
        aiReview: v.aiReview as AIReview | undefined,
      };
    });
}

async function approveVerificationInSupabase(id: string): Promise<void> {
  const { data: row } = await supabase.from("teachers").select("career").eq("id", id).single();
  if (!row) return;
  const career = (row.career as Record<string, unknown>) ?? {};
  const verification = (career.verification as Record<string, unknown>) ?? {};
  await supabase.from("teachers").update({
    verified: true,
    career: { ...career, verification: { ...verification, status: "approved", reviewedAt: new Date().toISOString() } },
  }).eq("id", id);
}

async function rejectVerificationInSupabase(id: string, reason: string): Promise<void> {
  const { data: row } = await supabase.from("teachers").select("career").eq("id", id).single();
  if (!row) return;
  const career = (row.career as Record<string, unknown>) ?? {};
  const verification = (career.verification as Record<string, unknown>) ?? {};
  await supabase.from("teachers").update({
    career: { ...career, verification: { ...verification, status: "rejected", reviewedAt: new Date().toISOString(), rejectReason: reason } },
  }).eq("id", id);
}

// ─── Managed Students ───

export function getManagedStudents(): ManagedStudent[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STUDENTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function saveManagedStudents(students: ManagedStudent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function initManagedStudents(students: ManagedStudent[]): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(STUDENTS_KEY)) {
    saveManagedStudents(students);
  }
}

export function getManagedStudentById(id: string): ManagedStudent | undefined {
  return getManagedStudents().find((s) => s.id === id);
}

// ─── Dashboard Stats ───

export function getTeacherDashboardStats(teacherId: string): TeacherDashboardStats {
  const students = getManagedStudents();
  const requests = getFeedbackRequestsForTeacher(teacherId);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const pending = requests.filter((r) => r.status === "SENT").length;
  const active = requests.filter((r) => r.status === "ACCEPTED").length;
  const completedThisMonth = requests.filter(
    (r) =>
      ["SUBMITTED", "COMPLETED"].includes(r.status) &&
      r.completedAt &&
      new Date(r.completedAt) >= monthStart
  ).length;

  const completedRequests = requests.filter((r) =>
    ["SUBMITTED", "COMPLETED"].includes(r.status)
  );
  const totalCredits = completedRequests.reduce((sum, r) => sum + r.creditAmount, 0);

  return {
    totalStudents: students.length,
    pendingRequests: pending,
    activeRequests: active,
    completedThisMonth,
    totalCreditsEarned: totalCredits,
    avgRating: 4.8,
    responseRate: 96,
  };
}

// ─── Teacher Profile Data (editable profile) ───

const DEFAULT_TEACHER_PROFILE_DATA: TeacherProfileData = {
  title: "",
  specialty: [],
  bio: "",
  lessonTarget: [],
  availableDays: [],
  priceCredits: 30,
  career: {
    education: [],
    awards: [],
    performances: [],
    teachingExperience: 0,
  },
};

export function getTeacherProfileData(): TeacherProfileData {
  if (typeof window === "undefined") return DEFAULT_TEACHER_PROFILE_DATA;
  try {
    const saved = localStorage.getItem(TEACHER_PROFILE_DATA_KEY);
    if (saved) return { ...DEFAULT_TEACHER_PROFILE_DATA, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_TEACHER_PROFILE_DATA;
}

export function saveTeacherProfileData(data: TeacherProfileData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEACHER_PROFILE_DATA_KEY, JSON.stringify(data));
}
