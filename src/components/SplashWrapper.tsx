"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// 스플래시 화면 동적 임포트 (SSR 제외)
const SplashScreen = dynamic(() => import("@/components/SplashScreen"), {
  ssr: false,
});

const SPLASH_SHOWN_KEY = "sempre-splash-shown";
const DATA_VERSION_KEY = "sempre-data-version";
const CURRENT_DATA_VERSION = "5"; // 온보딩 키 마이그레이션

function runDataMigration() {
  if (typeof window === "undefined") return;

  const version = localStorage.getItem(DATA_VERSION_KEY);
  if (version === CURRENT_DATA_VERSION) return;

  // 목업 알림 데이터 + 이전 온보딩 키 제거
  localStorage.removeItem("grit-on-notifications");
  localStorage.removeItem("sempre-notifications");
  localStorage.removeItem("grit-on-onboarding-complete");
  localStorage.removeItem("sempre-onboarding-complete");

  // 목업 연습 세션 제거 (IndexedDB)
  indexedDB.deleteDatabase("griton_db");
  indexedDB.deleteDatabase("sempre_db");

  // 서비스 워커 캐시 정리 (오래된 JS 번들 제거)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((reg) => reg.unregister())
    );
  }
  if ("caches" in window) {
    caches.keys().then((keys) =>
      keys.forEach((key) => caches.delete(key))
    );
  }

  localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
}

export default function SplashWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // mockups 경로는 스플래시 건너뛰기
    if (window.location.pathname.startsWith("/mockups")) {
      setSplashDone(true);
      return;
    }

    // 데이터 마이그레이션 (1회 실행)
    runDataMigration();

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
