"use client";

import Link from "next/link";
import { Teacher, BADGE_LABELS } from "@/types";
import {
  Star,
  Clock,
  CheckCircle,
  BadgeCheck,
  Zap,
  Award,
  ChevronRight,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherCardProps {
  teacher: Teacher;
  showCTA?: boolean;
}

const badgeIcons: Record<string, typeof Zap> = {
  expert: Award,
  fast: Zap,
  top_rated: Star,
};

const badgeColors: Record<string, string> = {
  expert: "bg-violet-100 text-violet-700",
  fast: "bg-blue-100 text-blue-700",
  top_rated: "bg-amber-100 text-amber-700",
};

export function TeacherCard({ teacher, showCTA = true }: TeacherCardProps) {
  return (
    <Link
      href={`/teachers/${teacher.id}`}
      className="block bg-white/50 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-sm hover:shadow-md transition-all"
    >
      {/* Header with profile image and basic info */}
      <div className="flex gap-3 mb-3">
        {/* Profile Image */}
        <div className="relative w-14 h-14 shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-violet-200 flex items-center justify-center text-lg font-bold text-primary">
            {teacher.name.charAt(0)}
          </div>
          {teacher.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <BadgeCheck className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>

        {/* Name and Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-foreground truncate">
              {teacher.name}
            </h3>
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-bold">{teacher.rating}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {teacher.title}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-center gap-1 text-primary shrink-0">
          <Coins className="w-4 h-4" />
          <span className="font-bold">{teacher.priceCredits}</span>
        </div>
      </div>

      {/* Badges */}
      {teacher.badges.length > 0 && (
        <div className="flex gap-1.5 mb-3">
          {teacher.badges.map((badge) => {
            const Icon = badgeIcons[badge] || Award;
            return (
              <span
                key={badge}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                  badgeColors[badge]
                )}
              >
                <Icon className="w-3 h-3" />
                {BADGE_LABELS[badge]}
              </span>
            );
          })}
        </div>
      )}

      {/* Specialties */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {teacher.specialty.map((s) => (
          <span
            key={s}
            className="px-2 py-0.5 rounded-full bg-white/60 text-gray-600 text-[10px] font-medium"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-white/40">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            {teacher.completedCount}건 완료
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            평균 {teacher.avgResponseTime}시간
          </span>
        </div>
        {showCTA && (
          <ChevronRight className="w-4 h-4 text-primary" />
        )}
      </div>
    </Link>
  );
}
