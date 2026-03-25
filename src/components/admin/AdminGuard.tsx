"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Shield } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authorized" | "denied">("loading");

  useEffect(() => {
    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setStatus("denied");
          return;
        }

        // 서버에서 admin 여부 확인
        const res = await fetch("/api/auth/check-admin");
        if (res.ok) {
          const { isAdmin } = await res.json();
          setStatus(isAdmin ? "authorized" : "denied");
        } else {
          setStatus("denied");
        }
      } catch {
        setStatus("denied");
      }
    }
    check();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Shield className="w-16 h-16 text-red-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">접근 권한 없음</h1>
        <p className="text-sm text-gray-500">관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

  return <>{children}</>;
}
