import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";
import type {
  HelpRequest,
  HelpRequestStatus,
  HelpProposal,
  HelpProposalComment,
  HelpPracticeCard,
} from "@/types/help";
import type { ProblemType } from "@/types/feedback";

// help_requests/help_proposals 테이블이 database.ts 타입에 아직 없으므로 untyped 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── Help Requests ─────────────────────────────────────────

export async function getHelpRequests(): Promise<HelpRequest[]> {
  const { data, error } = await db
    .from("help_requests")
    .select(
      `*, profiles!help_requests_student_id_fkey(nickname), help_proposals(count)`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getHelpRequests]", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profiles = row.profiles as { nickname?: string } | null;
    const proposalAgg = row.help_proposals as
      | [{ count: number }]
      | undefined;

    return rowToHelpRequest(row, profiles, proposalAgg);
  });
}

export async function getHelpRequestById(
  id: string
): Promise<HelpRequest | null> {
  const { data, error } = await db
    .from("help_requests")
    .select(
      `*, profiles!help_requests_student_id_fkey(nickname), help_proposals(count)`
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getHelpRequestById]", error.message);
    return null;
  }

  const profiles = data.profiles as { nickname?: string } | null;
  const proposalAgg = data.help_proposals as
    | [{ count: number }]
    | undefined;

  return rowToHelpRequest(data, profiles, proposalAgg);
}

export async function getMyHelpRequests(
  studentId: string
): Promise<HelpRequest[]> {
  const { data, error } = await db
    .from("help_requests")
    .select(
      `*, profiles!help_requests_student_id_fkey(nickname), help_proposals(count)`
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyHelpRequests]", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profiles = row.profiles as { nickname?: string } | null;
    const proposalAgg = row.help_proposals as
      | [{ count: number }]
      | undefined;
    return rowToHelpRequest(row, profiles, proposalAgg);
  });
}

interface CreateHelpRequestInput {
  studentId: string;
  composer: string;
  piece: string;
  measureStart: number;
  measureEnd: number;
  problemType: ProblemType;
  description: string;
  videoUrl?: string;
  videoLength?: number;
  faceBlurred: boolean;
  isAnonymous: boolean;
  deadline: string;
  credit: number;
  maxProposals?: number;
}

export async function createHelpRequest(
  input: CreateHelpRequestInput
): Promise<HelpRequest | null> {
  const { data, error } = await db
    .from("help_requests")
    .insert({
      student_id: input.studentId,
      composer: input.composer,
      piece: input.piece,
      measure_start: input.measureStart,
      measure_end: input.measureEnd,
      problem_type: input.problemType as string,
      description: input.description,
      video_url: input.videoUrl ?? null,
      video_length: input.videoLength ?? null,
      face_blurred: input.faceBlurred,
      is_anonymous: input.isAnonymous,
      deadline: input.deadline,
      credit: input.credit,
      max_proposals: input.maxProposals ?? 5,
    } as Record<string, unknown>)
    .select(
      `*, profiles!help_requests_student_id_fkey(nickname), help_proposals(count)`
    )
    .single();

  if (error) {
    console.error("[createHelpRequest]", error.message);
    return null;
  }

  const profiles = data.profiles as { nickname?: string } | null;
  const proposalAgg = data.help_proposals as
    | [{ count: number }]
    | undefined;
  return rowToHelpRequest(data, profiles, proposalAgg);
}

export async function acceptProposal(
  requestId: string,
  proposalId: string
): Promise<boolean> {
  const { error } = await db
    .from("help_requests")
    .update({
      status: "closed",
      accepted_proposal_id: proposalId,
    } as Record<string, unknown>)
    .eq("id", requestId);

  if (error) {
    console.error("[acceptProposal]", error.message);
    return false;
  }
  return true;
}

// ─── Help Proposals ────────────────────────────────────────

export async function getProposalsForRequest(
  requestId: string
): Promise<HelpProposal[]> {
  const { data, error } = await db
    .from("help_proposals")
    .select(`*, profiles!help_proposals_expert_id_fkey(nickname)`)
    .eq("request_id", requestId)
    .order("submitted_at", { ascending: true });

  if (error) {
    console.error("[getProposalsForRequest]", error.message);
    return [];
  }

  // 전문가의 완료 건수를 병렬로 조회
  const expertIdSet = new Set<string>();
  for (const r of data ?? []) {
    const row = r as Record<string, unknown>;
    if (row.expert_id) expertIdSet.add(row.expert_id as string);
  }
  const expertIds = [...expertIdSet];

  const completedCounts = await getExpertCompletedCounts(expertIds);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profiles = row.profiles as { nickname?: string } | null;
    const expertId = row.expert_id as string;
    return rowToHelpProposal(row, profiles, completedCounts.get(expertId) ?? 0);
  });
}

interface CreateHelpProposalInput {
  requestId: string;
  expertId: string;
  comments: HelpProposalComment[];
  demoVideoUrl?: string;
  demoVideoLength?: number;
  practiceCard: HelpPracticeCard;
}

export async function createHelpProposal(
  input: CreateHelpProposalInput
): Promise<HelpProposal | null> {
  // 제안 수 제한 체크
  const request = await getHelpRequestById(input.requestId);
  if (!request) return null;
  if (request.status !== "open") return null;
  if (request.proposalCount >= request.maxProposals) return null;

  const { data, error } = await db
    .from("help_proposals")
    .insert({
      request_id: input.requestId,
      expert_id: input.expertId,
      comments: input.comments as unknown as Json,
      demo_video_url: input.demoVideoUrl ?? null,
      demo_video_length: input.demoVideoLength ?? null,
      practice_card: input.practiceCard as unknown as Json,
    } as Record<string, unknown>)
    .select(`*, profiles!help_proposals_expert_id_fkey(nickname)`)
    .single();

  if (error) {
    console.error("[createHelpProposal]", error.message);
    return null;
  }

  // max_proposals에 도달하면 자동으로 reviewing 상태로 전환
  if (request.proposalCount + 1 >= request.maxProposals) {
    await db
      .from("help_requests")
      .update({ status: "reviewing" } as Record<string, unknown>)
      .eq("id", input.requestId);
  }

  const profiles = data.profiles as { nickname?: string } | null;
  return rowToHelpProposal(data, profiles, 0);
}

// ─── Stats ─────────────────────────────────────────────────

export async function getHelpStats(): Promise<{
  activeExperts: number;
  completedCount: number;
  avgResponseHours: number;
}> {
  // 완료된 요청 수
  const { count: completedCount } = await db
    .from("help_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "closed");

  // 활동 전문가 수 (최근 30일 내 제안 제출한 고유 유저)
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const { data: expertData } = await db
    .from("help_proposals")
    .select("expert_id")
    .gte("submitted_at", thirtyDaysAgo);

  const uniqueExperts = new Set(
    (expertData ?? []).map((r: Record<string, unknown>) => r.expert_id)
  );

  return {
    activeExperts: uniqueExperts.size,
    completedCount: completedCount ?? 0,
    avgResponseHours: 4.2, // TODO: 실제 계산
  };
}

// ─── Internal helpers ──────────────────────────────────────

async function getExpertCompletedCounts(
  expertIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (expertIds.length === 0) return counts;

  // 채택된 제안의 expert_id를 집계
  const { data } = await db
    .from("help_requests")
    .select("accepted_proposal_id, help_proposals!help_requests_accepted_proposal_fk(expert_id)")
    .eq("status", "closed")
    .not("accepted_proposal_id", "is", null);

  if (data) {
    for (const row of data) {
      const proposal = row.help_proposals as { expert_id?: string } | null;
      const eid = proposal?.expert_id;
      if (eid && expertIds.includes(eid)) {
        counts.set(eid, (counts.get(eid) ?? 0) + 1);
      }
    }
  }

  return counts;
}

function rowToHelpRequest(
  row: Record<string, unknown>,
  profiles: { nickname?: string } | null,
  proposalAgg: [{ count: number }] | undefined
): HelpRequest {
  const isAnonymous = (row.is_anonymous as boolean) ?? true;
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    studentName: isAnonymous
      ? "익명의 학생"
      : profiles?.nickname ?? "연습생",
    composer: row.composer as string,
    piece: row.piece as string,
    measureStart: row.measure_start as number,
    measureEnd: row.measure_end as number,
    problemType: row.problem_type as ProblemType,
    description: row.description as string,
    videoUrl: (row.video_url as string) ?? undefined,
    videoLength: (row.video_length as number) ?? undefined,
    faceBlurred: (row.face_blurred as boolean) ?? true,
    isAnonymous,
    status: (row.status as HelpRequestStatus) ?? "open",
    deadline: row.deadline as string,
    credit: (row.credit as number) ?? 3,
    maxProposals: (row.max_proposals as number) ?? 5,
    proposalCount: proposalAgg?.[0]?.count ?? 0,
    acceptedProposalId: (row.accepted_proposal_id as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function rowToHelpProposal(
  row: Record<string, unknown>,
  profiles: { nickname?: string } | null,
  completedCount: number
): HelpProposal {
  const comments = (row.comments ?? []) as unknown as HelpProposalComment[];
  const practiceCard = (row.practice_card ?? {
    section: "",
    tempo: "",
    steps: [],
    dailyTime: "",
  }) as unknown as HelpPracticeCard;

  return {
    id: row.id as string,
    requestId: row.request_id as string,
    expertId: row.expert_id as string,
    expertName: profiles?.nickname ?? "전문가",
    expertBadge: completedCount >= 10 ? "전문가" : "상급생",
    trustScore: 4.5 + Math.min(completedCount / 50, 0.4), // 간단 계산
    completedCount,
    comments,
    demoVideoUrl: (row.demo_video_url as string) ?? undefined,
    demoVideoLength: (row.demo_video_length as number) ?? undefined,
    practiceCard,
    submittedAt: row.submitted_at as string,
  };
}
