"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>{children}</div>
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
}

export function BentoCard({
  Icon,
  name,
  description,
  href,
  cta,
  className,
  background,
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
      <div className="relative z-10 px-4 pt-3 pb-3 mt-auto">
        <Icon className="w-5 h-5 text-violet-600 mb-1.5" />
        <h3 className="text-sm font-bold text-gray-900 leading-tight">
          {name}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
          {description}
        </p>
        <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-violet-600 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          {cta}
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}
