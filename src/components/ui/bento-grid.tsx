"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn("grid grid-cols-5 gap-3", className)}>{children}</div>
  );
}

interface BentoCardProps {
  Icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  href: string;
  cta: string;
  className?: string;
  background?: ReactNode;
  subLink?: { label: string; href: string };
}

export function BentoCard({
  Icon,
  name,
  description,
  href,
  cta,
  className,
  background,
  subLink,
}: BentoCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white/50 backdrop-blur-xl border border-white/60 shadow-sm transition-all hover:shadow-md hover:bg-white/70 active:scale-[0.98]",
        "flex flex-col justify-end",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">{background}</div>

      {/* Content - pinned to bottom */}
      <div className="relative z-10 px-4 pt-3 pb-2.5 mt-auto">
        <Icon className="w-5 h-5 text-violet-600 mb-1.5" />
        <h3 className="text-sm font-bold text-gray-900 leading-tight">
          {name}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
          {description}
        </p>
      </div>
    </Link>
  );
}
