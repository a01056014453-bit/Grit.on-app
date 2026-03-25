import { createClient } from "@/lib/supabase-browser";

const USER_ID_KEY = "sempre-user-id";
const OLD_USER_ID_KEY = "grit-on-user-id";

/** 동기적으로 로컬 유저 ID 반환 (기존 호환) */
export function getUserId(): string {
  if (typeof window === "undefined") return "";

  let userId = localStorage.getItem(USER_ID_KEY);
  // 기존 키에서 마이그레이션
  if (!userId) {
    userId = localStorage.getItem(OLD_USER_ID_KEY);
    if (userId) localStorage.setItem(USER_ID_KEY, userId);
  }
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

/** Supabase 인증 유저 ID 반환 (비동기). 로그인 안 되어 있으면 로컬 ID 반환 */
export async function getAuthUserId(): Promise<string> {
  if (typeof window === "undefined") return "";

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Supabase user ID를 로컬에도 동기화
      localStorage.setItem(USER_ID_KEY, user.id);
      return user.id;
    }
  } catch {
    // auth 실패 시 로컬 ID 사용
  }

  return getUserId();
}
