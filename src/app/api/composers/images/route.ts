import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseServer as any;

// 서버 메모리 캐시 (프로세스 수명 동안 유지)
let cachedImages: Record<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1시간

/**
 * GET /api/composers/images
 * 작곡가 이미지 URL 맵 반환 (DB 우선, 없으면 위키피디아에서 가져와 DB 저장)
 */
export async function GET() {
  // 서버 캐시 유효하면 즉시 반환
  if (cachedImages && Date.now() - cacheTime < CACHE_TTL) {
    return NextResponse.json({ images: cachedImages });
  }

  try {
    // 1. DB에서 이미지 URL 조회
    const { data: composers } = await db
      .from("composers")
      .select("short_name, full_name, image_url")
      .not("image_url", "is", null);

    const images: Record<string, string> = {};
    if (composers) {
      for (const c of composers) {
        if (c.image_url) images[c.full_name] = c.image_url;
      }
    }

    cachedImages = images;
    cacheTime = Date.now();

    return NextResponse.json({ images });
  } catch (err) {
    console.error("[composers/images]", err);
    return NextResponse.json({ images: {} });
  }
}

/**
 * POST /api/composers/images
 * 위키피디아에서 작곡가 이미지를 가져와 DB에 저장 (어드민/Cron용)
 */
export async function POST(request: NextRequest) {
  try {
    const { fullName } = await request.json();
    if (!fullName) {
      return NextResponse.json({ error: "fullName 필수" }, { status: 400 });
    }

    // 위키피디아 API (서버사이드 — CORS 없음)
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(fullName)}`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!wikiRes.ok) {
      return NextResponse.json({ imageUrl: "" });
    }

    const wikiData = await wikiRes.json();
    const imageUrl = wikiData.thumbnail?.source ?? "";

    // DB 업데이트
    if (imageUrl) {
      await db
        .from("composers")
        .update({ image_url: imageUrl })
        .ilike("full_name", fullName.trim());

      // 캐시 무효화
      cachedImages = null;
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("[composers/images POST]", err);
    return NextResponse.json({ imageUrl: "" });
  }
}
