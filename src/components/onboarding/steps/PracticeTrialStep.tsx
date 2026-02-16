"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

const BlurText = dynamic(() => import("@/components/reactbits/BlurText"), {
  ssr: false,
});

interface PracticeTrialStepProps {
  onComplete: () => void;
}

export function PracticeTrialStep({ onComplete }: PracticeTrialStepProps) {
  const [status, setStatus] = useState<"waiting" | "recording" | "done">(
    "waiting"
  );
  const [seconds, setSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
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

  // Start mic listening on mount
  useEffect(() => {
    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        startListening();
      } catch {
        // Mic already denied - allow skip
      }
    };
    initMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const check = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalized = Math.min(avg / 80, 1);
      setAudioLevel(normalized);

      if (avg > 15) {
        setStatus((prev) => {
          if (prev === "waiting") {
            // Start timer
            recordingStartRef.current = Date.now();
            timerRef.current = setInterval(() => {
              const elapsed = Math.floor(
                (Date.now() - recordingStartRef.current) / 1000
              );
              setSeconds(elapsed);

              // Auto stop after 5-8 seconds
              if (elapsed >= 6) {
                if (timerRef.current) clearInterval(timerRef.current);
                setStatus("done");
              }
            }, 100);
            return "recording";
          }
          return prev;
        });
      }

      rafRef.current = requestAnimationFrame(check);
    };
    check();
  }, []);

  const handleFinish = () => {
    localStorage.setItem("grit-on-onboarding-complete", "true");
    cleanup();
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("grit-on-onboarding-complete", "true");
    cleanup();
    onComplete();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-3"
      >
        <BlurText
          text="연주 한 번 해보시겠어요?"
          className="text-xl font-bold text-white justify-center"
          animateBy="words"
          delay={80}
          direction="top"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-violet-300/60 text-sm mb-10"
      >
        소리를 내면 타이머가 올라가는 걸 확인해보세요
      </motion.p>

      {/* Timer Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className={`bg-white/5 backdrop-blur-xl border rounded-3xl px-12 py-10 mb-6 transition-all duration-300 ${
          status === "recording"
            ? "border-violet-400/50 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
            : status === "done"
            ? "border-green-400/50 shadow-[0_0_30px_rgba(74,222,128,0.2)]"
            : "border-white/15"
        }`}
      >
        <p
          className={`text-6xl font-bold font-number tracking-wider ${
            status === "done" ? "text-green-400" : "text-white"
          }`}
        >
          {formatTime(seconds)}
        </p>
      </motion.div>

      {/* Status Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 mb-8"
      >
        <div
          className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
            status === "recording"
              ? "bg-green-400 animate-pulse"
              : status === "done"
              ? "bg-green-400"
              : "bg-white/30"
          }`}
        />
        <span
          className={`text-sm ${
            status === "recording"
              ? "text-green-400 font-medium"
              : status === "done"
              ? "text-green-400 font-medium"
              : "text-white/50"
          }`}
        >
          {status === "recording"
            ? "연주 감지 중"
            : status === "done"
            ? "완벽해요! 이렇게 연습 시간이 기록됩니다"
            : "대기 중"}
        </span>
      </motion.div>

      {/* Audio level bar (during recording) */}
      {status === "recording" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-48 h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden"
        >
          <motion.div
            className="h-full bg-green-400 rounded-full"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </motion.div>
      )}

      {/* Done state */}
      {status === "done" && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl px-8 py-3 flex items-center gap-2 transition-colors active:scale-[0.97]"
        >
          시작하기
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}

      {/* Skip link */}
      {status !== "done" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={handleSkip}
          className="text-white/40 text-sm hover:text-white/60 transition-colors"
        >
          건너뛰기
        </motion.button>
      )}
    </div>
  );
}
