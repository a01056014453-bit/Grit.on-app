"use client";

import { useRef, useEffect, useMemo, useCallback, forwardRef } from "react";

interface VariableProximityProps {
  label: string;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  containerRef: React.RefObject<HTMLElement | null>;
  radius?: number;
  falloff?: "linear" | "exponential" | "gaussian";
  className?: string;
  style?: React.CSSProperties;
}

export const VariableProximity = forwardRef<HTMLSpanElement, VariableProximityProps>(
  (
    {
      label,
      fromFontVariationSettings,
      toFontVariationSettings,
      containerRef,
      radius = 50,
      falloff = "linear",
      className = "",
      style,
    },
    ref
  ) => {
    const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const interpolatedSettingsRef = useRef<string[]>([]);
    const positionRef = useRef({ x: 0, y: 0 });
    const lastPositionRef = useRef<{ x: number | null; y: number | null }>({
      x: null,
      y: null,
    });
    const rafRef = useRef<number>(0);

    const parsedSettings = useMemo(() => {
      const parseSettings = (settingsStr: string) =>
        new Map(
          settingsStr
            .split(",")
            .map((s) => s.trim())
            .map((s) => {
              const [name, value] = s.split(" ");
              return [name.replace(/['"]/g, ""), parseFloat(value)] as [string, number];
            })
        );

      const fromSettings = parseSettings(fromFontVariationSettings);
      const toSettings = parseSettings(toFontVariationSettings);

      return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
        axis,
        fromValue,
        toValue: toSettings.get(axis) ?? fromValue,
      }));
    }, [fromFontVariationSettings, toFontVariationSettings]);

    // Mouse/touch tracking
    useEffect(() => {
      const updatePosition = (x: number, y: number) => {
        if (containerRef?.current) {
          const rect = containerRef.current.getBoundingClientRect();
          positionRef.current = { x: x - rect.left, y: y - rect.top };
        }
      };

      const handleMouseMove = (ev: MouseEvent) =>
        updatePosition(ev.clientX, ev.clientY);
      const handleTouchMove = (ev: TouchEvent) => {
        const touch = ev.touches[0];
        updatePosition(touch.clientX, touch.clientY);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("touchmove", handleTouchMove);
      };
    }, [containerRef]);

    const calculateFalloff = useCallback(
      (distance: number) => {
        const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
        switch (falloff) {
          case "exponential":
            return norm ** 2;
          case "gaussian":
            return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
          case "linear":
          default:
            return norm;
        }
      },
      [radius, falloff]
    );

    // Animation frame loop
    useEffect(() => {
      const loop = () => {
        if (!containerRef?.current) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        const containerRect = containerRef.current.getBoundingClientRect();
        const { x, y } = positionRef.current;

        if (lastPositionRef.current.x === x && lastPositionRef.current.y === y) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        lastPositionRef.current = { x, y };

        letterRefs.current.forEach((letterRef, index) => {
          if (!letterRef) return;

          const rect = letterRef.getBoundingClientRect();
          const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
          const letterCenterY = rect.top + rect.height / 2 - containerRect.top;

          const distance = Math.sqrt(
            (positionRef.current.x - letterCenterX) ** 2 +
              (positionRef.current.y - letterCenterY) ** 2
          );

          if (distance >= radius) {
            letterRef.style.fontVariationSettings = fromFontVariationSettings;
            return;
          }

          const falloffValue = calculateFalloff(distance);
          const newSettings = parsedSettings
            .map(({ axis, fromValue, toValue }) => {
              const interpolatedValue =
                fromValue + (toValue - fromValue) * falloffValue;
              return `'${axis}' ${interpolatedValue}`;
            })
            .join(", ");

          interpolatedSettingsRef.current[index] = newSettings;
          letterRef.style.fontVariationSettings = newSettings;
        });

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafRef.current);
    }, [
      containerRef,
      radius,
      fromFontVariationSettings,
      parsedSettings,
      calculateFalloff,
    ]);

    const words = label.split(" ");
    let letterIndex = 0;

    return (
      <span
        ref={ref}
        className={className}
        style={{
          display: "inline",
          fontFamily: "'Roboto Flex', sans-serif",
          ...style,
        }}
      >
        {words.map((word, wordIndex) => (
          <span
            key={wordIndex}
            style={{ display: "inline-block", whiteSpace: "nowrap" }}
          >
            {word.split("").map((letter) => {
              const currentLetterIndex = letterIndex++;
              return (
                <span
                  key={currentLetterIndex}
                  ref={(el) => {
                    letterRefs.current[currentLetterIndex] = el;
                  }}
                  style={{
                    display: "inline-block",
                    fontVariationSettings:
                      interpolatedSettingsRef.current[currentLetterIndex],
                  }}
                  aria-hidden="true"
                >
                  {letter}
                </span>
              );
            })}
            {wordIndex < words.length - 1 && (
              <span style={{ display: "inline-block" }}>&nbsp;</span>
            )}
          </span>
        ))}
        <span className="sr-only">{label}</span>
      </span>
    );
  }
);

VariableProximity.displayName = "VariableProximity";
