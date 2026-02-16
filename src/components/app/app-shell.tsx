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
    // TODO: 온보딩 테스트 후 아래 3줄 삭제
    localStorage.removeItem("grit-on-logged-in");
    localStorage.removeItem("grit-on-onboarding-complete");
    localStorage.removeItem("grit-on-profile");

    const loggedIn = !!localStorage.getItem("grit-on-logged-in");
    setIsLoggedIn(loggedIn);

    let onboardingComplete = !!localStorage.getItem("grit-on-onboarding-complete");

    if (loggedIn && !onboardingComplete) {
      localStorage.setItem("grit-on-onboarding-complete", "true");
      onboardingComplete = true;
    }

    if (loggedIn && onboardingComplete) {
      setAppState("app");
    } else {
      setAppState("onboarding");
    }
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
