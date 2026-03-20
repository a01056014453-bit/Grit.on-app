"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getProfile } from "@/lib/queries/profiles";
import { pullUserData } from "@/lib/sync-user-data";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      // 1. 인증 확인 (Supabase 세션 우선)
      let userId: string | null = null;

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          localStorage.setItem("sempre-auth", user.app_metadata?.provider || "google");
          localStorage.setItem("grit-on-logged-in", "true");
          localStorage.setItem("grit-on-user-id", user.id);
        }
      } catch {
        // Supabase 확인 실패 시 localStorage fallback
      }

      // localStorage fallback
      if (!userId) {
        const authStatus = localStorage.getItem("sempre-auth");
        if (!authStatus) {
          // 로그인 안 됨 → 로그인 페이지로 (온보딩보다 로그인 먼저)
          router.replace("/onboarding/login");
          return;
        }
        userId = localStorage.getItem("grit-on-user-id");
      }

      // 2. 온보딩 완료 여부 확인
      const onboardingDone = localStorage.getItem("sempre-onboarding-done");
      if (onboardingDone) {
        // 대기 중인 초대가 있으면 초대 페이지로 이동
        const pendingInvite = localStorage.getItem("grit-on-pending-invite-token");
        if (pendingInvite) {
          localStorage.removeItem("grit-on-pending-invite-token");
          router.replace(`/invite/${pendingInvite}`);
          return;
        }
        setReady(true);
        return;
      }

      // 3. 로그인은 됐는데 온보딩이 안 됨 → 서버에서 프로필 확인
      //    (이미 다른 기기에서 온보딩한 사용자인지 체크)
      if (userId) {
        try {
          const profile = await getProfile(userId);
          if (profile && profile.nickname) {
            // 기존 사용자 → 프로필 복원 + 데이터 동기화 후 바로 진입
            localStorage.setItem("sempre-onboarding-done", "true");
            localStorage.setItem("sempre-user-profile", JSON.stringify({
              nickname: profile.nickname,
              ageGroup: profile.level || "",
              instruments: profile.instrument ? [profile.instrument] : [],
              profileEmoji: "👤",
              createdAt: profile.created_at || new Date().toISOString(),
            }));
            await pullUserData();
            setReady(true);
            return;
          }
        } catch {
          // 프로필 조회 실패 시 온보딩으로
        }
      }

      // 4. 새 사용자 → 온보딩 진행
      router.replace("/onboarding");
    }

    checkAccess();
  }, [router]);

  if (!ready) return null;

  return <>{children}</>;
}
