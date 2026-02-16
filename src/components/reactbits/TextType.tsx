"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TextTypeProps {
  text: string;
  /** Typing speed in ms per character */
  speed?: number;
  /** Delay before typing starts (ms) */
  delay?: number;
  className?: string;
  /** Show blinking cursor */
  showCursor?: boolean;
  /** Cursor character */
  cursor?: string;
  cursorClassName?: string;
  onComplete?: () => void;
}

export default function TextType({
  text,
  speed = 60,
  delay = 0,
  className = "",
  showCursor = true,
  cursor = "|",
  cursorClassName = "",
  onComplete,
}: TextTypeProps) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed, onComplete]);

  return (
    <span className={`inline-block ${className}`}>
      {displayed}
      {showCursor && !done && (
        <motion.span
          className={`inline-block ${cursorClassName}`}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        >
          {cursor}
        </motion.span>
      )}
    </span>
  );
}
