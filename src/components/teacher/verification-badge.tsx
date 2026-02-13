"use client";

import { Shield, Clock, XCircle } from "lucide-react";
import { TeacherVerificationStatus } from "@/types";

interface VerificationBadgeProps {
  status: TeacherVerificationStatus;
  size?: "sm" | "md";
}

export function VerificationBadge({ status, size = "sm" }: VerificationBadgeProps) {
  if (status === "none") return null;

  const config = {
    pending: {
      icon: Clock,
      label: "심사중",
      className: "bg-amber-100 text-amber-700",
    },
    approved: {
      icon: Shield,
      label: "인증됨",
      className: "bg-green-100 text-green-700",
    },
    rejected: {
      icon: XCircle,
      label: "반려",
      className: "bg-red-100 text-red-700",
    },
  }[status];

  if (!config) return null;

  const Icon = config.icon;
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.className} ${sizeClass}`}>
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}
