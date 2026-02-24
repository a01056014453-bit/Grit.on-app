"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const [loadingText, setLoadingText] = useState("AI 모델 불러오는 중...");
  const loadedRef = useRef(false);

  useEffect(() => {
    loadTfjs();

    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setLoadingText("거의 다 됐어요!"), 1800);
    const t3 = setTimeout(() => setPhase("exit"), 2600);
    const t4 = setTimeout(() => onComplete(), 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const loadTfjs = async () => {
    if (loadedRef.current) return;
    try {
      const tf = await import("@tensorflow/tfjs");
      (window as any).__tfjs = tf;
      loadedRef.current = true;
    } catch (e) {
      console.warn("[Splash] TF.js 로드 실패:", e);
    }
  };

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-[#8B5CF6] transition-opacity duration-500
        ${phase === "exit" ? "opacity-0" : "opacity-100"}
      `}
    >
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full bg-white/5" />

      <div
        className={`
          transition-all duration-700 ease-out
          ${phase === "enter" ? "opacity-0 scale-90 translate-y-4" : "opacity-100 scale-100 translate-y-0"}
        `}
      >
        <Image
          src="/icons/icon-512.png"
          alt="Sempre"
          width={120}
          height={120}
          className="rounded-3xl shadow-2xl mb-8"
          priority
        />
      </div>

      <div
        className={`
          text-center transition-all duration-700 delay-200 ease-out
          ${phase === "enter" ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}
        `}
      >
        <p className="text-white/60 text-sm mt-1 tracking-widest uppercase">
          Classical Practice Coach
        </p>
      </div>

      <div
        className={`
          absolute bottom-16 flex flex-col items-center gap-3
          transition-all duration-500 delay-300
          ${phase === "enter" ? "opacity-0" : "opacity-100"}
        `}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-white/50 text-xs">{loadingText}</p>
      </div>
    </div>
  );
}
