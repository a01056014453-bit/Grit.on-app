"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getProfile, getExistingProvider, upsertProfile } from "@/lib/queries/profiles";
import { pullUserData } from "@/lib/sync-user-data";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
};

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conflict, setConflict] = useState<string | null>(null);

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

        // 다른 소셜 로그인으로 이미 가입한 이메일인지 확인
        const email = authData.user.email;
        if (email) {
          try {
            const dupRes = await fetch("/api/auth/check-duplicate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, currentUserId: authData.user.id }),
            });
            const dupData = await dupRes.json();
            if (dupData.duplicate) {
              await supabase.auth.signOut();
              setConflict(dupData.provider);
              return;
            }
          } catch {
            // 중복 확인 실패해도 로그인은 진행
          }
        }

        // localStorage 설정
        localStorage.setItem("sempre-auth", "google");
        localStorage.setItem("grit-on-logged-in", "true");
        localStorage.setItem("grit-on-user-id", authData.user.id);

        // 이미 온보딩 완료한 사용자 → 홈으로
        const onboardingDone = localStorage.getItem("sempre-onboarding-done");
        if (onboardingDone) {
          router.replace("/");
          return;
        }

        // 서버에 프로필이 있는지 확인 (다른 기기에서 이미 가입한 사용자)
        const profile = await getProfile(authData.user.id);
        if (profile && profile.nickname) {
          // email/auth_provider가 비어있으면 채워넣기
          if (!profile.email || !profile.auth_provider) {
            await upsertProfile(authData.user.id, {
              nickname: profile.nickname,
              email: email || undefined,
              auth_provider: "google",
            });
          }
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

        // 새 사용자 → 온보딩 진행
        router.replace("/onboarding");
      } catch (err) {
        console.error("Google callback error:", err);
        router.replace("/onboarding/login");
      }
    }

    handleCallback();
  }, [router, searchParams]);

  if (conflict) {
    const label = PROVIDER_LABELS[conflict] || conflict;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <p className="text-lg font-bold text-gray-900 mb-2">
            이미 가입된 이메일이에요
          </p>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            이 이메일은 <span className="font-semibold text-gray-900">{label}</span>로 가입되어 있어요.
            <br />
            {label}로 로그인해주세요.
          </p>
          <button
            onClick={() => router.replace("/onboarding/login")}
            className="w-full py-3 rounded-2xl font-semibold text-white text-sm"
            style={{ backgroundColor: "#8B5CF6" }}
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

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
