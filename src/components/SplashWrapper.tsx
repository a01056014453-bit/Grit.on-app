"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// 스플래시 화면 동적 임포트 (SSR 제외)
const SplashScreen = dynamic(() => import("@/components/SplashScreen"), {
  ssr: false,
});

const SPLASH_SHOWN_KEY = "sempre-splash-shown";

export default function SplashWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // 세션당 1회만 스플래시 표시
    const alreadyShown = sessionStorage.getItem(SPLASH_SHOWN_KEY);
    if (!alreadyShown) {
      setShowSplash(true);
    } else {
      setSplashDone(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, "1");
    setSplashDone(true);
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {/* 스플래시 중에는 콘텐츠 숨김 (깜빡임 방지) */}
      <div className={showSplash && !splashDone ? "invisible" : "visible"}>
        {children}
      </div>
    </>
  );
}
