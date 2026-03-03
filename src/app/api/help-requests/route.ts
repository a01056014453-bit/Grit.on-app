import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// help_requests/help_proposals 테이블이 database.ts 타입에 아직 없으므로 untyped 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

/** GET /api/help-requests — 전체 목록 조회 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    let query = db
      .from("help_requests")
      .select(
        `*, profiles!help_requests_student_id_fkey(nickname), help_proposals(count)`
      )
      .order("created_at", { ascending: false });

    if (studentId) {
      query = query.eq("student_id", studentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[help-requests GET]", error);
      return NextResponse.json(
        { error: "해결 요청을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    const requests = (data ?? []).map((row: Record<string, unknown>) => {
      const profiles = row.profiles as { nickname?: string } | null;
      const proposalAgg = row.help_proposals as [{ count: number }] | undefined;
      const isAnonymous = (row.is_anonymous as boolean) ?? true;

      return {
        id: row.id,
        studentId: row.student_id,
        studentName: isAnonymous ? "익명의 학생" : profiles?.nickname ?? "연습생",
        composer: row.composer,
        piece: row.piece,
        measureStart: row.measure_start,
        measureEnd: row.measure_end,
        problemType: row.problem_type,
        description: row.description,
        videoUrl: row.video_url ?? undefined,
        videoLength: row.video_length ?? undefined,
        faceBlurred: row.face_blurred ?? true,
        isAnonymous,
        status: row.status ?? "open",
        deadline: row.deadline,
        credit: row.credit ?? 3,
        maxProposals: row.max_proposals ?? 5,
        proposalCount: proposalAgg?.[0]?.count ?? 0,
        acceptedProposalId: row.accepted_proposal_id ?? undefined,
        createdAt: row.created_at,
      };
    });

    // 통계도 함께 반환
    const { count: completedCount } = await db
      .from("help_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "closed");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expertData } = await db
      .from("help_proposals")
      .select("expert_id")
      .gte("submitted_at", thirtyDaysAgo);

    const uniqueExperts = new Set(
      (expertData ?? []).map((r: Record<string, unknown>) => r.expert_id)
    );

    return NextResponse.json({
      requests,
      stats: {
        activeExperts: uniqueExperts.size,
        completedCount: completedCount ?? 0,
        avgResponseHours: 4.2,
      },
    });
  } catch (error) {
    console.error("[help-requests GET] 서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/** POST /api/help-requests — 새 해결 요청 생성 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      studentId,
      composer,
      piece,
      measureStart,
      measureEnd,
      problemType,
      description,
      videoUrl,
      videoLength,
      faceBlurred,
      isAnonymous,
      deadlineHours,
      credit,
      maxProposals,
    } = body;

    // 입력 검증
    if (!studentId || !composer || !piece || !measureStart || !measureEnd || !problemType || !description) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (credit < 2 || credit > 5) {
      return NextResponse.json(
        { error: "크레딧은 2~5 범위여야 합니다." },
        { status: 400 }
      );
    }

    const deadline = new Date(
      Date.now() + (deadlineHours ?? 48) * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await db
      .from("help_requests")
      .insert({
        student_id: studentId,
        composer,
        piece,
        measure_start: measureStart,
        measure_end: measureEnd,
        problem_type: problemType,
        description,
        video_url: videoUrl ?? null,
        video_length: videoLength ?? null,
        face_blurred: faceBlurred ?? true,
        is_anonymous: isAnonymous ?? true,
        deadline,
        credit: credit ?? 3,
        max_proposals: maxProposals ?? 5,
      })
      .select()
      .single();

    if (error) {
      console.error("[help-requests POST]", error);
      return NextResponse.json(
        { error: "요청 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: data }, { status: 201 });
  } catch (error) {
    console.error("[help-requests POST] 서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
