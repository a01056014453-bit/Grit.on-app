"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { BottomNavigation } from "./bottom-navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

const CircularText = dynamic(
  () => import("@/components/ui/circular-text").then((mod) => mod.CircularText),
  { ssr: false }
);

interface AppShellProps {
  children: React.ReactNode;
}

type AppState = "splash" | "login" | "onboarding" | "app";

export function AppShell({ children }: AppShellProps) {
  const [appState, setAppState] = useState<AppState>("splash");
  const [isAnimating, setIsAnimating] = useState(false);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const isLoggedIn = localStorage.getItem("grit-on-logged-in");

    if (isLoggedIn) {
      const onboardingComplete = localStorage.getItem("grit-on-onboarding-complete");
      const targetState: AppState = onboardingComplete ? "app" : "onboarding";
      // Skip login screen if already logged in
      const timer = setTimeout(() => {
        setSplashFading(true);
        setTimeout(() => setAppState(targetState), 600);
      }, 2200);
      return () => clearTimeout(timer);
    }

    // Start fade-out animation after splash
    const animationTimer = setTimeout(() => {
      setSplashFading(true);
    }, 2200);

    // Show login screen after animation completes
    const loginTimer = setTimeout(() => {
      setAppState("login");
      setSplashFading(false);
    }, 2800);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(loginTimer);
    };
  }, []);

  const handleLogin = () => {
    // Save login state
    localStorage.setItem("grit-on-logged-in", "true");
    const onboardingComplete = localStorage.getItem("grit-on-onboarding-complete");
    setIsAnimating(true);
    setTimeout(() => setAppState(onboardingComplete ? "app" : "onboarding"), 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Splash Screen - Premium Aurora */}
      <AnimatePresence>
        {appState === "splash" && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: splashFading ? 0 : 1 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden"
          >
            {/* Aurora Background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400/30 via-violet-950 to-purple-950" />

              {/* Animated Aurora Blobs */}
              <motion.div
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/40 blur-[100px]"
                animate={{
                  x: [0, 40, -25, 0],
                  y: [0, -25, 40, 0],
                  scale: [1, 1.1, 0.95, 1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-400/35 blur-[80px]"
                animate={{
                  x: [0, -35, 25, 0],
                  y: [0, 35, -20, 0],
                  scale: [1, 0.9, 1.1, 1],
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-fuchsia-400/30 blur-[70px]"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.2, 0.35, 0.2],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Circular Logo */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              >
                {/* Circular Text */}
                <CircularText
                  text="GRIT.ON · CLASSICAL · PRACTICE · COACH · "
                  radius={85}
                  fontSize={11}
                  duration={12}
                  textClassName="text-violet-300/70 font-semibold tracking-[0.15em] uppercase"
                  direction="clockwise"
                />
              </motion.div>

              {/* Loading Indicator */}
              <motion.div
                className="mt-6 flex items-center gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-violet-400"
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      delay: i * 0.12,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </motion.div>
            </div>

            {/* Subtle Grain Overlay */}
            <div
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Screen - Premium Design */}
      <AnimatePresence>
        {appState === "login" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isAnimating ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-violet-300 via-violet-500 to-violet-800 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-white/20 blur-[100px] rounded-full" />

            {/* Top Section - Branding */}
            <div className="flex flex-1 flex-col items-center justify-center px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-col items-center gap-5"
              >
                {/* Circular Text Logo */}
                <div className="relative">
                  <CircularText
                    text="GRIT.ON · CLASSICAL · PRACTICE · COACH · "
                    radius={100}
                    fontSize={13}
                    duration={15}
                    textClassName="text-white/80 font-semibold tracking-[0.15em] uppercase"
                    direction="clockwise"
                  />
                </div>

                {/* Title with Shimmer Effect */}
                <motion.h1
                  className="text-3xl font-black tracking-tight font-number relative"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <span className="relative inline-block text-white">
                    GRIT.ON
                    {/* Shimmer overlay */}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      style={{ backgroundSize: "200% 100%" }}
                      animate={{
                        backgroundPosition: ["200% 0", "-200% 0"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "easeInOut",
                      }}
                    />
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <p className="text-center text-white/70 leading-relaxed">
                  AI가 분석하는<br />
                  나만의 연습 코치
                </p>
              </motion.div>
            </div>

            {/* Bottom Section - Login Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="px-6 pb-12"
            >
              <div className="flex flex-col gap-3">
                {/* Apple Login */}
                <button
                  onClick={handleLogin}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-black font-semibold transition-all active:scale-[0.98] hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple로 계속하기
                </button>

                {/* Google Login */}
                <button
                  onClick={handleLogin}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white/10 text-white font-semibold border border-white/20 transition-all active:scale-[0.98] hover:bg-white/15"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 계속하기
                </button>

                {/* Guest Mode */}
                <button
                  onClick={handleLogin}
                  className="flex h-12 w-full items-center justify-center text-violet-300/70 font-medium transition-colors hover:text-white"
                >
                  둘러보기
                </button>
              </div>

              {/* Terms */}
              <p className="mt-6 text-center text-xs text-violet-300/40">
                계속하면 <span className="underline">서비스 약관</span> 및{" "}
                <span className="underline">개인정보 처리방침</span>에 동의하게 됩니다.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Flow */}
      <AnimatePresence>
        {appState === "onboarding" && (
          <OnboardingFlow onComplete={() => setAppState("app")} />
        )}
      </AnimatePresence>

      {/* Main App */}
      {appState === "app" && (
        <>
          {/* Safe area top padding */}
          <div className="safe-top" />

          {/* App content with bottom padding for navigation */}
          <main className="pb-20">{children}</main>

          {/* Bottom navigation */}
          <BottomNavigation />
        </>
      )}
    </div>
  );
}
