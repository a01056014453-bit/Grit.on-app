"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  showLabel?: boolean;
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  className,
  showValue = true,
  showLabel = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const gradientId = `progress-gradient-${size}`;
  const glowId = `progress-glow-${size}`;
  const hasAnimated = useRef(false);

  // Animated stroke offset
  const motionProgress = useMotionValue(0);
  const springProgress = useSpring(motionProgress, {
    stiffness: 60,
    damping: 20,
    mass: 1,
  });
  const strokeDashoffset = useTransform(
    springProgress,
    (v: number) => circumference - (v / 100) * circumference
  );

  // Animated count-up number
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animate from 0 on first mount, then from previous to new value
    const from = hasAnimated.current ? motionProgress.get() : 0;
    hasAnimated.current = true;

    motionProgress.set(from);
    motionProgress.set(progress);

    // CountUp animation for the number
    const controls = animate(from, progress, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });

    return () => controls.stop();
  }, [progress, motionProgress]);

  // Glow intensity based on progress
  const glowOpacity = Math.min(progress / 100, 1) * 0.8 + 0.2;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.6}
        />

        {/* Animated progress arc with glow */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth + 4}
          fill="none"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          opacity={glowOpacity * 0.3}
          filter={`url(#${glowId})`}
        />

        {/* Main progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showLabel && (
            <span className="text-xs text-gray-500 mb-0.5">달성률</span>
          )}
          <span className="text-lg font-bold bg-gradient-to-r from-violet-700 to-violet-400 bg-clip-text text-transparent">
            {displayValue}%
          </span>
        </div>
      )}
    </div>
  );
}
