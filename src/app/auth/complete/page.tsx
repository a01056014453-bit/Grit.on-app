"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getProfile } from "@/lib/queries/profiles";
import { pullUserData } from "@/lib/sync-user-data";

export default function AuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    async function completeAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 로그인 상태 설정
        const provider = user.app_metadata?.provider || "google";
        localStorage.setItem("sempre-auth", provider);
        localStorage.setItem("grit-on-logged-in", "true");
        localStorage.setItem("grit-on-user-id", user.id);

        // 이미 온보딩 완료 → 홈으로
        const onboardingDone = localStorage.getItem("sempre-onboarding-done");
        if (onboardingDone) {
          router.replace("/");
          return;
        }

        // 서버에 프로필이 있는지 확인 (다른 기기에서 이미 가입한 사용자)
        try {
          const profile = await getProfile(user.id);
          if (profile && profile.nickname) {
            // 기존 사용자 → 프로필 복원 + 데이터 동기화 후 홈으로
            localStorage.setItem("sempre-onboarding-done", "true");
            localStorage.setItem("sempre-user-profile", JSON.stringify({
              nickname: profile.nickname,
              ageGroup: profile.level || "",
              instruments: profile.instrument ? [profile.instrument] : [],
              profileEmoji: "👤",
              createdAt: profile.created_at || new Date().toISOString(),
            }));
            await pullUserData();
            router.replace("/");
            return;
          }
        } catch {
          // 프로필 조회 실패 시 온보딩으로
        }

        // 새 사용자 → 온보딩
        router.replace("/onboarding");
      } else {
        router.replace("/landing");
      }
    }

    completeAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">로그인 중...</p>
      </div>
    </div>
  );
}
