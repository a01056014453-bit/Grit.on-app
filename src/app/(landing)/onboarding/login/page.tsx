"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase-browser";

const PROFILE_KEY = "sempre-user-profile";

export default function LoginRequiredPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ nickname: string; profileEmoji: string } | null>(null);

  useEffect(() => {
    // 이미 로그인된 사용자는 홈으로
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          localStorage.setItem("sempre-auth", "google");
          localStorage.setItem("grit-on-logged-in", "true");
          localStorage.setItem("grit-on-user-id", user.id);
          router.replace("/");
          return;
        }
      } catch {}
    }
    checkAuth();

    // 프로필 정보 로드
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile({
          nickname: parsed.nickname || "사용자",
          profileEmoji: parsed.profileEmoji || "👤",
        });
      }
    } catch {}
  }, [router]);

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = "email profile openid";
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&prompt=select_account`;
    window.location.href = url;
  };

  const handleAppleLogin = () => {
    const clientId = "com.5F62DDJA3X.sempre.web";
    const redirectUri = `${window.location.origin}/auth/apple/callback`;
    const url = `https://appleid.apple.com/auth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&response_mode=query`;
    window.location.href = url;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* 상단: 브랜딩 + 프로필 인사 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {profile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 rounded-full bg-violet-100 border-2 border-violet-200 flex items-center justify-center text-4xl mx-auto mb-4">
              {profile.profileEmoji}
            </div>
            <h1 className="text-2xl font-black text-gray-900">
              안녕하세요, {profile.nickname}님!
            </h1>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl font-black text-white">S</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-3">
              Grit.on
            </h1>
            <p className="text-base text-gray-500 leading-relaxed">
              클래식 연주자를 위한<br />AI 연습 코치
            </p>
          </motion.div>
        )}
      </div>

      {/* 하단: 로그인 버튼 */}
      <div className="px-6 pb-10 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="space-y-3 max-w-sm mx-auto"
        >
          {/* Google 로그인 */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-base bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 계속하기
          </button>

          {/* Apple 로그인 */}
          <button
            onClick={handleAppleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-base bg-black text-white hover:bg-gray-900 active:scale-[0.98] transition-all shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple로 계속하기
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-xs text-gray-400"
        >
          계속하면 <span className="underline">서비스 약관</span> 및{" "}
          <span className="underline">개인정보 처리방침</span>에 동의하게 됩니다.
        </motion.p>
      </div>
    </div>
  );
}
