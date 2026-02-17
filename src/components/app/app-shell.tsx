"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { BottomNavigation } from "./bottom-navigation";

const NewOnboardingFlow = dynamic(
  () => import("@/components/onboarding/NewOnboardingFlow").then((mod) => mod.NewOnboardingFlow),
  { ssr: false }
);

interface AppShellProps {
  children: React.ReactNode;
}

type AppState = "onboarding" | "app";

export function AppShell({ children }: AppShellProps) {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 온보딩 스킵 - 바로 앱 진입
    localStorage.setItem("grit-on-logged-in", "true");
    localStorage.setItem("grit-on-onboarding-complete", "true");
    setIsLoggedIn(true);
    setAppState("app");
  }, []);

  if (appState === null) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Onboarding Flow (includes login as first step) */}
      <AnimatePresence>
        {appState === "onboarding" && (
          <NewOnboardingFlow
            onComplete={() => setAppState("app")}
            isAlreadyLoggedIn={isLoggedIn}
          />
        )}
      </AnimatePresence>

      {/* Main App */}
      {appState === "app" && (
        <>
          <div className="safe-top" />
          <main className="pb-20">{children}</main>
          <BottomNavigation />
        </>
      )}
    </div>
  );
}
