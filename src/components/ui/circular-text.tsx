"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface CircularTextProps {
  text: string;
  radius?: number;
  fontSize?: number;
  duration?: number;
  className?: string;
  textClassName?: string;
  direction?: "clockwise" | "counterclockwise";
  pauseOnHover?: boolean;
}

export function CircularText({
  text,
  radius = 80,
  fontSize = 14,
  duration = 20,
  className = "",
  textClassName = "",
  direction = "clockwise",
  pauseOnHover = true,
}: CircularTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const characters = text.split("");
  const angleStep = 360 / characters.length;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: radius * 2,
        height: radius * 2,
      }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: direction === "clockwise" ? 360 : -360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
        whileHover={pauseOnHover ? { animationPlayState: "paused" } : undefined}
        style={{ willChange: "transform" }}
      >
        {characters.map((char, index) => {
          const angle = index * angleStep;
          const radian = (angle * Math.PI) / 180;
          const x = radius + radius * Math.sin(radian) - fontSize / 2;
          const y = radius - radius * Math.cos(radian) - fontSize / 2;

          return (
            <span
              key={index}
              className={`absolute font-semibold ${textClassName}`}
              style={{
                left: x,
                top: y,
                fontSize,
                transform: `rotate(${angle}deg)`,
                transformOrigin: "center",
              }}
            >
              {char}
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}
