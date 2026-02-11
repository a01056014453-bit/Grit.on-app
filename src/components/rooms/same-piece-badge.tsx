"use client";

import { Users, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SamePieceBadgeProps {
  count: number;
  isUnlocked: boolean;
}

export function SamePieceBadge({ count, isUnlocked }: SamePieceBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        isUnlocked
          ? "bg-green-100 text-green-700"
          : "bg-secondary text-muted-foreground"
      )}
    >
      {isUnlocked ? (
        <Unlock className="w-3 h-3" />
      ) : (
        <Lock className="w-3 h-3" />
      )}
      <Users className="w-3 h-3" />
      <span>{count}명</span>
    </div>
  );
}
