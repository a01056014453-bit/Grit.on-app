"use client";

import { FeedbackRequestStatus, STATUS_LABELS, STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

interface RequestStatusChipProps {
  status: FeedbackRequestStatus;
  size?: "sm" | "md";
}

export function RequestStatusChip({
  status,
  size = "sm",
}: RequestStatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        STATUS_COLORS[status],
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-3 py-1 text-xs"
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
