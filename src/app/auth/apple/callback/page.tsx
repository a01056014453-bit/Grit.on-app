"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getProfile } from "@/lib/queries/profiles";
import { pullUserData } from "@/lib/sync-user-data";

function AppleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Apple 로그인 처리 중...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      if (!code) {
        setError("Apple에서 인증 코드를 받지 못했습니다.");
        return;
      }

      try {
        // Step 1: 서버에서 code → token 교환
        setStatus("1/3 토큰 교환 중...");
        const res = await fetch("/api/auth/apple", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirectUri: `${window.location.origin}/auth/apple/callback`,
          }),
        });

        const data = await res.json();
        if (data.error || !data.id_token) {
          setError(`토큰 교환 실패: ${data.error || "id_token 없음"}`);
          return;
        }

        // Step 2: Supabase에 ID Token으로 로그인
        setStatus("2/3 Supabase 로그인 중...");
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: data.id_token,
        });

        if (authError || !authData.user) {
          setError(`Supabase 로그인 실패: ${authError?.message || "user 없음"}`);
          return;
        }

        // Step 3: localStorage 설정
        setStatus("3/3 프로필 확인 중...");
        localStorage.setItem("sempre-auth", "apple");
        localStorage.setItem("grit-on-logged-in", "true");
        localStorage.setItem("grit-on-user-id", authData.user.id);

        // 이미 온보딩 완료 → 홈으로
        const onboardingDone = localStorage.getItem("sempre-onboarding-done");
        if (onboardingDone) {
          router.replace("/");
          return;
        }

        // 서버에 프로필이 있는지 확인
        try {
          const profile = await getProfile(authData.user.id);
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
        setError(`예상치 못한 오류: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white px-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <p className="text-sm font-semibold text-red-600 mb-2">Apple 로그인 오류</p>
          <p className="text-xs text-gray-600 bg-gray-100 rounded-lg p-3 font-mono break-all">{error}</p>
          <button
            onClick={() => router.replace("/onboarding/login")}
            className="mt-4 px-6 py-2 bg-black text-white text-sm rounded-xl"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">{status}</p>
      </div>
    </div>
  );
}

export default function AppleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Apple 로그인 중...</p>
          </div>
        </div>
      }
    >
      <AppleCallbackHandler />
    </Suspense>
  );
}
