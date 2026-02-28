import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const BUCKET_NAME = "composer-resources";

/** GET: 버킷이 없으면 생성 */
export async function GET() {
  try {
    const { data: buckets } = await supabaseServer.storage.listBuckets();
    if (!buckets?.find((b) => b.name === BUCKET_NAME)) {
      const { error } = await supabaseServer.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 30 * 1024 * 1024, // 30MB
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 },
    );
  }
}
