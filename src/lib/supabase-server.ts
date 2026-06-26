import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("[supabase-server] SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다. 서버 API가 정상 동작하지 않을 수 있습니다.");
}

/**
 * 서버 사이드 전용 Supabase 클라이언트 (RLS 우회)
 * API Route에서만 사용할 것
 */
export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
