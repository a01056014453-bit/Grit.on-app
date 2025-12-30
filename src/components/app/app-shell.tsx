"use client";

import { useEffect, useState } from "react";
import { Music } from "lucide-react";
import { BottomNavigation } from "./bottom-navigation";

interface AppShellProps {
  children: React.ReactNode;
}

type AppState = "splash" | "login" | "app";

export function AppShell({ children }: AppShellProps) {
  const [appState, setAppState] = useState<AppState>("splash");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const isLoggedIn = localStorage.getItem("grit-on-logged-in");

    if (isLoggedIn) {
      // Skip login screen if already logged in
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => setAppState("app"), 500);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Start fade-out animation after 1.5 seconds
    const animationTimer = setTimeout(() => {
      setIsAnimating(true);
    }, 1500);

    // Show login screen after animation completes
    const loginTimer = setTimeout(() => {
      setAppState("login");
      setIsAnimating(false);
    }, 2000);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(loginTimer);
    };
  }, []);

  const handleLogin = () => {
    // Save login state
    localStorage.setItem("grit-on-logged-in", "true");
    setIsAnimating(true);
    setTimeout(() => setAppState("app"), 500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Splash Screen */}
      {appState === "splash" && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-primary to-violet-700 transition-opacity duration-500 ${
            isAnimating ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Logo Container */}
          <div className="animate-fade-in-up flex flex-col items-center gap-6">
            {/* Logo Icon */}
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-white/20 blur-xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl">
                <Music className="h-12 w-12 text-primary" strokeWidth={2.5} />
              </div>
            </div>

            {/* App Name */}
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white">
                GRIT.ON
              </h1>
              <p className="mt-2 text-lg font-medium text-white/80">
                클래식 연습 코치
              </p>
            </div>

            {/* Loading Indicator */}
            <div className="mt-8 flex gap-1.5">
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-white/80"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-white/80"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-white/80"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>

          {/* Bottom Tagline */}
          <div className="absolute bottom-12 text-center">
            <p className="text-sm text-white/60">AI 기반 스마트 연습 분석</p>
          </div>
        </div>
      )}

      {/* Login Screen */}
      {appState === "login" && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-primary to-violet-700 transition-opacity duration-500 ${
            isAnimating ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Top Section - Branding */}
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <div className="animate-fade-in-up flex flex-col items-center gap-4">
              {/* Logo */}
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-xl">
                <Music className="h-10 w-10 text-primary" strokeWidth={2.5} />
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-white">GRIT.ON</h1>

              {/* Subtitle */}
              <p className="text-center text-white/80">
                AI가 분석하는<br />
                나만의 연습 코치
              </p>
            </div>
          </div>

          {/* Bottom Section - Login Buttons */}
          <div className="px-6 pb-12">
            <div className="animate-fade-in-up flex flex-col gap-3" style={{ animationDelay: "200ms" }}>
              {/* Apple Login */}
              <button
                onClick={handleLogin}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black text-white font-medium shadow-lg transition-transform active:scale-[0.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple로 계속하기
              </button>

              {/* Google Login */}
              <button
                onClick={handleLogin}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-gray-800 font-medium shadow-lg transition-transform active:scale-[0.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 계속하기
              </button>

              {/* Guest Mode */}
              <button
                onClick={handleLogin}
                className="flex h-12 w-full items-center justify-center text-white/70 font-medium transition-colors hover:text-white"
              >
                둘러보기
              </button>
            </div>

            {/* Terms */}
            <p className="mt-6 text-center text-xs text-white/50">
              계속하면 <span className="underline">서비스 약관</span> 및{" "}
              <span className="underline">개인정보 처리방침</span>에 동의하게 됩니다.
            </p>
          </div>
        </div>
      )}

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
