import type { ProblemType } from "./feedback";

// ─── Help Request (공개 해결 요청) ─────────────────────────

export type HelpRequestStatus = "open" | "reviewing" | "closed";

export interface HelpRequest {
  id: string;
  studentId: string;
  studentName: string; // 프로필에서 조인 or "익명의 학생"
  composer: string;
  piece: string;
  measureStart: number;
  measureEnd: number;
  problemType: ProblemType;
  description: string;
  videoUrl?: string;
  videoLength?: number; // 초
  faceBlurred: boolean;
  isAnonymous: boolean;
  status: HelpRequestStatus;
  deadline: string; // ISO timestamp
  credit: number;
  maxProposals: number;
  proposalCount: number;
  acceptedProposalId?: string;
  createdAt: string;
}

// ─── Help Proposal (전문가 해결 제안) ──────────────────────

export interface HelpProposalComment {
  measure: string; // "33-34"
  text: string;
}

export interface HelpPracticeCard {
  section: string;
  tempo: string;
  steps: string[];
  dailyTime: string; // "15분" 등
}

export interface HelpProposal {
  id: string;
  requestId: string;
  expertId: string;
  expertName: string;
  expertBadge: string; // "전문가" | "상급생"
  trustScore: number;
  completedCount: number;
  comments: HelpProposalComment[];
  demoVideoUrl?: string;
  demoVideoLength?: number;
  practiceCard: HelpPracticeCard;
  submittedAt: string;
}

// ─── 라벨 매핑 ─────────────────────────────────────────────

export const HELP_STATUS_LABELS: Record<HelpRequestStatus, string> = {
  open: "모집 중",
  reviewing: "검토 중",
  closed: "완료",
};

export const HELP_STATUS_COLORS: Record<HelpRequestStatus, string> = {
  open: "bg-green-100 text-green-700",
  reviewing: "bg-amber-100 text-amber-700",
  closed: "bg-gray-100 text-gray-600",
};

export const HELP_PROBLEM_TYPE_LABELS: Record<string, string> = {
  rhythm: "리듬",
  tempo: "템포",
  hands: "양손 합",
  pedal: "페달",
  voicing: "보이싱",
  technique: "테크닉",
  expression: "표현",
  other: "기타",
};
