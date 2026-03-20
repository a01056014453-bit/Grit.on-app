import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId, getTeacherIdForUser } from "@/lib/api-auth";
import { createInvitation, getInvitationsByTeacher } from "@/lib/services/invitation";

/** POST /api/teacher/invitations — 초대 링크 생성 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const teacherId = await getTeacherIdForUser(userId);
    if (!teacherId) {
      return NextResponse.json({ error: "선생님 인증이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { studentName, category } = body;

    const baseUrl = new URL(request.url).origin;
    const result = await createInvitation(teacherId, { studentName, category }, baseUrl);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invitation: result.invitation,
      inviteUrl: result.inviteUrl,
    });
  } catch (err) {
    console.error("[POST /api/teacher/invitations]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/** GET /api/teacher/invitations — 보낸 초대 목록 조회 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const teacherId = await getTeacherIdForUser(userId);
    if (!teacherId) {
      return NextResponse.json({ error: "선생님 인증이 필요합니다." }, { status: 403 });
    }

    const invitations = await getInvitationsByTeacher(teacherId);
    return NextResponse.json({ invitations });
  } catch (err) {
    console.error("[GET /api/teacher/invitations]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
