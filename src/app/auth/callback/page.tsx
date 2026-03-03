"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getProfile } from "@/lib/queries/profiles";
import { pullUserData } from "@/lib/sync-user-data";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      if (!code) {
        console.error("[auth/callback] No code in URL");
        router.replace("/onboarding/login");
        return;
      }

      try {
        const supabase = createClient();

        // 브라우저에서 직접 코드 교환 (PKCE verifier 쿠키 접근 가능)
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[auth/callback] exchangeCodeForSession error:", error.message);
          router.replace("/onboarding/login");
          return;
        }

        // 인증된 사용자 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("[auth/callback] No user after code exchange");
          router.replace("/onboarding/login");
          return;
        }

        // localStorage 설정
        const provider = user.app_metadata?.provider || "apple";
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
      } catch (err) {
        console.error("[auth/callback] Unexpected error:", err);
        router.replace("/onboarding/login");
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">로그인 중...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">로그인 중...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
