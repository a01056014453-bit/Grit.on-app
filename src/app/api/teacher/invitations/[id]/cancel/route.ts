import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId, getTeacherIdForUser } from "@/lib/api-auth";
import { cancelInvitation } from "@/lib/services/invitation";

/** POST /api/teacher/invitations/:id/cancel — 초대 취소 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const teacherId = await getTeacherIdForUser(userId);
    if (!teacherId) {
      return NextResponse.json({ error: "선생님 인증이 필요합니다." }, { status: 403 });
    }

    const { id } = await params;
    const result = await cancelInvitation(id, teacherId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/teacher/invitations/:id/cancel]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
