"use client";

import { type ReactNode, type CSSProperties } from "react";

interface StarBorderProps {
  children: ReactNode;
  className?: string;
  color?: string;
  speed?: string;
  radius?: string;
  style?: CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
}

export function StarBorder({
  children,
  className = "",
  color = "rgba(139, 92, 246, 0.8)",
  speed = "4s",
  radius = "9999px",
  style,
  onClick,
  disabled,
}: StarBorderProps) {
  return (
    <button
      className={`star-border-btn ${className}`}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
        overflow: "hidden",
        padding: "3px",
        ...style,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <div
        className="star-gradient-bottom"
        style={{
          position: "absolute",
          width: "300%",
          height: "50%",
          opacity: 0.8,
          bottom: "-12px",
          right: "-250%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animation: `star-move-bottom ${speed} linear infinite alternate`,
          zIndex: 0,
        }}
      />
      <div
        className="star-gradient-top"
        style={{
          position: "absolute",
          width: "300%",
          height: "50%",
          opacity: 0.8,
          top: "-12px",
          left: "-250%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animation: `star-move-top ${speed} linear infinite alternate`,
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius,
        }}
      >
        {children}
      </div>
    </button>
  );
}
