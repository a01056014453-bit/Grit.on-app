import { NextRequest, NextResponse } from "next/server";
import { getInvitationByToken } from "@/lib/services/invitation";

/** GET /api/invitations/:token — 초대 유효성 확인 (공개) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json({ error: "존재하지 않는 초대입니다." }, { status: 404 });
    }

    return NextResponse.json({ invitation });
  } catch (err) {
    console.error("[GET /api/invitations/:token]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
