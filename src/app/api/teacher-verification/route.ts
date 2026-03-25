import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/teacher-verification?userId=xxx&localId=yyy
 * 선생님 인증 상태 조회 (서버사이드, RLS 무관)
 * userId와 localId 모두로 검색 시도
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const localId = request.nextUrl.searchParams.get("localId");

    if (!userId && !localId) {
      return NextResponse.json({ error: "userId 또는 localId 필수" }, { status: 400 });
    }

    // 여러 ID로 검색 시도
    const idsToTry = [userId, localId].filter(Boolean) as string[];
    let found = null;

    for (const id of idsToTry) {
      const { data } = await supabaseServer
        .from("teachers")
        .select("id, name, specialty, verified, career")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        found = data;
        break;
      }
    }

    if (!found) {
      return NextResponse.json({ found: false });
    }

    const career = found.career as Record<string, unknown> | null;
    const verification = career && "verification" in career
      ? (career as { verification: Record<string, unknown> }).verification
      : null;

    return NextResponse.json({
      found: true,
      id: found.id,
      name: found.name,
      specialty: found.specialty,
      verified: found.verified,
      verification,
    });
  } catch (err) {
    console.error("[teacher-verification GET]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * POST /api/teacher-verification
 * 선생님 인증 신청을 Supabase에 저장
 * cookie 인증 우선, 실패 시 Authorization 헤더 사용
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, specialty, phone, kakaoId, documents, aiReview, appliedAt } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "id, name 필수" }, { status: 400 });
    }

    // 1. 인증 시도: cookie 기반
    let userId: string | null = null;

    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user) {
      userId = user.id;
    }

    // 2. cookie 인증 실패 시: Authorization 헤더에서 토큰 추출
    if (!userId) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const { data: { user: tokenUser } } = await supabaseServer.auth.getUser(token);
        if (tokenUser) {
          userId = tokenUser.id;
        }
      }
    }

    // 3. userId로 프로필 존재 확인 (인증 대체)
    if (!userId && body.userId) {
      const { data: profile } = await supabaseServer
        .from("profiles")
        .select("id")
        .eq("id", body.userId)
        .single();
      if (profile) {
        userId = body.userId;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "인증 실패. 로그인 후 다시 시도해주세요." },
        { status: 401 }
      );
    }

    // 4. teachers 테이블에 upsert
    const { error } = await supabaseServer
      .from("teachers")
      .upsert({
        id,
        name,
        specialty: specialty ?? [],
        verified: false,
        user_id: userId,
        career: {
          phone: phone ?? null,
          kakaoId: kakaoId ?? null,
          verification: {
            status: "pending",
            documents: documents ?? [],
            aiReview: aiReview ?? null,
            appliedAt: appliedAt ?? new Date().toISOString(),
          },
        },
      });

    if (error) {
      console.error("[teacher-verification] upsert 실패:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Slack 알림 발송 (비동기, 실패해도 무시)
    import("@/lib/slack").then(({ sendSlackNotification, teacherVerificationMessage }) => {
      sendSlackNotification("teacher", teacherVerificationMessage(name, specialty ?? [], id));
    }).catch(() => {});

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error("[teacher-verification] 서버 오류:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
