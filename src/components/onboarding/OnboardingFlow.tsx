"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MicPermissionStep } from "./MicPermissionStep";
import { TimerSpotlightStep } from "./TimerSpotlightStep";
import { RankingStep } from "./RankingStep";
import { CoachingStep } from "./CoachingStep";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

const slideTransition = {
  type: "spring" as const,
  damping: 25,
  stiffness: 250,
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((prev) => prev + 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <MicPermissionStep onNext={nextStep} />;
      case 1:
        return <TimerSpotlightStep onNext={nextStep} />;
      case 2:
        return <RankingStep onNext={nextStep} />;
      case 3:
        return <CoachingStep onComplete={onComplete} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
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

      {/* Grain Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Step Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="flex-1 flex flex-col"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Step Indicator Dots */}
        <div className="relative z-10 flex items-center justify-center gap-2 pb-12">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              animate={{
                backgroundColor: i === step ? "#ffffff" : "rgba(255,255,255,0.3)",
                scale: i === step ? 1.2 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
