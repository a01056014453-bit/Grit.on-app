import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// help_requests/help_proposals 테이블이 database.ts 타입에 아직 없으므로 untyped 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

/** GET /api/help-requests/[id] — 상세 조회 (요청 + 제안 목록) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 요청 상세
    const { data: reqData, error: reqError } = await db
      .from("help_requests")
      .select(
        `*, profiles!help_requests_student_id_fkey(nickname), help_proposals(count)`
      )
      .eq("id", id)
      .single();

    if (reqError || !reqData) {
      return NextResponse.json(
        { error: "요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const profiles = reqData.profiles as { nickname?: string } | null;
    const proposalAgg = reqData.help_proposals as [{ count: number }] | undefined;
    const isAnonymous = (reqData.is_anonymous as boolean) ?? true;

    const helpRequest = {
      id: reqData.id,
      studentId: reqData.student_id,
      studentName: isAnonymous ? "익명의 학생" : profiles?.nickname ?? "연습생",
      composer: reqData.composer,
      piece: reqData.piece,
      measureStart: reqData.measure_start,
      measureEnd: reqData.measure_end,
      problemType: reqData.problem_type,
      description: reqData.description,
      videoUrl: reqData.video_url ?? undefined,
      videoLength: reqData.video_length ?? undefined,
      faceBlurred: reqData.face_blurred ?? true,
      isAnonymous,
      status: reqData.status ?? "open",
      deadline: reqData.deadline,
      credit: reqData.credit ?? 3,
      maxProposals: reqData.max_proposals ?? 5,
      proposalCount: proposalAgg?.[0]?.count ?? 0,
      acceptedProposalId: reqData.accepted_proposal_id ?? undefined,
      createdAt: reqData.created_at,
    };

    // 제안 목록 조회
    const { data: proposalsData, error: proposalsError } = await db
      .from("help_proposals")
      .select(`*, profiles!help_proposals_expert_id_fkey(nickname)`)
      .eq("request_id", id)
      .order("submitted_at", { ascending: true });

    if (proposalsError) {
      console.error("[help-requests/[id] GET] proposals error:", proposalsError);
    }

    // 전문가 완료 건수 조회
    const expertIds = [
      ...new Set(
        (proposalsData ?? []).map((r: Record<string, unknown>) => r.expert_id as string)
      ),
    ];

    const completedCounts = new Map<string, number>();
    if (expertIds.length > 0) {
      const { data: closedData } = await db
        .from("help_proposals")
        .select("expert_id, help_requests!inner(status)")
        .in("expert_id", expertIds);

      if (closedData) {
        for (const row of closedData) {
          const req = row.help_requests as { status?: string } | null;
          if (req?.status === "closed") {
            const eid = row.expert_id as string;
            completedCounts.set(eid, (completedCounts.get(eid) ?? 0) + 1);
          }
        }
      }
    }

    const proposals = (proposalsData ?? []).map(
      (row: Record<string, unknown>) => {
        const expertProfiles = row.profiles as { nickname?: string } | null;
        const expertId = row.expert_id as string;
        const count = completedCounts.get(expertId) ?? 0;
        const comments = (row.comments ?? []) as unknown as {
          measure: string;
          text: string;
        }[];
        const practiceCard = (row.practice_card ?? {
          section: "",
          tempo: "",
          steps: [],
          dailyTime: "",
        }) as Record<string, unknown>;

        return {
          id: row.id,
          requestId: row.request_id,
          expertId,
          expertName: expertProfiles?.nickname ?? "전문가",
          expertBadge: count >= 10 ? "전문가" : "상급생",
          trustScore: Math.round((4.5 + Math.min(count / 50, 0.4)) * 10) / 10,
          completedCount: count,
          comments,
          demoVideoUrl: row.demo_video_url ?? undefined,
          demoVideoLength: row.demo_video_length ?? undefined,
          practiceCard,
          submittedAt: row.submitted_at,
        };
      }
    );

    return NextResponse.json({ request: helpRequest, proposals });
  } catch (error) {
    console.error("[help-requests/[id] GET] 서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/** PATCH /api/help-requests/[id] — 상태 업데이트 (채택 등) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, proposalId } = body;

    if (action === "accept" && proposalId) {
      // 제안 채택
      const { error } = await db
        .from("help_requests")
        .update({
          status: "closed",
          accepted_proposal_id: proposalId,
        })
        .eq("id", id);

      if (error) {
        console.error("[help-requests PATCH accept]", error);
        return NextResponse.json(
          { error: "채택에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === "close") {
      const { error } = await db
        .from("help_requests")
        .update({ status: "reviewing" })
        .eq("id", id);

      if (error) {
        console.error("[help-requests PATCH close]", error);
        return NextResponse.json(
          { error: "상태 업데이트에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "알 수 없는 action입니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[help-requests PATCH] 서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
