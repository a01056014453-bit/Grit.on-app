"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

const CircularText = dynamic(
  () => import("@/components/ui/circular-text").then((mod) => mod.CircularText),
  { ssr: false }
);

const BlurText = dynamic(() => import("@/components/reactbits/BlurText"), {
  ssr: false,
});

interface MicPermissionStepProps {
  onNext: () => void;
}

export function MicPermissionStep({ onNext }: MicPermissionStepProps) {
  const [micState, setMicState] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");
  const [soundDetected, setSoundDetected] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startListening = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const check = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalized = Math.min(avg / 80, 1);
      setGlowIntensity(normalized);

      if (avg > 15) {
        setSoundDetected(true);
      }

      rafRef.current = requestAnimationFrame(check);
    };
    check();
  }, []);

  const requestMic = async () => {
    setMicState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setMicState("granted");
      startListening();
    } catch {
      setMicState("denied");
    }
  };

  const glowPx = 20 + glowIntensity * 60;
  const glowOpacity = 0.3 + glowIntensity * 0.5;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-2"
      >
        <BlurText
          text="AI 청각 동의 & 캘리브레이션"
          className="text-lg font-bold text-white justify-center"
          animateBy="words"
          delay={80}
          direction="top"
        />
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-violet-300/70 text-sm mb-10 leading-relaxed"
      >
        그릿온 AI는 당신의 악기 소리에만 반응합니다.
      </motion.p>

      {/* Circular Logo with Glow */}
      <motion.div
        className="relative mb-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
      >
        <div
          className="rounded-full transition-all duration-150"
          style={{
            boxShadow:
              micState === "granted"
                ? `0 0 ${glowPx}px rgba(139,92,246,${glowOpacity})`
                : "0 0 20px rgba(139,92,246,0.2)",
          }}
        >
          <CircularText
            text="GRIT.ON · CLASSICAL · PRACTICE · COACH · "
            radius={75}
            fontSize={10}
            duration={12}
            textClassName="text-violet-300/70 font-semibold tracking-[0.15em] uppercase"
            direction="clockwise"
          />
        </div>

        {/* Pulse rings when sound detected */}
        {micState === "granted" && glowIntensity > 0.1 && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-violet-400/40"
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-violet-400/20"
              animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.3,
              }}
            />
          </>
        )}
      </motion.div>

      {/* Mic Permission Card */}
      {micState === "idle" && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          onClick={requestMic}
          className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl px-8 py-5 flex flex-col items-center gap-3 active:scale-[0.97] transition-transform"
        >
          <div className="w-14 h-14 rounded-full bg-violet-600/30 flex items-center justify-center">
            <Mic className="w-7 h-7 text-violet-300" />
          </div>
          <span className="text-white font-semibold">마이크 권한 허용하기</span>
          <span className="text-violet-300/60 text-xs">
            연습 소리를 감지하기 위해 필요합니다
          </span>
        </motion.button>
      )}

      {micState === "requesting" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-violet-300/70 text-sm"
        >
          권한을 요청하고 있습니다...
        </motion.div>
      )}

      {micState === "denied" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
            <MicOff className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-red-300 text-sm">마이크 권한이 거부되었습니다.</p>
          <p className="text-violet-300/60 text-xs">
            설정에서 마이크 권한을 허용해주세요.
          </p>
          <button
            onClick={onNext}
            className="mt-4 text-violet-300/70 text-sm underline"
          >
            건너뛰기
          </button>
        </motion.div>
      )}

      {micState === "granted" && !soundDetected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <p className="text-white text-sm font-medium">
            가볍게 악기를 한 음 연주해보세요
          </p>
          <p className="text-violet-300/60 text-xs">소리를 감지하고 있습니다...</p>
          {/* Volume bar */}
          <div className="w-48 h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="h-full bg-violet-400 rounded-full"
              style={{ width: `${glowIntensity * 100}%` }}
            />
          </div>
        </motion.div>
      )}

      {micState === "granted" && soundDetected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-1"
          >
            <svg
              className="w-6 h-6 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
          <p className="text-white font-semibold">소리 감지 성공!</p>
          <p className="text-violet-300/70 text-xs">
            그릿온이 당신의 연주를 들을 준비가 되었습니다.
          </p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => {
              cleanup();
              onNext();
            }}
            className="mt-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl px-8 py-3 flex items-center gap-2 transition-colors active:scale-[0.97]"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
