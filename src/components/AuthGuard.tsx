"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const onboardingDone = localStorage.getItem("sempre-onboarding-done");

      if (!onboardingDone) {
        router.replace("/onboarding");
        return;
      }

      // Supabase 세션 확인
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setReady(true);
          return;
        }
      } catch {
        // Supabase 확인 실패 시 localStorage fallback
      }

      // localStorage fallback
      const authStatus = localStorage.getItem("sempre-auth");
      if (!authStatus) {
        router.replace("/onboarding/login");
        return;
      }

      setReady(true);
    }

    checkAccess();
  }, [router]);

  if (!ready) return null;

  return <>{children}</>;
}
