"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

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

        // 온보딩 완료 여부 확인
        const onboardingDone = localStorage.getItem("sempre-onboarding-done");
        if (onboardingDone) {
          router.replace("/");
        } else {
          // 온보딩이 아직이면 프로필 설정으로
          router.replace("/onboarding/profile-setup");
        }
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
