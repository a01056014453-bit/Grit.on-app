"use client";

import { motion } from "framer-motion";

interface WaveTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  amplitude?: number;
  /** Stagger between each character's animation start */
  stagger?: number;
}

export default function WaveText({
  text,
  className = "",
  delay = 0,
  duration = 2,
  amplitude = 12,
  stagger = 0.06,
}: WaveTextProps) {
  return (
    <span className={`inline-flex ${className}`} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          style={{ whiteSpace: char === " " ? "pre" : undefined }}
          initial={{ y: 0, rotateZ: 0 }}
          animate={{
            y: [0, -amplitude, 0, amplitude * 0.4, 0],
            rotateZ: [0, -3, 0, 2, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            repeatDelay: 0.5,
            delay: delay + i * stagger,
            ease: "easeInOut",
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
