import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * POST /api/profile/image
 * 프로필 이미지 업로드 (Supabase Storage)
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
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
      },
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "5MB 이하만 가능합니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `profiles/${user.id}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 기존 이미지 삭제 후 업로드
    await supabaseServer.storage.from("avatars").remove([path]);

    const { error: uploadError } = await supabaseServer.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[profile/image] upload error:", uploadError.message);
      return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
    }

    const { data: urlData } = supabaseServer.storage
      .from("avatars")
      .getPublicUrl(path);

    const url = urlData.publicUrl;

    // profiles 테이블에 URL 저장
    await (supabaseServer as any)
      .from("profiles")
      .update({ profile_image: url })
      .eq("id", user.id);

    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error("[profile/image] error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
