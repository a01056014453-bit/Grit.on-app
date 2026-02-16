"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const TextType = dynamic(() => import("@/components/reactbits/TextType"), {
  ssr: false,
});

const BlurText = dynamic(() => import("@/components/reactbits/BlurText"), {
  ssr: false,
});

interface LoginStepProps {
  onLogin: () => void;
}

type Phase = "typing" | "fadeOut" | "logo" | "login";

const SERIF = { fontFamily: "'Playfair Display', serif" };

/** 떠다니는 빛 입자 */
function FloatingParticles({ count = 20 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 4,
        drift: 15 + Math.random() * 30,
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [-p.drift, p.drift, -p.drift],
            x: [-p.drift * 0.5, p.drift * 0.5, -p.drift * 0.5],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** 로고 뒤 글로우 펄스 */
function GlowPulse() {
  return (
    <motion.div
      className="absolute w-[280px] h-[280px] rounded-full bg-violet-500/20 blur-[80px]"
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.15, 0.35, 0.15],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function LoginStep({ onLogin }: LoginStepProps) {
  const [phase, setPhase] = useState<Phase>("typing");

  const handleTypingComplete = useCallback(() => {
    setTimeout(() => setPhase("fadeOut"), 600);
  }, []);

  // Phase 2 (logo) → Phase 3 (login) 전환: 로고 등장 후 2초 대기
  useEffect(() => {
    if (phase !== "logo") return;
    const timer = setTimeout(() => setPhase("login"), 2800);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleLogin = () => {
    localStorage.setItem("grit-on-logged-in", "true");
    onLogin();
  };

  const loginButtons = [
    {
      key: "kakao",
      label: "카카오로 시작하기",
      className: "bg-[#FEE500] text-[#3C1E1E]",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.8 5.22 4.51 6.6-.2.74-.72 2.68-.82 3.1-.13.5.18.49.38.36.16-.1 2.5-1.7 3.51-2.39.79.12 1.6.18 2.42.18 5.52 0 10-3.58 10-7.9C22 6.58 17.52 3 12 3z" />
        </svg>
      ),
    },
    {
      key: "apple",
      label: "Apple로 계속하기",
      className: "bg-white text-black hover:bg-gray-100",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      ),
    },
    {
      key: "google",
      label: "Google로 계속하기",
      className:
        "bg-white/10 text-white border border-white/20 hover:bg-white/15",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* 전체 배경 파티클 */}
      <FloatingParticles count={24} />

      {/* ── Phase 1: TextType only ── */}
      <AnimatePresence>
        {(phase === "typing" || phase === "fadeOut") && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center px-8"
            animate={{
              opacity: phase === "fadeOut" ? 0 : 1,
              y: phase === "fadeOut" ? -30 : 0,
              filter: phase === "fadeOut" ? "blur(8px)" : "blur(0px)",
            }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => {
              if (phase === "fadeOut") setPhase("logo");
            }}
          >
            {/* 타이핑 텍스트 뒤 은은한 글로우 */}
            <motion.div
              className="absolute w-[200px] h-[60px] rounded-full bg-violet-400/15 blur-[40px]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <TextType
              text="Practice always, Grow forever."
              speed={50}
              delay={300}
              className="text-2xl text-white font-bold italic tracking-wide relative z-10"
              style={SERIF}
              showCursor
              cursor="|"
              cursorClassName="text-violet-400/70 ml-0.5 font-light"
              onComplete={handleTypingComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 2: Sempre Logo Reveal ── */}
      <AnimatePresence>
        {phase === "logo" && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
            transition={{ duration: 0.6 }}
          >
            {/* 로고 뒤 글로우 펄스 */}
            <GlowPulse />

            {/* Sempre 로고 이미지 (흰색) + 블러 등장 + 물결 효과 */}
            <motion.img
              src="/sempre-logo.png"
              alt="Sempre"
              className="relative z-10 w-32 h-32 object-contain brightness-0 invert"
              initial={{ opacity: 0, filter: "blur(10px) brightness(0) invert(1)", y: 50 }}
              animate={{
                opacity: 1,
                filter: "blur(0px) brightness(0) invert(1)",
                y: 0,
                rotate: [0, -3, 3, -2, 2, 0],
                scale: [1, 1.03, 0.97, 1.02, 0.98, 1],
              }}
              transition={{
                opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                filter: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                y: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                rotate: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
              }}
            />

            {/* 빛줄기 */}
            <motion.div
              className="relative z-10 mt-6 h-[1px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
            />

            {/* 로고 아래 장식 링 */}
            <motion.div
              className="absolute w-[320px] h-[320px] rounded-full border border-white/[0.04]"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 360 }}
              transition={{
                scale: { delay: 0.3, duration: 1.2, ease: "easeOut" },
                opacity: { delay: 0.3, duration: 0.8 },
                rotate: { duration: 40, repeat: Infinity, ease: "linear" },
              }}
            />
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full border border-white/[0.03]"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: -360 }}
              transition={{
                scale: { delay: 0.5, duration: 1.4, ease: "easeOut" },
                opacity: { delay: 0.5, duration: 0.8 },
                rotate: { duration: 55, repeat: Infinity, ease: "linear" },
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 3: Login Page ── */}
      <AnimatePresence>
        {phase === "login" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col h-full"
          >
            {/* Top - Branding */}
            <div className="flex flex-1 flex-col items-center justify-center px-8 relative">
              {/* 로고 뒤 호흡하는 글로우 */}
              <motion.div
                className="absolute w-[160px] h-[160px] rounded-full bg-violet-500/15 blur-[60px]"
                animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-3 relative z-10"
              >
                <img
                  src="/sempre-logo.png"
                  alt="Sempre"
                  className="w-28 h-28 object-contain brightness-0 invert"
                />
              </motion.div>
            </div>

            {/* Bottom - Login Buttons (staggered) */}
            <div className="px-6 pb-12">
              <div className="flex flex-col gap-3">
                {loginButtons.map((btn, i) => (
                  <motion.button
                    key={btn.key}
                    onClick={handleLogin}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.4 + i * 0.1,
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`flex h-14 w-full items-center justify-center gap-3 rounded-2xl font-semibold transition-all active:scale-[0.98] ${btn.className}`}
                  >
                    {btn.icon}
                    {btn.label}
                  </motion.button>
                ))}

                {/* Guest */}
                <motion.button
                  onClick={handleLogin}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="flex h-12 w-full items-center justify-center text-white/50 font-medium transition-colors hover:text-white"
                >
                  둘러보기
                </motion.button>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="mt-6 text-center text-xs text-white/30"
              >
                계속하면 <span className="underline">서비스 약관</span> 및{" "}
                <span className="underline">개인정보 처리방침</span>에 동의하게 됩니다.
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
