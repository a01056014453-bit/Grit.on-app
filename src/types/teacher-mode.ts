// 선생님 시스템 타입 정의

export type TeacherVerificationStatus = "none" | "pending" | "approved" | "rejected";

export type TeacherDocumentType = "enrollment" | "graduation" | "certificate" | "other";

export interface TeacherDocument {
  id: string;
  type: TeacherDocumentType;
  fileName: string;
  fileData: string; // base64
  uploadedAt: string;
}

export interface TeacherVerification {
  id: string;
  applicantName: string;
  specialty: string[];
  status: TeacherVerificationStatus;
  documents: TeacherDocument[];
  appliedAt?: string;
  reviewedAt?: string;
  rejectReason?: string;
}

export interface ManagedStudent {
  id: string;
  nickname: string;
  instrument: string;
  grade: string;
  type: "전공" | "취미";
  profileImage?: string;
  weeklyPracticeMinutes: number;
  currentPieces: string[];
  lastAIScore?: number;
  lastPracticeDate?: string;
  joinedAt: string;
  totalLessons: number;
  completedLessons: number;
}

export interface TeacherDashboardStats {
  totalStudents: number;
  pendingRequests: number;
  activeRequests: number;
  completedThisMonth: number;
  totalCreditsEarned: number;
  avgRating: number;
  responseRate: number;
}

export interface TeacherProfile {
  isTeacher: boolean;
  teacherMode: boolean;
  teacherProfileId?: string; // links to mock teacher (e.g., "t8")
}

export const DOCUMENT_TYPE_LABELS: Record<TeacherDocumentType, string> = {
  enrollment: "재학증명서",
  graduation: "졸업증명서",
  certificate: "자격증",
  other: "기타",
};
