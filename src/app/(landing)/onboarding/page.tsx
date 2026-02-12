"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RotatingText from "@/components/ui/rotating-text";

export default function OnboardingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setReady(true);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-[#050A18] overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent opacity-50" />
      </div>

      {/* Main content */}
      <div className="z-10 flex flex-col items-center px-8 text-center">
        {/* Brand identity */}
        <div className="mb-12">
          <h1 className="text-white text-4xl font-black tracking-tighter mb-2 italic">
            GRIT<span className="text-indigo-500">.</span>ON
          </h1>
          <div className="h-1 w-12 bg-indigo-500 mx-auto rounded-full" />
        </div>

        {/* RotatingText for value proposition */}
        <div className="h-40 flex flex-col items-center justify-center">
          <p className="text-indigo-300/60 text-sm font-bold tracking-[0.3em] uppercase mb-4">
            Starting your musical journey
          </p>

          <RotatingText
            texts={[
              "정밀한 연습",
              "AI 실시간 분석",
              "전문가 피드백",
              "완벽한 연주",
            ]}
            mainClassName="px-6 py-3 bg-white/5 backdrop-blur-xl text-white overflow-hidden justify-center rounded-3xl font-bold text-3xl md:text-4xl border border-white/10 shadow-2xl"
            staggerFrom="last"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            staggerDuration={0.05}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            rotationInterval={2500}
          />
        </div>

        {/* CTA Button - appears when progress complete */}
        {ready && (
          <button
            onClick={() => router.push("/")}
            className="mt-8 px-8 py-3 bg-indigo-500 text-white rounded-full font-semibold text-lg hover:bg-indigo-400 transition-all animate-fade-in-up shadow-[0_0_30px_rgba(99,102,241,0.4)]"
          >
            시작하기
          </button>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-20 w-full max-w-[280px]">
          <div className="flex justify-between text-indigo-300/40 text-[10px] font-bold mb-2 tracking-widest">
            <span>{ready ? "READY" : "SYSTEM INITIALIZING"}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 shadow-[0_0_15px_#6366f1] transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Glow effects */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
    </div>
  );
}
