// 원포인트 레슨 v2 타입 정의

export type FeedbackRequestStatus =
  | "DRAFT"
  | "HELD"
  | "SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "SUBMITTED"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED";

export type ProblemType =
  | "rhythm"
  | "tempo"
  | "hands"
  | "pedal"
  | "voicing"
  | "technique"
  | "expression"
  | "other";

export type TeacherBadge = "expert" | "fast" | "top_rated";

export interface TeacherEducation {
  school: string;
  degree: string;
  major: string;
  year?: number;
}

export interface TeacherAward {
  competition: string;
  prize: string;
  year: number;
}

export interface TeacherPerformance {
  title: string;
  venue?: string;
  year: number;
}

export interface TeacherCareer {
  education: TeacherEducation[];
  awards: TeacherAward[];
  performances: TeacherPerformance[];
  studentsToUniversity: number; // 대학 보낸 학생 수
  teachingExperience: number; // 레슨 경력 (년)
}

export interface Teacher {
  id: string;
  name: string;
  profileImage?: string;
  title: string; // "서울대 피아노 전공"
  specialty: string[]; // ["쇼팽", "테크닉"]
  rating: number;
  reviewCount: number;
  completedCount: number;
  responseRate: number; // 0-100
  avgResponseTime: number; // 시간 단위
  priceCredits: number;
  bio: string;
  verified: boolean;
  badges: TeacherBadge[];
  career?: TeacherCareer;
}

export interface FeedbackComment {
  measureStart: number;
  measureEnd: number;
  text: string;
}

export interface PracticeCard {
  section: string;
  tempoProgression: string;
  steps: string[];
  dailyMinutes: number;
}

export interface FeedbackRequest {
  id: string;
  studentId: string;
  teacherId: string;
  teacher?: Teacher;

  // 곡 정보
  composer: string;
  piece: string;
  measureStart: number;
  measureEnd: number;
  problemType: ProblemType;
  description: string;

  // 영상
  videoUrl?: string;
  faceBlurred: boolean;

  // 상태 & SLA
  status: FeedbackRequestStatus;
  createdAt: string;
  sentAt?: string;
  acceptDeadline?: string; // sentAt + 12h
  submitDeadline?: string; // acceptedAt + 48h
  acceptedAt?: string;
  submittedAt?: string;
  completedAt?: string;

  // 결제
  creditAmount: number;
  paymentStatus: "pending" | "held" | "released" | "refunded";

  // 추가질문
  clarificationRequest?: string;
  clarificationResponse?: string;

  // 거절 사유
  declineReason?: string;
}

export interface Feedback {
  id: string;
  requestId: string;
  comments: FeedbackComment[];
  demoVideoUrl?: string;
  practiceCard: PracticeCard;
  submittedAt: string;
}

// 상태 라벨 및 색상 매핑
export const STATUS_LABELS: Record<FeedbackRequestStatus, string> = {
  DRAFT: "작성중",
  HELD: "결제대기",
  SENT: "전송됨",
  ACCEPTED: "수락됨",
  DECLINED: "거절됨",
  EXPIRED: "만료됨",
  SUBMITTED: "피드백완료",
  COMPLETED: "완료",
  DISPUTED: "분쟁중",
  REFUNDED: "환불완료",
};

export const STATUS_COLORS: Record<FeedbackRequestStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  HELD: "bg-amber-100 text-amber-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-violet-100 text-violet-700",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-500",
  SUBMITTED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-green-100 text-green-700",
  DISPUTED: "bg-orange-100 text-orange-700",
  REFUNDED: "bg-slate-100 text-slate-500",
};

export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  rhythm: "리듬",
  tempo: "템포",
  hands: "양손 조합",
  pedal: "페달링",
  voicing: "보이싱",
  technique: "테크닉",
  expression: "표현",
  other: "기타",
};

export const BADGE_LABELS: Record<TeacherBadge, string> = {
  expert: "전문가",
  fast: "빠른 응답",
  top_rated: "최고 평점",
};
