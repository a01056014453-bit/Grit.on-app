"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover";
  onAnimationComplete?: () => void;
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className = "",
  encryptedClassName = "",
  animateOn = "view",
  onAnimationComplete,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const iterationRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getRandomChar = useCallback(() => {
    return characters[Math.floor(Math.random() * characters.length)];
  }, [characters]);

  const getRevealOrder = useCallback(
    (length: number) => {
      const indices = Array.from({ length }, (_, i) => i);
      switch (revealDirection) {
        case "end":
          return indices.reverse();
        case "center": {
          const mid = Math.floor(length / 2);
          const order: number[] = [];
          for (let i = 0; i <= mid; i++) {
            if (mid + i < length) order.push(mid + i);
            if (mid - i >= 0 && mid - i !== mid + i) order.push(mid - i);
          }
          return order;
        }
        default:
          return indices;
      }
    },
    [revealDirection]
  );

  const animate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    iterationRef.current = 0;
    setIsAnimating(true);

    const revealOrder = getRevealOrder(text.length);
    let revealedCount = 0;
    const revealedSet = new Set<number>();

    intervalRef.current = setInterval(() => {
      iterationRef.current += 1;

      if (sequential) {
        // In sequential mode, reveal one character at a time
        if (revealedCount < revealOrder.length) {
          // Reveal next character every maxIterations cycles
          if (iterationRef.current % maxIterations === 0) {
            revealedSet.add(revealOrder[revealedCount]);
            revealedCount++;
          }
        }

        setDisplayText(
          text
            .split("")
            .map((char, i) => {
              if (char === " ") return " ";
              if (revealedSet.has(i)) return char;
              return getRandomChar();
            })
            .join("")
        );

        if (revealedCount >= revealOrder.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDisplayText(text);
          setIsAnimating(false);
          setHasAnimated(true);
          onAnimationComplete?.();
        }
      } else {
        // Non-sequential: all characters scramble and reveal together
        setDisplayText(
          text
            .split("")
            .map((char) => {
              if (char === " ") return " ";
              if (iterationRef.current >= maxIterations) return char;
              return Math.random() > iterationRef.current / maxIterations
                ? getRandomChar()
                : char;
            })
            .join("")
        );

        if (iterationRef.current >= maxIterations) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDisplayText(text);
          setIsAnimating(false);
          setHasAnimated(true);
          onAnimationComplete?.();
        }
      }
    }, speed);
  }, [
    text,
    speed,
    maxIterations,
    sequential,
    getRandomChar,
    getRevealOrder,
    onAnimationComplete,
  ]);

  // View-based animation with IntersectionObserver
  useEffect(() => {
    if (animateOn !== "view") return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          animate();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animateOn, animate, hasAnimated]);

  // Hover-based animation
  const handleMouseEnter = () => {
    if (animateOn !== "hover") return;
    setIsHovering(true);
    if (!isAnimating) animate();
  };

  const handleMouseLeave = () => {
    if (animateOn !== "hover") return;
    setIsHovering(false);
  };

  return (
    <motion.span
      ref={containerRef}
      className={`inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {displayText.split("").map((char, index) => {
        const isRevealed = char === text[index];
        return (
          <span
            key={index}
            className={isRevealed ? "" : encryptedClassName}
          >
            {char}
          </span>
        );
      })}
    </motion.span>
  );
}
