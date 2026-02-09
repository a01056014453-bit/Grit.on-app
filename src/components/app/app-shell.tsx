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
    <div className="min-h-screen bg-white">
      {/* Splash Screen - Minimal White */}
      {appState === "splash" && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
            isAnimating ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Logo Container */}
          <div className="animate-fade-in-up flex flex-col items-center gap-6">
            {/* Logo Icon */}
            <div className="relative">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-black">
                <Music className="h-10 w-10 text-white" strokeWidth={2} />
              </div>
            </div>

            {/* App Name */}
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-black">
                GRIT.ON
              </h1>
              <p className="mt-2 text-base text-gray-500">
                클래식 연습 코치
              </p>
            </div>

            {/* Loading Indicator */}
            <div className="mt-8 flex gap-1.5">
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-black"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-black"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-black"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Login Screen - Minimal Design */}
      {appState === "login" && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col bg-white transition-opacity duration-500 ${
            isAnimating ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Top Section - Branding */}
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <div className="animate-fade-in-up flex flex-col items-center gap-4">
              {/* Logo */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black">
                <Music className="h-8 w-8 text-white" strokeWidth={2} />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-black">GRIT.ON</h1>

              {/* Subtitle */}
              <p className="text-center text-gray-500">
                AI가 분석하는<br />
                나만의 연습 코치
              </p>
            </div>

            {/* iPhone Mockup */}
            <div className="mt-12 relative mx-auto max-w-[200px]">
              <div className="relative bg-black rounded-[2rem] p-2 shadow-xl">
                <div className="bg-gradient-to-b from-violet-200 to-violet-300 rounded-[1.5rem] overflow-hidden aspect-[9/16]">
                  <div className="h-full p-4 flex flex-col">
                    {/* Mockup Content */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white/30 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-white/90">연습 시작</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Login Buttons */}
          <div className="px-6 pb-12">
            <div className="animate-fade-in-up flex flex-col gap-3" style={{ animationDelay: "200ms" }}>
              {/* Apple Login */}
              <button
                onClick={handleLogin}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black text-white font-medium transition-transform active:scale-[0.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple로 계속하기
              </button>

              {/* Google Login */}
              <button
                onClick={handleLogin}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-gray-800 font-medium border border-gray-200 transition-transform active:scale-[0.98]"
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
                className="flex h-12 w-full items-center justify-center text-gray-500 font-medium transition-colors hover:text-black"
              >
                둘러보기
              </button>
            </div>

            {/* Terms */}
            <p className="mt-6 text-center text-xs text-gray-400">
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
