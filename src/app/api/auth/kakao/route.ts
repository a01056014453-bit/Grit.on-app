import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/kakao
 * 카카오 인가 코드 → 토큰 교환 → 사용자 정보 조회
 * 선생님 본인인증 전용 (앱 로그인과 별개)
 */
export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      return NextResponse.json({ error: "code, redirectUri 필수" }, { status: 400 });
    }

    const clientId = process.env.KAKAO_REST_API_KEY;
    if (!clientId) {
      return NextResponse.json({ error: "KAKAO_REST_API_KEY 미설정" }, { status: 500 });
    }

    // 1. 인가 코드 → 액세스 토큰 교환
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("[kakao] 토큰 교환 실패:", tokenData);
      return NextResponse.json(
        { error: tokenData.error_description || tokenData.error },
        { status: 400 },
      );
    }

    const accessToken = tokenData.access_token;

    // 2. 액세스 토큰 → 사용자 정보 조회
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userData = await userRes.json();

    if (!userRes.ok) {
      console.error("[kakao] 사용자 정보 조회 실패:", userData);
      return NextResponse.json({ error: "사용자 정보 조회 실패" }, { status: 400 });
    }

    // 3. 사용자 정보 추출
    const kakaoAccount = userData.kakao_account ?? {};
    const profile = kakaoAccount.profile ?? {};

    const userInfo = {
      kakaoId: String(userData.id),
      nickname: profile.nickname ?? null,
      email: kakaoAccount.email ?? null,
      profileImage: profile.profile_image_url ?? null,
      // 사업자 인증 시 추가로 받을 수 있는 필드
      name: kakaoAccount.name ?? null,
      phone: kakaoAccount.phone_number ?? null,
    };

    // 3. 토큰 즉시 만료 (본인인증 용도이므로 유지할 필요 없음)
    await fetch("https://kapi.kakao.com/v1/user/logout", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});

    return NextResponse.json({ success: true, user: userInfo });
  } catch (err) {
    console.error("[kakao] 서버 오류:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
