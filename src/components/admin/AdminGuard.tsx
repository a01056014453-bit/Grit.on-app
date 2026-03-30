"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Shield, LogIn, Loader2, Mail, Lock } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authorized" | "denied" | "login">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const checkAdmin = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatus("login");
        return;
      }

      const res = await fetch("/api/auth/check-admin");
      if (res.ok) {
        const { isAdmin } = await res.json();
        setStatus(isAdmin ? "authorized" : "denied");
      } else {
        setStatus("denied");
      }
    } catch {
      setStatus("login");
    }
  };

  useEffect(() => {
    checkAdmin();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoginLoading(true);
    setLoginError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setLoginError("이메일 또는 비밀번호가 올바르지 않습니다.");
        setLoginLoading(false);
        return;
      }

      // 로그인 성공 → 어드민 권한 체크
      await checkAdmin();
    } catch {
      setLoginError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "login") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-sm mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-violet-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Sempre Admin</h1>
            <p className="text-sm text-gray-500 mt-1">관리자 로그인</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@withsempre.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-sm text-red-500">{loginError}</p>
              )}

              <button
                onClick={handleLogin}
                disabled={loginLoading || !email.trim() || !password.trim()}
                className="w-full py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    로그인
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Shield className="w-16 h-16 text-red-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">접근 권한 없음</h1>
        <p className="text-sm text-gray-500 mb-4">관리자만 접근할 수 있습니다.</p>
        <button
          onClick={() => {
            const supabase = createClient();
            supabase.auth.signOut().then(() => setStatus("login"));
          }}
          className="text-sm text-violet-600 hover:underline"
        >
          다른 계정으로 로그인
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
