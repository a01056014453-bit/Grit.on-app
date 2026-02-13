// localStorage-based store for teacher mode
import {
  TeacherVerification,
  TeacherVerificationStatus,
  TeacherDocument,
  ManagedStudent,
  TeacherProfile,
  TeacherDashboardStats,
} from "@/types";
import { getFeedbackRequestsForTeacher } from "./feedback-store";

const PROFILE_KEY = "grit-on-profile";
const VERIFICATION_KEY = "grit-on-teacher-verification";
const VERIFICATIONS_LIST_KEY = "grit-on-teacher-verifications-list";
const STUDENTS_KEY = "grit-on-teacher-students";

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

export function submitVerification(documents: TeacherDocument[]): TeacherVerification {
  const id = `v-${Date.now()}`;
  const verification: TeacherVerification = {
    id,
    applicantName: getApplicantName(),
    specialty: [getApplicantInstrument()],
    status: "pending",
    documents,
    appliedAt: new Date().toISOString(),
  };
  saveVerification(verification);
  // Also add to admin-visible list
  addToVerificationsList(verification);
  return verification;
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
  if (idx < 0) return;
  list[idx].status = "approved";
  list[idx].reviewedAt = new Date().toISOString();
  saveAllVerifications(list);

  // If this is the current user's verification, sync
  const current = getVerification();
  if (current.id === id) {
    current.status = "approved";
    current.reviewedAt = list[idx].reviewedAt;
    saveVerification(current);
    updateTeacherProfile({ isTeacher: true, teacherProfileId: "t8" });
  }
}

export function rejectVerificationById(id: string, reason: string): void {
  const list = getAllVerifications();
  const idx = list.findIndex((item) => item.id === id);
  if (idx < 0) return;
  list[idx].status = "rejected";
  list[idx].reviewedAt = new Date().toISOString();
  list[idx].rejectReason = reason;
  saveAllVerifications(list);

  // If this is the current user's verification, sync
  const current = getVerification();
  if (current.id === id) {
    current.status = "rejected";
    current.reviewedAt = list[idx].reviewedAt;
    current.rejectReason = reason;
    saveVerification(current);
  }
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
