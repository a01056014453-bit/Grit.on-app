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
      <div className="relative z-10 p-4 mt-auto">
        <Icon className="w-5 h-5 text-violet-600 mb-1.5" />
        <h3 className="text-sm font-bold text-gray-900 leading-tight">
          {name}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
          {description}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-violet-600 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
            {cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          {subLink && (
            <Link
              href={subLink.href}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-semibold text-violet-400 hover:text-violet-600 transition-colors opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 duration-200 ml-auto"
            >
              {subLink.label} →
            </Link>
          )}
        </div>
      </div>
    </Link>
  );
}
