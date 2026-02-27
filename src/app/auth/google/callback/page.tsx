"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      if (!code) {
        router.replace("/onboarding/login");
        return;
      }

      try {
        // 서버에서 code → token 교환
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirectUri: `${window.location.origin}/auth/google/callback`,
          }),
        });

        const data = await res.json();
        if (data.error || !data.id_token) {
          console.error("Token exchange failed:", data.error);
          router.replace("/onboarding/login");
          return;
        }

        // Supabase에 ID Token으로 로그인
        const supabase = createClient();
        const { data: authData, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: data.id_token,
          access_token: data.access_token,
        });

        if (error || !authData.user) {
          console.error("Supabase signIn error:", error?.message);
          router.replace("/onboarding/login");
          return;
        }

        // localStorage 설정
        localStorage.setItem("sempre-auth", "google");
        localStorage.setItem("grit-on-logged-in", "true");
        localStorage.setItem("grit-on-user-id", authData.user.id);

        // 리다이렉트
        const onboardingDone = localStorage.getItem("sempre-onboarding-done");
        router.replace(onboardingDone ? "/" : "/onboarding/profile-setup");
      } catch (err) {
        console.error("Google callback error:", err);
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

export default function GoogleCallbackPage() {
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
      <GoogleCallbackHandler />
    </Suspense>
  );
}
