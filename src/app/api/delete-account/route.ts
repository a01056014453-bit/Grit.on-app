import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * POST /api/delete-account
 * 회원탈퇴: 인증된 유저 본인의 모든 데이터를 삭제하고 Auth 계정도 제거
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. 인증 확인 (쿠키 기반 세션) ──
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // API Route에서는 쿠키 설정 불필요
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ── 2. feedback 관련 테이블 (FK 순서: feedbacks → feedback_requests) ──
    const { data: userRequests } = await supabaseServer
      .from("feedback_requests")
      .select("id")
      .eq("student_id", userId);

    if (userRequests && userRequests.length > 0) {
      const requestIds = userRequests.map((r) => r.id);
      await supabaseServer
        .from("feedbacks")
        .delete()
        .in("request_id", requestIds);
    }

    await supabaseServer
      .from("feedback_requests")
      .delete()
      .eq("student_id", userId);

    // ── 3. 일반 테이블 데이터 삭제 (자식 → 부모 순서) ──
    const TABLES_WITH_USER_ID = [
      "room_videos", // room_memberships 참조하므로 먼저
      "room_memberships",
      "ai_suggestions",
      "daily_plans",
      "daily_rankings",
      "drill_cards",
      "piece_practice_data",
      "practice_sessions",
      "practice_todos",
      "recordings",
      "songs",
      "teachers",
      "weekly_data",
    ] as const;

    const deleteErrors: string[] = [];

    for (const table of TABLES_WITH_USER_ID) {
      const { error } = await supabaseServer
        .from(table)
        .delete()
        .eq("user_id", userId);

      if (error) {
        deleteErrors.push(`${table}: ${error.message}`);
      }
    }

    // ── 4. Storage에서 오디오 파일 + 동기화 데이터 삭제 ──
    // Storage 목록은 기본 페이지 크기로 잘릴 수 있으므로 모든 페이지를 수집한다.
    for (const [bucket, folder, owns] of [
      ['recordings', userId, () => true],
      ['avatars', 'profiles', (name: string) => name.startsWith(userId + '.')],
    ] as const) {
      const paths: string[] = [];
      for (let offset = 0; ; offset += 100) {
        const { data: files, error } = await supabaseServer.storage.from(bucket)
          .list(folder, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
        if (error) { deleteErrors.push(bucket + ': ' + error.message); break; }
        for (const file of files ?? []) {
          if (file.id && owns(file.name)) paths.push(folder + '/' + file.name);
        }
        if (!files || files.length < 100) break;
      }
      for (let offset = 0; offset < paths.length; offset += 100) {
        const { error } = await supabaseServer.storage.from(bucket).remove(paths.slice(offset, offset + 100));
        if (error) deleteErrors.push(bucket + ': ' + error.message);
      }
    }
    const { error: syncError } = await supabaseServer.storage.from('recordings').remove([
      'sync/' + userId + '.json',
    ]);
    if (syncError) deleteErrors.push('recordings sync: ' + syncError.message);

    // ── 5. profiles 테이블 삭제 ──
    const { error: profileError } = await supabaseServer
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      deleteErrors.push(`profiles: ${profileError.message}`);
    }

    // ── 6. Auth 유저 삭제 (service_role 권한) ──
    const { error: authError } = await supabaseServer.auth.admin.deleteUser(
      userId
    );

    if (authError) {
      console.error("[delete-account] Auth 삭제 실패:", authError.message);
      return NextResponse.json(
        { error: "계정 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (deleteErrors.length > 0) {
      console.warn("[delete-account] 일부 데이터 삭제 실패:", deleteErrors);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete-account] 서버 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
