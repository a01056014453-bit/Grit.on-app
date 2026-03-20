import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId } from "@/lib/api-auth";
import { acceptInvitation } from "@/lib/services/invitation";

/** POST /api/invitations/:token/accept — 초대 수락 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { token } = await params;
    const result = await acceptInvitation(token, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/invitations/:token/accept]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
